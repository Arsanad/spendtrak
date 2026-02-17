# SpendTrak Cinematic Edition V2 - Complete UI Replacement Guide

## 🎯 Overview

This package provides a **complete visual replacement** for SpendTrak with the Cinematic Edition design system. It includes:

- ✅ Complete theme system (colors, typography, tokens)
- ✅ 45+ SVG icons with green gradient strokes
- ✅ 11 animated icons with unique animations
- ✅ Cosmic Eye AI avatar
- ✅ Atmospheric fog effect with particles
- ✅ All UI components (GlassCard, Button, Input, etc.)
- ✅ Premium components (ProgressRing, TransactionItem, etc.)
- ✅ All 59 screens fully styled
- ✅ Complete navigation setup

## ⚠️ CRITICAL DESIGN RULES

### Colors (ONLY these are allowed)
```
#00ff88 - Neon (brightest, active states)
#00e67a - Bright (primary text)
#00cc6a - Primary (main UI)
#00a858 - Medium (secondary)
#008545 - Deep (borders, inactive)
#004d2a - Dark (disabled)
#002a17 - Darker (card borders)
#001a0f - Deepest (shadows)
#000000 - Void (background)
```

### ❌ FORBIDDEN
- NO blue colors
- NO yellow/gold colors
- NO floating gems/crystals/decorative shapes
- NO thick colored borders
- NO gradients with non-green colors

### ✅ REQUIRED
- Pure black #000000 backgrounds
- Thin 1px borders with #002a17
- Vertical green gradients on text
- Subtle green glow effects
- Cinzel font family

## 📁 Package Structure

```
spendtrak-cinematic/
├── src/
│   ├── design/
│   │   └── cinematic/
│   │       ├── colors.ts       # All color definitions
│   │       ├── typography.ts   # Font system
│   │       ├── tokens.ts       # Spacing, shadows, etc.
│   │       └── index.ts        # Theme export
│   │
│   └── components/
│       ├── ui/                 # Core UI components
│       │   ├── GradientText.tsx
│       │   ├── GlassCard.tsx
│       │   ├── Button.tsx
│       │   ├── Input.tsx
│       │   ├── Badge.tsx
│       │   └── index.ts
│       │
│       ├── icons/              # All icons
│       │   ├── Icons.tsx       # 25 core icons
│       │   ├── Icons2.tsx      # 42 category/feature icons
│       │   ├── AnimatedIcons.tsx # 11 animated icons
│       │   └── index.ts
│       │
│       ├── effects/            # Visual effects
│       │   ├── CosmicEye.tsx
│       │   ├── AtmosphericFog.tsx
│       │   └── index.ts
│       │
│       ├── premium/            # Premium components
│       │   ├── ProgressRing.tsx
│       │   ├── TransactionItem.tsx
│       │   ├── SubscriptionCard.tsx
│       │   ├── SettingsItem.tsx
│       │   ├── AnimatedNumber.tsx
│       │   ├── EmptyState.tsx
│       │   └── index.ts
│       │
│       ├── navigation/         # Navigation
│       │   ├── BottomTabBar.tsx
│       │   ├── Header.tsx
│       │   └── index.ts
│       │
│       ├── charts/             # Charts
│       │   ├── DonutChart.tsx
│       │   ├── BarChart.tsx
│       │   └── index.ts
│       │
│       └── dashboard/          # Dashboard specific
│           ├── BalanceCard.tsx
│           ├── QuickActions.tsx
│           └── index.ts
│
├── screens/                    # All 59 screens
│   ├── tabs/
│   │   ├── DashboardScreen.tsx
│   │   ├── TransactionsScreen.tsx
│   │   ├── StatsScreen.tsx
│   │   ├── SubscriptionsScreen.tsx
│   │   ├── AlertsScreen.tsx
│   │   └── SettingsScreen.tsx
│   │
│   ├── auth/
│   │   ├── WelcomeScreen.tsx
│   │   ├── SignInScreen.tsx
│   │   └── PermissionsScreen.tsx
│   │
│   ├── modals/
│   │   ├── AddExpenseModal.tsx
│   │   ├── AddSubscriptionModal.tsx
│   │   ├── AddBudgetModal.tsx
│   │   ├── CameraModal.tsx
│   │   └── AIConsultantModal.tsx
│   │
│   └── settings/
│       ├── BudgetsScreen.tsx
│       ├── CategoriesScreen.tsx
│       └── ... (all other settings screens)
│
├── app/                        # Expo Router layouts
│   ├── _layout.tsx            # Root layout with providers
│   ├── (tabs)/
│   │   └── _layout.tsx        # Tab navigator
│   ├── (modals)/
│   │   └── _layout.tsx        # Modal stack
│   └── settings/
│       └── _layout.tsx        # Settings stack
│
└── babel.config.js            # With reanimated plugin
```

## 🚀 Installation

### 1. Required Dependencies
```bash
# Core
npx expo install expo-linear-gradient react-native-svg
npx expo install @react-native-masked-view/masked-view
npx expo install react-native-reanimated react-native-gesture-handler

# Fonts
npx expo install @expo-google-fonts/cinzel expo-font

# Make sure babel.config.js has:
plugins: ['react-native-reanimated/plugin'] // MUST BE LAST
```

