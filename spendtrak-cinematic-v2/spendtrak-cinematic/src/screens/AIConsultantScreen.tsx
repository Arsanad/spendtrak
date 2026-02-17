// SPENDTRAK CINEMATIC EDITION - AI Consultant Modal
// Location: app/(modals)/ai-consultant.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, Easing } from 'react-native-reanimated';
import { Colors, Spacing, FontFamily, FontSize, BorderRadius } from '@/design/cinematic';
import { AtmosphericFog } from '@/components/effects';
import { CosmicEye } from '@/components/icons/CosmicEye';
import { GradientText, GradientLabel } from '@/components/ui/GradientText';
import { GlassCard } from '@/components/ui/GlassCard';
import { CloseIcon, ChevronUpIcon } from '@/components/icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  'How can I save more money?',
  'Analyze my spending habits',
  'Am I on track with my budget?',
  'Suggest ways to reduce expenses',
];

export default function AIConsultantScreen() {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm Jacob, your AI financial consultant. I can help you analyze your spending, create budgets, and provide personalized financial advice. How can I assist you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const pulseAnim = useSharedValue(1);

  useEffect(() => {
    if (isTyping) {
      pulseAnim.value = withRepeat(
        withTiming(1.1, { duration: 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );
    } else {
      pulseAnim.value = withSpring(1);
    }
  }, [isTyping]);

  const eyePulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: generateResponse(userMessage.content),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);

    // Scroll to bottom
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const generateResponse = (input: string): string => {
    // Simple mock responses - replace with actual AI integration
    const lowerInput = input.toLowerCase();
    if (lowerInput.includes('save') || lowerInput.includes('saving')) {
      return "Based on your spending patterns, here are some ways to save more:\n\n1. **Reduce dining out** - You spent AED 850 on restaurants last month. Try meal prepping.\n\n2. **Review subscriptions** - I noticed 3 streaming services. Consider consolidating.\n\n3. **Set up auto-transfer** - Automatically move 20% of income to savings.\n\nWould you like me to create a savings plan for you?";
    }
    if (lowerInput.includes('budget') || lowerInput.includes('spending')) {
      return "Looking at your budget progress:\n\n• **Food**: 75% used (AED 750/1,000)\n• **Transport**: 45% used (AED 225/500)\n• **Shopping**: 90% used (AED 450/500) ⚠️\n\nYour shopping budget is nearly depleted. Consider waiting until next month for non-essential purchases.";
    }
    return "I understand you're asking about your finances. To give you the best advice, I analyze your transaction history, budget progress, and financial goals. What specific area would you like me to focus on?";
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputText(prompt);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <AtmosphericFog intensity="normal" showParticles particleCount={30} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Animated.View style={eyePulseStyle}>
            <CosmicEye size={56} active blinking glowing />
          </Animated.View>
          <View style={styles.headerInfo}>
            <GradientText variant="bright" style={styles.aiName}>Jacob</GradientText>
            <Text style={styles.aiStatus}>{isTyping ? 'Thinking...' : 'AI Financial Consultant'}</Text>
          </View>
        </View>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <CloseIcon size={24} color={Colors.text.primary} />
        </Pressable>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageWrapper,
              message.role === 'user' ? styles.userMessageWrapper : styles.aiMessageWrapper,
            ]}
          >
            {message.role === 'assistant' && (
              <View style={styles.aiAvatarSmall}>
                <CosmicEye size={32} active={false} blinking={false} glowing={false} />
              </View>
            )}
            <View
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.aiBubble,
              ]}
            >
              {message.role === 'user' ? (
                <LinearGradient
                  colors={Colors.gradients.buttonPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              ) : null}
              <Text style={[styles.messageText, message.role === 'user' && styles.userMessageText]}>
                {message.content}
              </Text>
            </View>
          </View>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <View style={[styles.messageWrapper, styles.aiMessageWrapper]}>
            <View style={styles.aiAvatarSmall}>
              <CosmicEye size={32} active blinking glowing />
            </View>
            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
              <View style={styles.typingDots}>
                <View style={[styles.dot, styles.dot1]} />
                <View style={[styles.dot, styles.dot2]} />
                <View style={[styles.dot, styles.dot3]} />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested Prompts */}
      {messages.length <= 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestedContainer}
        >
          {SUGGESTED_PROMPTS.map((prompt, index) => (
            <Pressable
              key={index}
              onPress={() => handleSuggestedPrompt(prompt)}
              style={styles.suggestedChip}
            >
              <Text style={styles.suggestedText}>{prompt}</Text>
            </Pressable>
          ))}
        </ScrollView>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + Spacing.sm }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask Jacob anything..."
              placeholderTextColor={Colors.text.disabled}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
            />
            <Pressable
              onPress={sendMessage}
              style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
              disabled={!inputText.trim()}
            >
              <ChevronUpIcon size={24} color={inputText.trim() ? Colors.void : Colors.text.disabled} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerInfo: {
    marginLeft: Spacing.md,
  },
  aiName: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.h4,
  },
  aiStatus: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.caption,
    color: Colors.text.tertiary,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  aiAvatarSmall: {
    marginRight: Spacing.sm,
    marginTop: Spacing.xs,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  userBubble: {
    backgroundColor: Colors.neon,
    borderBottomRightRadius: BorderRadius.xs,
  },
  aiBubble: {
    backgroundColor: Colors.darker,
    borderWidth: 1,
    borderColor: Colors.border.default,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    lineHeight: 22,
  },
  userMessageText: {
    color: Colors.void,
  },
  typingBubble: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neon,
    opacity: 0.5,
  },
  dot1: { opacity: 1 },
  dot2: { opacity: 0.7 },
  dot3: { opacity: 0.4 },
  suggestedContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  suggestedChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.transparent.dark30,
    borderRadius: BorderRadius.chip,
    borderWidth: 1,
    borderColor: Colors.border.default,
    marginRight: Spacing.sm,
  },
  suggestedText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.bodySmall,
    color: Colors.text.secondary,
  },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.subtle,
    backgroundColor: Colors.void,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.darker,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    maxHeight: 100,
    paddingVertical: Spacing.xs,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.dark,
  },
});
