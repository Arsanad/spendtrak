// SPENDTRAK CINEMATIC EDITION - AI Consultant Modal
import React, { useState, useRef } from 'react';
import { View, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { AtmosphericFog } from '../../src/components/effects/AtmosphericFog';
import { CosmicEye } from '../../src/components/effects/CosmicEye';
import { GradientText, GradientTitle } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { IconButton } from '../../src/components/ui/Button';
import { CloseIcon, ChevronUpIcon } from '../../src/components/icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const initialMessages: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m Jacob, your AI financial advisor. I can help you with budgeting, spending analysis, and financial planning. What would you like to discuss today?',
    timestamp: new Date(),
  },
];

export default function AIConsultantModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = () => {
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
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Based on your spending patterns, I notice you\'ve been spending more on dining out this month. Would you like me to suggest some ways to optimize your food budget while still enjoying good meals?',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 1500);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  return (
    <View style={styles.container}>
      <AtmosphericFog intensity="subtle" showParticles />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <IconButton icon={<CloseIcon size={20} color={Colors.text.primary} />} onPress={() => router.back()} variant="ghost" />
        </View>
        <View style={styles.headerCenter}>
          <CosmicEye size={40} active blinking glowing />
          <GradientText variant="bright" style={styles.headerTitle}>Jacob</GradientText>
          <GradientText variant="muted" style={styles.headerSubtitle}>AI Financial Advisor</GradientText>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isTyping && <TypingIndicator />}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || Spacing.md }]}>
          <LinearGradient
            colors={[Colors.transparent.dark60, Colors.void]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.inputGradient}
          />
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
              <LinearGradient
                colors={inputText.trim() ? Colors.gradients.buttonPrimary : [Colors.dark, Colors.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <ChevronUpIcon size={20} color={inputText.trim() ? Colors.void : Colors.text.disabled} />
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.assistantMessage]}>
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <CosmicEye size={32} active={false} blinking={false} glowing={false} />
        </View>
      )}
      <GlassCard
        variant={isUser ? 'filled' : 'default'}
        size="compact"
        style={[styles.messageCard, isUser && styles.userMessageCard]}
      >
        <GradientText variant={isUser ? 'bright' : 'subtle'} style={styles.messageText}>
          {message.content}
        </GradientText>
      </GlassCard>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View style={[styles.messageBubble, styles.assistantMessage]}>
      <View style={styles.assistantAvatar}>
        <CosmicEye size={32} active blinking glowing />
      </View>
      <GlassCard variant="default" size="compact" style={styles.messageCard}>
        <View style={styles.typingDots}>
          <View style={[styles.typingDot, styles.typingDot1]} />
          <View style={[styles.typingDot, styles.typingDot2]} />
          <View style={[styles.typingDot, styles.typingDot3]} />
        </View>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.subtle,
  },
  headerLeft: {
    width: 44,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    width: 44,
  },
  headerTitle: {
    marginTop: Spacing.xs,
  },
  headerSubtitle: {},
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  assistantAvatar: {
    marginRight: Spacing.sm,
    alignSelf: 'flex-end',
  },
  messageCard: {
    maxWidth: '100%',
  },
  userMessageCard: {
    backgroundColor: Colors.transparent.neon20,
  },
  messageText: {
    lineHeight: 22,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neon,
    marginHorizontal: 2,
    opacity: 0.5,
  },
  typingDot1: { opacity: 1 },
  typingDot2: { opacity: 0.7 },
  typingDot3: { opacity: 0.4 },
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  inputGradient: {
    position: 'absolute',
    top: -20,
    left: 0,
    right: 0,
    height: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.darker,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.xs,
    paddingVertical: Spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButton: {
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
