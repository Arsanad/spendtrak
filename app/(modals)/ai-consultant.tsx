// SPENDTRAK CINEMATIC EDITION - AI Consultant Modal
// OPTIMIZED for performance: simplified icons, batched updates, memoization
import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { View, ScrollView, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Pressable, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../src/design/cinematic';
import { easeInOutQuad } from '../../src/config/easingFunctions';
import { useTranslation } from '../../src/context/LanguageContext';
import { GradientText } from '../../src/components/ui/GradientText';
import { GlassCard } from '../../src/components/ui/GlassCard';
import { IconButton } from '../../src/components/ui/Button';
import { CloseIcon, ChevronUpIcon } from '../../src/components/icons';
import { QuantumRobotIcon } from '../../src/components/quantum/QuantumRobotIcon';
import { useAIStore } from '../../src/stores/aiStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useAuthStore } from '../../src/stores/authStore';
import { RateLimitError } from '../../src/services/ai';
import { hasPremiumAccess } from '../../src/stores/tierStore';

// DEV OVERRIDE — direct VIP email check (bulletproof, no store chain dependency)
const VIP_EMAILS = ['ab.sanad17@gmail.com', 'ab.sanad71@gmail.com'];

// QUANTUM icon for messages - uses simplified version for fast rendering
const MessageQuantumIcon = memo(({ size = 36, glowing = false }: { size?: number; glowing?: boolean }) => (
  <QuantumRobotIcon
    size={size}
    showGlow={glowing}
    inGlassSphere={true}
    sphereGlowIntensity={glowing ? 'medium' : 'subtle'}
    simplified={true}
  />
));

// Header icon - starts simplified for instant load, upgrades to full after mount
const AnimatedHeaderIcon = memo(() => {
  const [isReady, setIsReady] = useState(false);
  const pulse = useSharedValue(1);

  useEffect(() => {
    // Start pulse animation
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500, easing: easeInOutQuad }),
        withTiming(1, { duration: 1500, easing: easeInOutQuad })
      ),
      -1,
      true
    );
    // Upgrade to full animated icon after a short delay
    const timer = setTimeout(() => setIsReady(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <QuantumRobotIcon
        size={72}
        showGlow={true}
        inGlassSphere={true}
        sphereGlowIntensity="medium"
        simplified={!isReady}
      />
    </Animated.View>
  );
});

// Usage indicator component
const UsageIndicator = memo(({ messagesUsed, messagesLimit, isPremium }: {
  messagesUsed: number;
  messagesLimit: number;
  isPremium: boolean;
}) => {
  const { t } = useTranslation();

  if (isPremium) {
    return (
      <View style={styles.usageIndicator}>
        <Text style={styles.usageText}>{t('quantum.unlimited')}</Text>
      </View>
    );
  }

  const percentUsed = messagesLimit > 0 ? (messagesUsed / messagesLimit) * 100 : 0;
  const isWarning = percentUsed >= 80;
  const isCritical = percentUsed >= 100;

  return (
    <View style={styles.usageIndicator}>
      <Text style={[
        styles.usageText,
        isWarning && styles.usageWarning,
        isCritical && styles.usageCritical,
      ]}>
        {messagesUsed}/{messagesLimit} {t('quantum.messagesThisHour')}
      </Text>
      <View style={styles.usageBar}>
        <View
          style={[
            styles.usageBarFill,
            { width: `${Math.min(100, percentUsed)}%` },
            isWarning && styles.usageBarWarning,
            isCritical && styles.usageBarCritical,
          ]}
        />
      </View>
    </View>
  );
});

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isNew?: boolean;
}

const createInitialMessages = (t: (key: string) => string): Message[] => [
  {
    id: '1',
    role: 'assistant',
    content: t('settings.quantumGreeting'),
    timestamp: new Date(),
    isNew: false,
  },
];

