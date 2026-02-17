import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GradientText } from '@/components/ui/GradientText';
import { Button } from '@/components/ui/Button';
import { Colors, FontFamily, FontSize, Spacing } from '@/design/cinematic';
import { useAuthStore } from '@/stores/authStore';
import { successBuzz } from '@/utils/haptics';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function WelcomeStep({ onNext }: StepProps) {
  const user = useAuthStore((s) => s.user);
  const name = user?.display_name || user?.email?.split('@')[0] || '';

  useEffect(() => {
    successBuzz();
    const timer = setTimeout(onNext, 3000);
    return () => clearTimeout(timer);
  }, [onNext]);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.delay(200).duration(600)} style={styles.content}>
        <GradientText variant="luxury" style={styles.greeting}>
          Welcome{name ? `,` : ''}
        </GradientText>
        {name ? (
          <GradientText variant="bright" style={styles.name}>
            {name}
          </GradientText>
        ) : null}
        <Animated.Text
          entering={FadeInDown.delay(600).duration(600)}
          style={styles.subtitle}
        >
          Let's set up your finances
        </Animated.Text>
      </Animated.View>
      <Animated.View entering={FadeInDown.delay(1200).duration(600)} style={styles.skipContainer}>
        <Button variant="ghost" onPress={onNext}>
          Continue
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  content: {
    alignItems: 'center',
  },
  greeting: {
    fontSize: FontSize.display2,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
  },
  name: {
    fontSize: FontSize.display3,
    fontFamily: FontFamily.bold,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.body,
    fontFamily: FontFamily.regular,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.xl,
  },
  skipContainer: {
    position: 'absolute',
    bottom: Spacing.xxxl,
  },
});
