/**
 * AI Consultant Edge Function
 * Provides personalized financial advice using GPT-4o
 *
 * NOTE: This function uses OpenAI GPT-4o instead of Gemini for the following reasons:
 * 1. GPT-4o provides superior conversational quality for nuanced financial coaching
 * 2. Better at maintaining context across multi-turn conversations
 * 3. More consistent formatting for financial recommendations
 *
 * The app also uses Gemini (via ai-chat Edge Function) for quick Q&A responses.
 * This dual-provider approach optimizes cost vs quality for different use cases.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCors } from '../_shared/cors.ts';

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!;

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');

  try {
    // ===== SECURITY: Require JWT authentication =====
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
      );
    }
    // ===== END AUTH BLOCK =====

    const body = await req.json();
    const { action, messages, context } = body;
    const user_id = user.id; // From JWT - cannot be spoofed

    // Handle different actions
    if (action === 'health_score') {
      return await calculateHealthScore(context, supabase, origin);
    }

    if (action === 'quick_insights') {
      return await generateQuickInsights(user_id, supabase, origin);
    }

    // Default: Chat with AI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content;

    // Generate suggestions based on response
    const suggestions = extractSuggestions(aiMessage);

    return new Response(
      JSON.stringify({
        message: aiMessage,
        suggestions,
      }),
      { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI Consultant error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateHealthScore(context: any, supabase: any, origin: string | null) {
  // Calculate financial health score based on user data
  const scores = {
    savings_rate: calculateSavingsScore(context),
    spending_control: calculateSpendingControlScore(context),
    subscription_health: calculateSubscriptionScore(context),
    goal_progress: calculateGoalScore(context),
    budget_adherence: calculateBudgetScore(context),
  };

  // Calculate overall score (weighted average)
  const weights = {
    savings_rate: 0.25,
    spending_control: 0.25,
    subscription_health: 0.15,
    goal_progress: 0.2,
    budget_adherence: 0.15,
  };

  const overallScore = Object.entries(scores).reduce((sum, [key, data]) => {
    return sum + (data.score * weights[key as keyof typeof weights]);
  }, 0);

  // Generate recommendations using GPT
  const prompt = `Based on this financial health data:
- Savings rate: ${scores.savings_rate.value}% (score: ${scores.savings_rate.score}/100)
- Monthly spending: ${context.currency || 'USD'} ${context.totalSpentThisMonth}
- Subscriptions: ${context.currency || 'USD'} ${context.subscriptionTotal}/month
- Goals: ${context.goals?.length || 0} active

Provide 3 specific, actionable recommendations to improve financial health. Be specific with numbers and actions.`;

  const gptResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  });

  const gptData = await gptResponse.json();
  const recommendations = gptData.choices[0]?.message?.content
    ?.split('\n')
    .filter((line: string) => line.trim())
    .slice(0, 3) || [];

  return new Response(
    JSON.stringify({
      overall_score: Math.round(overallScore),
      components: scores,
      recommendations,
      trend: 'stable', // Would calculate from historical data
    }),
    { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
  );
}

function calculateSavingsScore(context: any) {
  // Assuming income can be inferred or is provided
  const savingsRate = 15; // Placeholder
  const benchmark = 20;
  const score = Math.min(100, (savingsRate / benchmark) * 100);
  return { score: Math.round(score), value: savingsRate, benchmark };
}

function calculateSpendingControlScore(context: any) {
  // Check spending volatility
  const score = 70; // Placeholder
  return { score, value: score, benchmark: 100 };
}

function calculateSubscriptionScore(context: any) {
  const unusedRatio = 0; // Would calculate from unused subscriptions
  const score = Math.max(0, 100 - (unusedRatio * 100));
  return { score: Math.round(score), value: 100 - unusedRatio, benchmark: 10 };
}

function calculateGoalScore(context: any) {
  if (!context.goals?.length) {
    return { score: 50, value: 0, benchmark: 50 };
  }

  const avgProgress = context.goals.reduce((sum: number, g: any) => {
    return sum + (g.current / g.target) * 100;
  }, 0) / context.goals.length;

  return { score: Math.min(100, Math.round(avgProgress)), value: avgProgress, benchmark: 50 };
}

function calculateBudgetScore(context: any) {
  // Would calculate from budget adherence
  return { score: 80, value: 80, benchmark: 90 };
}

async function generateQuickInsights(userId: string, supabase: any, origin: string | null) {
  // Get user's recent data
  const [transactionsResult, subscriptionsResult, alertsResult] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, category:categories(name)')
      .eq('user_id', userId)
      .gte('transaction_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
    supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active'),
    supabase
      .from('savings_log')
      .select('amount')
      .eq('user_id', userId)
      .gte('saved_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
  ]);

  const insights = [];

  // Check for unused subscriptions
  const unusedSubs = (subscriptionsResult.data || []).filter((s: any) => {
    if (!s.last_used_at) return true;
    const daysSince = (Date.now() - new Date(s.last_used_at).getTime()) / (1000 * 60 * 60 * 24);
    return daysSince > 30;
  });

  if (unusedSubs.length > 0) {
    const totalWaste = unusedSubs.reduce((sum: number, s: any) => sum + s.amount, 0);
    insights.push({
      type: 'warning',
      title: 'Unused Subscriptions Found',
      description: `You have ${unusedSubs.length} subscription${unusedSubs.length > 1 ? 's' : ''} you haven't used in 30+ days. Cancel them to save $${totalWaste.toFixed(0)}/month.`,
      action: { label: 'Review Subscriptions', url: '/subscriptions' },
    });
  }

  // Calculate total savings
  const totalSaved = (alertsResult.data || []).reduce((sum: number, s: any) => sum + s.amount, 0);
  if (totalSaved > 0) {
    insights.push({
      type: 'achievement',
      title: 'Great Savings!',
      description: `You've saved $${totalSaved.toFixed(0)} this month using SpendTrak. Keep it up!`,
    });
  }

  // Category spending insight
  const categoryTotals = new Map<string, number>();
  (transactionsResult.data || []).forEach((tx: any) => {
    const cat = tx.category?.name || 'Other';
    categoryTotals.set(cat, (categoryTotals.get(cat) || 0) + tx.amount);
  });

  const topCategory = Array.from(categoryTotals.entries())
    .sort((a, b) => b[1] - a[1])[0];

  if (topCategory) {
    insights.push({
      type: 'tip',
      title: `${topCategory[0]} is Your Top Spending`,
      description: `You've spent $${topCategory[1].toFixed(0)} on ${topCategory[0]} this month. Consider setting a budget to keep track.`,
      action: { label: 'Set Budget', url: '/settings/budgets' },
    });
  }

  return new Response(
    JSON.stringify({ insights }),
    { headers: { ...getCorsHeaders(origin), 'Content-Type': 'application/json' } }
  );
}

function extractSuggestions(message: string): string[] {
  // Extract potential follow-up questions
  const suggestions = [
    'How can I reduce my spending?',
    'Set a budget for this category',
    'Show me my spending trends',
  ];
  return suggestions.slice(0, 3);
}