// Optimized Typewriter - batches character updates for smoother animation
const TypewriterText = memo(({
  text,
  speed = 15,
  onComplete,
  onProgress,
  style,
  skipAnimation = false,
}: {
  text: string;
  speed?: number;
  onComplete?: () => void;
  onProgress?: () => void;
  style?: any;
  skipAnimation?: boolean;
}) => {
  const [displayedText, setDisplayedText] = useState(skipAnimation ? text : '');
  const [isTyping, setIsTyping] = useState(!skipAnimation);
  const cursorOpacity = useSharedValue(1);
  const progressCallbackRef = useRef(onProgress);

  // Update ref when callback changes
  useEffect(() => {
    progressCallbackRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    if (isTyping) {
      cursorOpacity.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 500, easing: Easing.quad }),
          withTiming(1, { duration: 500, easing: Easing.quad })
        ),
        -1,
        true
      );
    }
  }, [isTyping]);

  const cursorStyle = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  useEffect(() => {
    if (skipAnimation) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    let index = 0;
    setDisplayedText('');
    setIsTyping(true);
    let scrollUpdateCounter = 0;

    const interval = setInterval(() => {
      if (index < text.length) {
        // Type 5-10 characters at a time for much faster feel
        const charsToAdd = Math.min(8, text.length - index);
        index += charsToAdd;
        setDisplayedText(text.slice(0, index));

        // Only call scroll update every 3rd batch to reduce overhead
        scrollUpdateCounter++;
        if (scrollUpdateCounter % 3 === 0) {
          progressCallbackRef.current?.();
        }
      } else {
        setIsTyping(false);
        clearInterval(interval);
        onComplete?.();
      }
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed, skipAnimation, onComplete]);

  return (
    <Text style={style}>
      {displayedText}
      {isTyping && (
        <Animated.Text style={[{ color: Colors.neon, fontWeight: 'bold' }, cursorStyle]}>
          |
        </Animated.Text>
      )}
    </Text>
  );
});

// Memoized Message Bubble
const MessageBubble = memo(({
  message,
  onTypewriterComplete,
  onTypewriterProgress
}: {
  message: Message;
  onTypewriterComplete?: () => void;
  onTypewriterProgress?: () => void;
}) => {
  const { t } = useTranslation();
  const isUser = message.role === 'user';
  const [skipAnimation, setSkipAnimation] = useState(false);

  const handlePress = useCallback(() => {
    if (message.isNew && !isUser) {
      setSkipAnimation(true);
      onTypewriterComplete?.();
    }
  }, [message.isNew, isUser, onTypewriterComplete]);

  return (
    <Pressable
      onPress={handlePress}
      style={[styles.messageBubble, isUser ? styles.userMessage : styles.assistantMessage]}
      accessibilityRole="text"
      accessibilityLabel={isUser ? message.content : `${t('quantum.aiGenerated')}: ${message.content}`}
    >
      {!isUser && (
        <View style={styles.assistantAvatar}>
          <MessageQuantumIcon size={36} glowing={message.isNew} />
        </View>
      )}
      <GlassCard
        variant={isUser ? 'filled' : 'default'}
        size="compact"
        style={isUser ? [styles.messageCard, styles.userMessageCard] : styles.messageCard}
      >
        {isUser ? (
          <GradientText variant="bright" style={styles.messageText}>
            {message.content}
          </GradientText>
        ) : (
          <>
            {/* AI-generated label (LEGAL REQUIREMENT) */}
            <Text style={styles.aiGeneratedLabel}>{t('quantum.aiGenerated')}</Text>
            <TypewriterText
              text={message.content}
              speed={15}
              skipAnimation={!message.isNew || skipAnimation}
              onComplete={onTypewriterComplete}
              onProgress={onTypewriterProgress}
              style={styles.assistantMessageText}
            />
          </>
        )}
      </GlassCard>
    </Pressable>
  );
});

// Simplified Typing Indicator
const TypingIndicator = memo(() => {
  const { t } = useTranslation();
  const dotOpacity = useSharedValue(0.4);

  useEffect(() => {
    dotOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.4, { duration: 400 })
      ),
      -1,
      true
    );
  }, []);

  const dotStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
  }));

  return (
    <View style={[styles.messageBubble, styles.assistantMessage]}>
      <View style={styles.assistantAvatar}>
        <MessageQuantumIcon size={36} glowing />
      </View>
      <GlassCard variant="default" size="compact" style={styles.messageCard}>
        <View style={styles.typingContainer}>
          <GradientText variant="muted" style={styles.typingLabel}>{t('settings.quantumIsThinking')}</GradientText>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, dotStyle]} />
            <Animated.View style={[styles.typingDot, dotStyle]} />
            <Animated.View style={[styles.typingDot, dotStyle]} />
          </View>
        </View>
      </GlassCard>
    </View>
  );
});

