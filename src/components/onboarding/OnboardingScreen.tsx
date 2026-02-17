/**
 * SPENDTRAK CINEMATIC EDITION - Onboarding Flow
 * Premium multi-slide onboarding with cinematic transitions
 * Matches the app's luxury dark + neon green aesthetic
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  FlatList,
  Pressable,
  ViewToken,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  interpolate,
  Extrapolation,
  Easing,
  FadeIn,
  FadeOut,
  SharedValue,
} from 'react-native-reanimated';
import { easeOutCubic } from '../../config/easingFunctions';
import { Colors, FontFamily, FontSize, Spacing, BorderRadius } from '../../design/cinematic';
import { logger } from '../../utils/logger';
import {
  ScanIcon,
  EditIcon,
  BudgetIcon,
  TrendUpIcon,
  StarIcon,
  ProfileIcon,
} from '../icons';
import { AnimatedQuantumMascot } from '../quantum/AnimatedQuantumMascot';
import { useAuthStore } from '../../stores/authStore';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==========================================
// SLIDE DATA
// ==========================================

interface OnboardingSlide {
  id: string;
  icon: 'logo' | 'quantum' | 'chart' | 'goal' | 'promise' | 'name';
  title: string;
  subtitle: string;
  description: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    icon: 'logo',
    title: 'Welcome to\nSpendTrak',
    subtitle: 'Your personal finance companion',
    description: 'Track expenses, set budgets, and achieve your financial goals with cinematic precision.',
  },
  {
    id: '2',
    icon: 'quantum',
    title: 'Meet\nQUANTUM',
    subtitle: 'Your AI financial assistant',
    description: 'QUANTUM learns your habits and delivers personalized insights to optimize your spending.',
  },
  {
    id: '3',
    icon: 'chart',
    title: 'Smart\nAnalytics',
    subtitle: 'Understand your spending',
    description: 'Beautiful charts and reports to visualize your finances at a glance.',
  },
  {
    id: '4',
    icon: 'goal',
    title: 'Set Goals &\nAchieve More',
    subtitle: 'Financial freedom awaits',
    description: 'Create savings goals, track budgets, and watch your progress in real time.',
  },
  {
    id: '5',
    icon: 'promise',
    title: 'One Simple\nPromise',
    subtitle: 'No judgment. No lectures.',
    description: 'Just reflection. Your finances, your pace, your journey.',
  },
  {
    id: '6',
    icon: 'name',
    title: 'What should\nwe call you?',
    subtitle: 'Personalize your experience',
    description: 'Enter your name so we can greet you properly.',
  },
];

// ==========================================
// SLIDE ICON COMPONENT
// ==========================================

const SlideIcon = ({ type, size = 48 }: { type: OnboardingSlide['icon']; size?: number }) => {
  // No-op handler for AnimatedQuantumMascot (onboarding doesn't need tap actions)
  const handleQuantumPress = () => {};

  switch (type) {
    case 'logo':
      return (
        <Image
          source={require('../../../assets/logo.png')}
          style={{ width: size * 2, height: size * 2 }}
          resizeMode="contain"
        />
      );
    case 'quantum':
      return <AnimatedQuantumMascot size={size * 1.8} onPress={handleQuantumPress} />;
    case 'chart':
      return <TrendUpIcon size={size} color={Colors.neon} />;
    case 'goal':
      return <BudgetIcon size={size} color={Colors.neon} />;
    case 'promise':
      return <StarIcon size={size} color={Colors.neon} />;
    case 'name':
      return <ProfileIcon size={size} color={Colors.neon} />;
    default:
      return null;
  }
};

// ==========================================
// ANIMATED SLIDE COMPONENT
// ==========================================

const AnimatedSlide = ({ item, index, scrollX, userName, onNameChange }: {
  item: OnboardingSlide;
  index: number;
  scrollX: SharedValue<number>;
  userName?: string;
  onNameChange?: (name: string) => void;
}) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const iconStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.5, 1, 0.5],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }], opacity };
  });

  const titleStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [40, 0, 40],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }], opacity };
  });

  const descStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [60, 0, 60],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }], opacity };
  });

  const isNameSlide = item.icon === 'name';

  return (
    <View style={styles.slide}>
      {/* Icon */}
      <Animated.View style={[styles.iconContainer, iconStyle]}>
        {item.icon === 'quantum' ? (
          <SlideIcon type={item.icon} />
        ) : (
          <View style={styles.iconGlow}>
            <SlideIcon type={item.icon} />
          </View>
        )}
      </Animated.View>

      {/* Title */}
      <Animated.View style={titleStyle}>
        <Animated.Text style={styles.slideTitle}>{item.title}</Animated.Text>
        <Animated.Text style={styles.slideSubtitle}>{item.subtitle}</Animated.Text>
      </Animated.View>

      {/* Name Input (only on name slide) */}
      {isNameSlide && onNameChange && (
        <Animated.View style={[descStyle, styles.nameInputContainer]}>
          <TextInput
            style={styles.nameInput}
            placeholder="Enter your name"
            placeholderTextColor={Colors.text.tertiary}
            value={userName}
            onChangeText={onNameChange}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={50}
          />
        </Animated.View>
      )}

      {/* Description (hide on name slide since we show input instead) */}
      {!isNameSlide && (
        <Animated.View style={descStyle}>
          <Animated.Text style={styles.slideDescription}>{item.description}</Animated.Text>
        </Animated.View>
      )}
    </View>
  );
};