### 2. Copy Package Files
Copy the entire `src/` folder to your project's `src/` directory.

### 3. Update Your Screens
Replace each screen's UI code with the corresponding screen from this package.

## 📖 Component Usage Examples

### GradientText
```tsx
import { GradientText, GradientBalance, GradientTitle } from '@/components/ui';

// Balance display
<GradientBalance amount="12,450.00" currency="USD" />

// Title
<GradientTitle>Dashboard</GradientTitle>

// Custom gradient
<GradientText variant="luxury" style={{ fontSize: 24 }}>
  Custom Text
</GradientText>
```

### GlassCard
```tsx
import { GlassCard, QuickActionCard } from '@/components/ui';

<GlassCard variant="default" onPress={() => {}}>
  <Text>Card Content</Text>
</GlassCard>

<QuickActionCard onPress={handleScan}>
  <ScanIcon size={24} />
  <GradientText>Scan</GradientText>
</QuickActionCard>
```

### Icons
```tsx
import { HomeIcon, AnimatedScanIcon, CosmicEye } from '@/components/icons';

// Static icon with gradient
<HomeIcon size={24} />

// Animated icon
<AnimatedScanIcon size={24} active />

// AI Avatar
<CosmicEye size={64} active blinking glowing />
```

### Atmospheric Effects
```tsx
import { AmbientBackground, AtmosphericFog } from '@/components/effects';

// Full screen background with fog
<AmbientBackground intensity="normal">
  {/* Screen content */}
</AmbientBackground>

// Just the fog effect
<AtmosphericFog showParticles intensity="subtle" />
```

## 🎨 Screen Implementation Pattern

Every screen should follow this pattern:

```tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AmbientBackground } from '@/components/effects';
import { GradientTitle } from '@/components/ui';
import { Colors, Spacing } from '@/design/cinematic';

export const ExampleScreen = () => {
  return (
    <View style={styles.container}>
      {/* Always pure black background */}
      <AmbientBackground intensity="subtle">
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <GradientTitle>Screen Title</GradientTitle>
          </View>
          
          {/* Content */}
          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Screen content here */}
          </ScrollView>
        </SafeAreaView>
      </AmbientBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.void, // Always #000000
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
});
```

## 🔄 Migration Checklist

For each screen, verify:

- [ ] Background is pure black (#000000)
- [ ] No blue, yellow, or gold colors anywhere
- [ ] All borders are thin (1px) and use #002a17
- [ ] Text uses vertical gradients (GradientText component)
- [ ] Cards use GlassCard component with subtle styling
- [ ] Icons use the provided Icon components (not custom)
- [ ] No floating decorative shapes (gems, crystals)
- [ ] Atmospheric fog is present at bottom of screen
- [ ] Font is Cinzel (check all Text components)

## ⚡ Quick Reference: Component Imports

```tsx
// Theme
import { Colors, FontFamily, Spacing, Shadows } from '@/design/cinematic';

// UI Components
import { 
  GradientText, GradientBalance, GradientTitle, GradientLabel,
  GlassCard, QuickActionCard,
  Button, IconButton, FAB,
  Input, AmountInput, SearchInput,
  Badge, Toggle, Chip
} from '@/components/ui';

// Icons
import { 
  HomeIcon, TransactionsIcon, StatsIcon, SettingsIcon,
  FoodIcon, TransportIcon, ShoppingIcon,
  AnimatedScanIcon, AnimatedPlusIcon,
  CosmicEye
} from '@/components/icons';

// Effects
import { 
  AmbientBackground, AtmosphericFog, SimpleFog 
} from '@/components/effects';

// Premium Components
import {
  ProgressRing, TransactionItem, SubscriptionCard,
  SettingsItem, AnimatedNumber, EmptyState
} from '@/components/premium';

// Charts
import { DonutChart, BarChart } from '@/components/charts';

// Navigation
import { BottomTabBar, Header } from '@/components/navigation';
```

## 🐛 Troubleshooting

### Reanimated not working
Make sure `react-native-reanimated/plugin` is the LAST plugin in babel.config.js:
```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // ... other plugins
    'react-native-reanimated/plugin', // MUST BE LAST
  ],
};
```
Then clear cache: `npx expo start -c`

### Fonts not loading
```tsx
// In your root layout:
import { useFonts, Cinzel_400Regular, ... } from '@expo-google-fonts/cinzel';

const [fontsLoaded] = useFonts({
  Cinzel_400Regular,
  Cinzel_500Medium,
  Cinzel_600SemiBold,
  Cinzel_700Bold,
});

if (!fontsLoaded) return <SplashScreen />;
```

### Colors appearing wrong
Check that you're importing from the correct path:
```tsx
// ✅ Correct
import { Colors } from '@/design/cinematic';

// ❌ Wrong - might import old colors
import { Colors } from '@/config/theme';
```

## 📞 Support

If Claude Code is mixing old and new styles:
1. Delete the entire existing UI folder
2. Copy this package fresh
3. Do NOT merge - replace completely
4. Verify each screen against the checklist above