export default function AIConsultantModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  // DEV OVERRIDE: Direct VIP email check (bulletproof — no dependency on tierStore hydration)
  const userEmail = useAuthStore((s) => s.user?.email?.toLowerCase());
  const isVIP = !!userEmail && VIP_EMAILS.includes(userEmail);
  const isPremium = isVIP || hasPremiumAccess();

  // Initialize messages immediately - no loading state needed
  const [messages, setMessages] = useState<Message[]>(() => createInitialMessages(t));
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Get rate limiting state from store
  const {
    usageStatus,
    isRateLimited: _storeRateLimited,
    rateLimitMessage,
    checkUsageStatus,
    clearRateLimitError,
    sendMessage: sendStoreMessage,
    isSending,
  } = useAIStore();

  // DEV OVERRIDE: VIP users are NEVER rate limited, regardless of store state
  const isRateLimited = isVIP ? false : _storeRateLimited;

  // Check usage status in background on mount - don't block UI
  useEffect(() => {
    checkUsageStatus();
  }, [checkUsageStatus]);

  // Show rate limit alert when rate limited (NEVER for VIP users)
  useEffect(() => {
    if (isRateLimited && rateLimitMessage && !isVIP) {
      Alert.alert(
        t('quantum.rateLimitTitle'),
        rateLimitMessage,
        [{ text: t('common.ok'), onPress: clearRateLimitError }]
      );
    }
  }, [isRateLimited, rateLimitMessage, t, clearRateLimitError, isVIP]);

  // Throttled scroll to bottom
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollToBottom = useCallback(() => {
    if (scrollTimeoutRef.current) return;
    scrollTimeoutRef.current = setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
      scrollTimeoutRef.current = null;
    }, 100);
  }, []);

  const handleTypewriterComplete = useCallback((messageId: string) => {
    setIsAnimating(false);
    setMessages(prev => prev.map(msg =>
      msg.id === messageId ? { ...msg, isNew: false } : msg
    ));
  }, []);

  const sendMessage = useCallback(async () => {
    if (!inputText.trim() || isAnimating || isSending) return;

    // Check if rate limited before even trying
    if (isRateLimited) {
      Alert.alert(
        t('quantum.rateLimitTitle'),
        rateLimitMessage || t('quantum.rateLimitMessage', { minutes: usageStatus?.minutesUntilReset || 60 })
      );
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);
    scrollToBottom();

    try {
      const response = await sendStoreMessage(inputText.trim());

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
        isNew: true,
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsAnimating(true);
      scrollToBottom();
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Remove the user message since it wasn't sent
        setMessages(prev => prev.slice(0, -1));
      } else {
        // Show error message from AI
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: t('errors.connectionError'),
          timestamp: new Date(),
          isNew: true,
        };
        setMessages(prev => [...prev, errorMessage]);
        setIsAnimating(true);
      }
    } finally {
      setIsTyping(false);
      scrollToBottom();
    }
  }, [inputText, isAnimating, isSending, isRateLimited, scrollToBottom, sendStoreMessage, t, rateLimitMessage, usageStatus]);

  const canSend = inputText.trim() && !isAnimating && !isTyping && !isSending && !isRateLimited;

  // Determine placeholder text
  const placeholderText = isRateLimited
    ? t('quantum.rateLimitInputMessage', { minutes: usageStatus?.minutesUntilReset || 60 })
    : t('settings.askQuantumAnything');

  // Premium gate: AI Consultant is a premium-only feature
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <View style={styles.headerLeft}>
            <IconButton icon={<CloseIcon size={20} color={Colors.text.primary} />} onPress={() => router.back()} variant="ghost" />
          </View>
          <View style={styles.headerCenter}>
            <AnimatedHeaderIcon />
            <GradientText variant="bright" style={styles.headerTitle}>{t('quantum.title')}</GradientText>
            <GradientText variant="muted" style={styles.headerSubtitle}>{t('settings.aiFinancialAdvisor')}</GradientText>
          </View>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.premiumGateContainer}>
          <GradientText variant="bright" style={styles.premiumGateTitle}>
            Premium Feature
          </GradientText>
          <Text style={styles.premiumGateText}>
            AI Financial Consultant is available with Premium. Upgrade to chat with QUANTUM and get personalized financial advice.
          </Text>
          <Pressable
            onPress={() => router.push('/settings/upgrade' as any)}
            style={styles.upgradeButton}
          >
            <LinearGradient
              colors={Colors.gradients.buttonPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.upgradeButtonGradient}
            >
              <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>

      {/* Header - Simplified */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <View style={styles.headerLeft}>
          <IconButton icon={<CloseIcon size={20} color={Colors.text.primary} />} onPress={() => router.back()} variant="ghost" />
        </View>
        <View style={styles.headerCenter}>
          <AnimatedHeaderIcon />
          <GradientText variant="bright" style={styles.headerTitle}>{t('quantum.title')}</GradientText>
          <GradientText variant="muted" style={styles.headerSubtitle}>{t('settings.aiFinancialAdvisor')}</GradientText>
          {/* Usage indicator — VIP always shows as premium/unlimited */}
          {usageStatus && (
            <UsageIndicator
              messagesUsed={isVIP ? 0 : usageStatus.messagesUsed}
              messagesLimit={isVIP ? -1 : usageStatus.messagesLimit}
              isPremium={isVIP || usageStatus.isPremium}
            />
          )}
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* AI Disclaimer Banner */}
      <View style={styles.disclaimerBanner}>
        <Text style={styles.disclaimerText}>
          {t('quantum.disclaimer') || 'QUANTUM is an AI assistant, not a licensed financial advisor. Always consult a professional for major financial decisions.'}
        </Text>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
        >
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onTypewriterComplete={() => handleTypewriterComplete(message.id)}
              onTypewriterProgress={scrollToBottom}
            />
          ))}
          {(isTyping || isSending) && <TypingIndicator />}
        </ScrollView>

        {/* Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom || Spacing.md }]}>
          <LinearGradient
            colors={[Colors.transparent.dark60, Colors.void]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.inputGradient}
          />
          <View style={[styles.inputWrapper, isRateLimited && styles.inputWrapperDisabled]}>
            <TextInput
              style={[styles.input, isRateLimited && styles.inputDisabled]}
              placeholder={placeholderText}
              placeholderTextColor={isRateLimited ? Colors.semantic.error : Colors.text.disabled}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isAnimating && !isRateLimited}
            />
            <Pressable
              onPress={sendMessage}
              style={[styles.sendButton, !canSend && styles.sendButtonDisabled]}
              disabled={!canSend}
            >
              <LinearGradient
                colors={canSend ? Colors.gradients.buttonPrimary : [Colors.dark, Colors.dark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <ChevronUpIcon size={20} color={canSend ? Colors.void : Colors.text.disabled} />
              </LinearGradient>
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
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginTop: Spacing.sm,
    fontSize: FontSize.h3,
  },
  headerSubtitle: {
    fontSize: FontSize.caption,
  },
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
  assistantMessageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  aiGeneratedLabel: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.xs,
    color: Colors.text.tertiary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  typingLabel: {
    fontSize: FontSize.caption,
    marginRight: Spacing.sm,
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.neon,
    marginHorizontal: 2,
  },
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
  inputWrapperDisabled: {
    borderColor: Colors.semantic.error,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.primary,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  inputDisabled: {
    color: Colors.text.disabled,
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
  // Usage indicator styles
  usageIndicator: {
    marginTop: Spacing.sm,
    alignItems: 'center',
  },
  usageText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
  },
  usageWarning: {
    color: Colors.semantic.warning,
  },
  usageCritical: {
    color: Colors.semantic.error,
  },
  usageBar: {
    width: 100,
    height: 3,
    backgroundColor: Colors.transparent.white10,
    borderRadius: 2,
    marginTop: 4,
    overflow: 'hidden',
  },
  usageBarFill: {
    height: '100%',
    backgroundColor: Colors.neon,
    borderRadius: 2,
  },
  usageBarWarning: {
    backgroundColor: Colors.semantic.warning,
  },
  usageBarCritical: {
    backgroundColor: Colors.semantic.error,
  },
  // Premium gate styles
  premiumGateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  premiumGateTitle: {
    fontSize: FontSize.h2,
    marginBottom: Spacing.md,
  },
  premiumGateText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  upgradeButton: {
    width: '100%',
    maxWidth: 280,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  upgradeButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
  },
  upgradeButtonText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.body,
    color: Colors.void,
  },
  // AI Disclaimer styles
  disclaimerBanner: {
    backgroundColor: 'rgba(255, 136, 0, 0.1)',
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 136, 0, 0.2)',
  },
  disclaimerText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.semantic.warning,
    textAlign: 'center',
    lineHeight: 18,
  },
});