// ==========================================
// PAGINATION DOT
// ==========================================

const PaginationDot = ({ index, scrollX }: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const animatedStyle = useAnimatedStyle(() => {
    const width = interpolate(
      scrollX.value,
      inputRange,
      [8, 32, 8],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP,
    );
    const backgroundColor = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP,
    );

    return {
      width,
      opacity,
      backgroundColor: backgroundColor > 0.5 ? Colors.neon : Colors.deep,
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

// ==========================================
// MAIN ONBOARDING SCREEN
// ==========================================

export interface OnboardingScreenProps {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userName, setUserName] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useSharedValue(0);

  // Auth store for saving user name
  const { updateProfile } = useAuthStore();

  const isLastSlide = currentIndex === SLIDES.length - 1;
  const isNameSlide = SLIDES[currentIndex]?.icon === 'name';

  const handleNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleComplete = useCallback(async () => {
    // Save user name if provided
    if (userName.trim()) {
      try {
        await updateProfile({ display_name: userName.trim() });
      } catch (error) {
        // Continue even if save fails - user can update later in settings
        logger.onboarding.warn('Failed to save user name:', error);
      }
    }
    onComplete();
  }, [onComplete, userName, updateProfile]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  // Button animation
  const buttonScale = useSharedValue(1);
  const handlePressIn = () => {
    buttonScale.value = withTiming(0.96, { duration: 100 });
  };
  const handlePressOut = () => {
    buttonScale.value = withTiming(1, { duration: 200, easing: easeOutCubic });
  };
  const buttonAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background atmosphere */}

      {/* Gradient overlay */}
      <LinearGradient
        colors={['transparent', Colors.transparent.dark40, Colors.void]}
        locations={[0, 0.7, 1]}
        style={styles.bottomGradient}
        pointerEvents="none"
      />

      {/* Slides */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          renderItem={({ item, index }) => (
            <AnimatedSlide
              item={item}
              index={index}
              scrollX={scrollX}
              userName={userName}
              onNameChange={setUserName}
            />
          )}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={(e) => {
            scrollX.value = e.nativeEvent.contentOffset.x;
          }}
          scrollEventThrottle={16}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item) => item.id}
          getItemLayout={(_, index) => ({
            length: SCREEN_WIDTH,
            offset: SCREEN_WIDTH * index,
            index,
          })}
          // Performance optimizations
          removeClippedSubviews={true}
          maxToRenderPerBatch={3}
          windowSize={3}
          initialNumToRender={1}
          keyboardShouldPersistTaps="handled"
        />
      </KeyboardAvoidingView>

      {/* Bottom controls */}
      <View style={[styles.controls, { paddingBottom: insets.bottom + Spacing.lg }]}>
        {/* Pagination */}
        <View style={styles.pagination}>
          {SLIDES.map((_, index) => (
            <PaginationDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        {/* Action button */}
        <Pressable
          onPress={isLastSlide ? handleComplete : handleNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={buttonAnimStyle}>
            <LinearGradient
              colors={
                isLastSlide
                  ? [Colors.neon, Colors.primary, Colors.medium]
                  : ['transparent', 'transparent']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.button,
                !isLastSlide && styles.buttonOutline,
              ]}
            >
              <Animated.Text
                style={[
                  styles.buttonText,
                  isLastSlide && styles.buttonTextFilled,
                ]}
              >
                {isLastSlide ? "LET'S BEGIN" : 'NEXT'}
              </Animated.Text>
            </LinearGradient>
          </Animated.View>
        </Pressable>

        {/* Skip (hidden on last slide) */}
        {!isLastSlide && (
          <Pressable onPress={handleComplete} style={styles.skipButton}>
            <Animated.Text style={styles.skipText}>Skip</Animated.Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.4,
    zIndex: 1,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: 200,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconGlow: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.transparent.neon05,
    borderWidth: 1,
    borderColor: Colors.transparent.neon20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideTitle: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.display3,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
    lineHeight: 44,
  },
  slideSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: FontSize.h5,
    color: Colors.neon,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    letterSpacing: 2,
  },
  slideDescription: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.body,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: Spacing.lg,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 2,
    paddingHorizontal: Spacing.xxxl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xxl,
    gap: 6,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  button: {
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.giant,
    minWidth: SCREEN_WIDTH - Spacing.xxxl * 2,
    alignItems: 'center',
  },
  buttonOutline: {
    borderWidth: 1.5,
    borderColor: Colors.neon,
  },
  buttonText: {
    fontFamily: FontFamily.semiBold,
    fontSize: FontSize.body,
    color: Colors.neon,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  buttonTextFilled: {
    color: Colors.void,
  },
  skipButton: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  skipText: {
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    color: Colors.text.tertiary,
    letterSpacing: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  nameInputContainer: {
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  nameInput: {
    width: '100%',
    backgroundColor: Colors.transparent.white05,
    borderWidth: 1,
    borderColor: Colors.transparent.neon30,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
    fontFamily: FontFamily.medium,
    fontSize: FontSize.h5,
    color: Colors.text.primary,
    textAlign: 'center',
  },
});
