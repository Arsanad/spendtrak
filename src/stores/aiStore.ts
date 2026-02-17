/**
 * AI Store
 * Manages AI Financial Consultant state
 */

import { create } from 'zustand';
import * as aiService from '@/services/ai';
import { RateLimitError, AIUsageStatus, checkRateLimit } from '@/services/ai';
import type {
  AIConversation,
  AIMessage,
  AIInsight,
  FinancialHealthScore,
} from '@/types';

// Memory limits to prevent unbounded growth
const MAX_CONVERSATIONS = 20;
const MAX_MESSAGES_PER_CONVERSATION = 100;

// DEV OVERRIDE — direct VIP check (redundant safety net)
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];
function _isVIPUser(): boolean {
  try {
    const { useAuthStore } = require('@/stores/authStore');
    const email = useAuthStore.getState().user?.email?.toLowerCase();
    return !!email && VIP_EMAILS.includes(email);
  } catch {
    return false;
  }
}

/** Premium usage status for VIP/dev users */
const VIP_USAGE_STATUS: AIUsageStatus = {
  canSend: true,
  messagesUsed: 0,
  messagesLimit: -1,
  resetTime: null,
  minutesUntilReset: 0,
  isPremium: true,
};

interface AIState {
  // State
  conversations: AIConversation[];
  currentConversation: AIConversation | null;
  healthScore: FinancialHealthScore | null;
  quickInsights: AIInsight[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;

  // Rate limiting state
  usageStatus: AIUsageStatus | null;
  isRateLimited: boolean;
  rateLimitMessage: string | null;

  // Actions
  fetchConversations: () => Promise<void>;
  createConversation: () => Promise<AIConversation>;
  setCurrentConversation: (conversation: AIConversation | null) => void;
  sendMessage: (message: string) => Promise<string>;
  fetchHealthScore: () => Promise<void>;
  fetchQuickInsights: () => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  clearError: () => void;

  // Rate limiting actions
  checkUsageStatus: () => Promise<void>;
  clearRateLimitError: () => void;
}

export const useAIStore = create<AIState>((set, get) => ({
  // Initial state
  conversations: [],
  currentConversation: null,
  healthScore: null,
  quickInsights: [],
  isLoading: false,
  isSending: false,
  error: null,

  // Rate limiting state
  usageStatus: null,
  isRateLimited: false,
  rateLimitMessage: null,

  // Fetch conversations
  fetchConversations: async () => {
    try {
      set({ isLoading: true, error: null });
      const conversations = await aiService.getConversations();
      // Limit cached conversations to prevent memory bloat
      set({ conversations: conversations.slice(0, MAX_CONVERSATIONS), isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Create new conversation
  createConversation: async () => {
    try {
      set({ isLoading: true, error: null });
      const conversation = await aiService.createConversation();

      // Limit stored conversations
      const existingConversations = get().conversations;
      const newConversations = [conversation, ...existingConversations].slice(0, MAX_CONVERSATIONS);

      set({
        currentConversation: conversation,
        conversations: newConversations,
        isLoading: false,
      });

      return conversation;
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
      throw error;
    }
  },

  // Set current conversation
  setCurrentConversation: (conversation) => {
    set({ currentConversation: conversation });
  },

  // Send message
  sendMessage: async (message) => {
    const { currentConversation } = get();

    try {
      set({ isSending: true, error: null, isRateLimited: false, rateLimitMessage: null });

      // Optimistically add user message
      if (currentConversation) {
        const userMessage: AIMessage = {
          role: 'user',
          content: message,
          timestamp: new Date().toISOString(),
        };

        set({
          currentConversation: {
            ...currentConversation,
            messages: [...currentConversation.messages, userMessage],
          },
        });
      }

      const response = await aiService.sendMessage({
        message,
        conversation_id: currentConversation?.id,
      });

      // Update conversation with response
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response.message,
        timestamp: new Date().toISOString(),
      };

      const updatedConversation = get().currentConversation;
      if (updatedConversation) {
        // Limit messages per conversation to prevent memory bloat
        const allMessages = [...updatedConversation.messages, assistantMessage];
        const limitedMessages = allMessages.length > MAX_MESSAGES_PER_CONVERSATION
          ? allMessages.slice(-MAX_MESSAGES_PER_CONVERSATION)
          : allMessages;

        set({
          currentConversation: {
            ...updatedConversation,
            messages: limitedMessages,
          },
          isSending: false,
        });
      }

      // Refresh usage status after successful send
      get().checkUsageStatus();

      return response.message;
    } catch (error) {
      // Handle rate limit error specifically
      if (error instanceof RateLimitError) {
        // Remove optimistic message on rate limit error
        if (currentConversation) {
          set({
            currentConversation: {
              ...currentConversation,
              messages: currentConversation.messages,
            },
          });
        }
        set({
          isRateLimited: true,
          rateLimitMessage: error.message,
          usageStatus: error.usage,
          isSending: false,
          error: null,
        });
        throw error;
      }

      // Remove optimistic message on other errors
      if (currentConversation) {
        set({
          currentConversation: {
            ...currentConversation,
            messages: currentConversation.messages.slice(0, -1),
          },
          error: (error as Error).message,
          isSending: false,
        });
      }
      throw error;
    }
  },

  // Fetch health score
  fetchHealthScore: async () => {
    try {
      set({ isLoading: true });
      const healthScore = await aiService.getFinancialHealthScore();
      set({ healthScore, isLoading: false });
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoading: false,
      });
    }
  },

  // Fetch quick insights
  fetchQuickInsights: async () => {
    try {
      const insights = await aiService.getQuickInsights();
      set({ quickInsights: insights });
    } catch (error) {
      // Silent fail
    }
  },

  // Archive conversation
  archiveConversation: async (id) => {
    try {
      await aiService.archiveConversation(id);

      const { conversations, currentConversation } = get();
      set({
        conversations: conversations.filter((c) => c.id !== id),
        currentConversation:
          currentConversation?.id === id ? null : currentConversation,
      });
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Check usage status
  checkUsageStatus: async () => {
    // DEV OVERRIDE: VIP users always get unlimited — skip DB check entirely
    if (_isVIPUser()) {
      set({
        usageStatus: VIP_USAGE_STATUS,
        isRateLimited: false,
        rateLimitMessage: null,
      });
      return;
    }

    try {
      const usageStatus = await checkRateLimit();
      set({
        usageStatus,
        isRateLimited: !usageStatus.canSend,
        rateLimitMessage: !usageStatus.canSend
          ? usageStatus.isPremium
            ? `Rate limit reached. Try again in ${usageStatus.minutesUntilReset} minutes.`
            : 'AI Financial Consultant requires a Premium subscription.'
          : null,
      });
    } catch (error) {
      // Fail silently - don't block usage on check failure
    }
  },

  // Clear rate limit error
  clearRateLimitError: () => set({
    isRateLimited: false,
    rateLimitMessage: null,
  }),
}));
