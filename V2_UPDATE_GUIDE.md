# ============================================
# SPENDTRAK CINEMATIC EDITION - V2 UPDATE
# Integration Guide
# ============================================

## 🆕 What's New in V2

1. **Unique Animated Icons** - Each icon has its own meaningful animation
2. **Atmospheric Fog Effect** - Cinematic ground lighting with particles
3. **Luxury Gradient Text** - Vertical gradients for all text elements
4. **"Add" renamed to "Plus"** - Updated labeling

---

## 📦 New Dependencies Required

```bash
# Add these to your existing installation
npx expo install react-native-reanimated
npx expo install @react-native-masked-view/masked-view
```

### Update babel.config.js for Reanimated:
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // ADD THIS LINE (must be last)
  };
};
```

---

## 📁 New Files to Add

Copy these 3 new files into your existing project:

```
src/components/
├── icons/
│   ├── Icons.tsx              (existing)
│   ├── CosmicEye.tsx          (existing)
│   └── AnimatedIcons.tsx      ← NEW FILE
│
├── effects/                   ← NEW FOLDER
│   └── AtmosphericFog.tsx     ← NEW FILE
│
└── ui/
    ├── index.tsx              (existing)
    └── GradientText.tsx       ← NEW FILE
```

---

## 🔧 Update Existing Files

### 1. Update `components/index.tsx` - Add new exports:

```tsx
// Add these exports to your existing index.tsx

// V2: Animated Icons
export {
  AnimatedHomeIcon,
  AnimatedScanIcon,
  AnimatedPlusIcon,
  AnimatedBillsIcon,
  AnimatedStatsIcon,
  AnimatedFoodIcon,
  AnimatedTransportIcon,
  AnimatedShoppingIcon,
  AnimatedSettingsIcon,
  AnimatedSalaryIcon,
  AnimatedBudgetsIcon,
  AnimatedIconMap,
} from './icons/AnimatedIcons';

export type { AnimatedIconName } from './icons/AnimatedIcons';

// V2: Atmospheric Fog
export { AtmosphericFog } from './effects/AtmosphericFog';

// V2: Gradient Text
export {
  GradientText,
  GradientBalance,
  GradientTitle,
  GradientHeading,
  GradientLabel,
  GradientBody,
  GradientPositive,
  gradientConfigs,
} from './ui/GradientText';

export type { GradientVariant, GradientTextProps } from './ui/GradientText';
```

### 2. Update Quick Actions labels (optional):

In `components/home/QuickActions.tsx`, change "ADD" to "PLUS":

```tsx
// Before:
{ id: 'add', label: 'ADD', icon: 'add', onPress: onAddPress },

// After:
{ id: 'add', label: 'PLUS', icon: 'plus', onPress: onAddPress },
```

---

## 🎯 Using the New Features

### Animated Icons

Replace static icons with animated versions:

```tsx
// Before (static):
import { HomeIcon, ScanIcon } from '@/components';

<IconBox>
  <HomeIcon size={24} color={Colors.primary} />
</IconBox>

// After (animated):
import { AnimatedHomeIcon, AnimatedScanIcon } from '@/components';

<IconBox>
  <AnimatedHomeIcon size={24} isActive={true} />
</IconBox>
```

### Icon Animation Reference:

| Icon | Animation Description |
|------|----------------------|
| 🏠 Home | Door glows warmly, chimney smoke rises |
| 📷 Scan | Laser line sweeps across, corners pulse |
| ➕ Plus | Heartbeat pulse, slight rotation |
| 🔄 Bills | Continuous rotation with center pulse |
| 📊 Stats | Pie chart fills, data points pulse |
| ☕ Food | Steam particles rise and drift |
| 🚗 Transport | Wheels rotate, car bounces |
| 🛒 Shopping | Cart sways, items bounce inside |
| ⚙️ Settings | Gear rotates, rays pulse |
| 💰 Salary | Bills fan out, shine sweeps |
| 🎯 Budgets | Arrow flies to target, rings pulse |

### Atmospheric Fog

Add to your screen background:

```tsx
import { CinematicBackground, AtmosphericFog } from '@/components';

const MyScreen = () => (
  <View style={{ flex: 1, backgroundColor: Colors.void }}>
    <CinematicBackground>
      {/* Your content */}
    </CinematicBackground>
    
    {/* Add fog at bottom */}
    <AtmosphericFog 
      intensity={1}        // 0-1
      particleCount={40}   // dust particles
      showParticles={true}
      height="60%"
    />
  </View>
);
```

### Gradient Text

```tsx
import { 
  GradientText, 
  GradientBalance, 
  GradientTitle,
  GradientLabel 
} from '@/components';

// Basic usage with variants
<GradientText variant="luxury">Premium Text</GradientText>
<GradientText variant="bright">Highlighted Text</GradientText>
<GradientText variant="subtle">Secondary Text</GradientText>
<GradientText variant="muted">Tertiary Text</GradientText>
<GradientText variant="primary">Standard Text</GradientText>
<GradientText variant="gold">Gold Accent Text</GradientText>

// Pre-styled components
<GradientBalance amount="$3,247.89" />
<GradientTitle>Screen Title</GradientTitle>
<GradientLabel>SECTION LABEL</GradientLabel>
```

### Gradient Variants:

| Variant | Colors (top → bottom) |
|---------|----------------------|
| `luxury` | White → Neon → Primary → Deep → Dark |
| `bright` | White → Neon → Primary → Deep |
| `primary` | Neon → Primary → Deep |
| `subtle` | Bright → Primary → Medium |
| `muted` | Primary → Deep → Dark |
| `gold` | Cream → Neon → Primary → Deep → Darker |

---

## 📱 Example: Updated Home Screen

```tsx
import React from 'react';
import { View, ScrollView } from 'react-native';
import {
  Colors,
  CinematicBackground,
  AtmosphericFog,
  HomeHeader,
  GradientText,
  GradientBalance,
  GradientLabel,
  AnimatedScanIcon,
  AnimatedPlusIcon,
  AnimatedBillsIcon,
  IconBox,
} from '@/components';

export const HomeScreen = () => {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.void }}>
      <CinematicBackground>
        <ScrollView>
          <HomeHeader userName="Dev" />
          
          {/* Balance with gradient */}
          <GradientLabel>TOTAL SPENT THIS MONTH</GradientLabel>
          <GradientBalance amount="$3,247.89" />
          
          {/* Animated quick actions */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <IconBox>
              <AnimatedScanIcon size={24} isActive />
            </IconBox>
            <IconBox>
              <AnimatedPlusIcon size={24} isActive />
            </IconBox>
            <IconBox>
              <AnimatedBillsIcon size={24} isActive />
            </IconBox>
          </View>
        </ScrollView>
      </CinematicBackground>
      
      {/* Atmospheric fog at bottom */}
      <AtmosphericFog intensity={1} />
    </View>
  );
};
```

---

## ✅ Integration Checklist

- [ ] Install new dependencies (reanimated, masked-view)
- [ ] Update babel.config.js
- [ ] Add `AnimatedIcons.tsx` to `components/icons/`
- [ ] Create `components/effects/` folder
- [ ] Add `AtmosphericFog.tsx` to `components/effects/`
- [ ] Add `GradientText.tsx` to `components/ui/`
- [ ] Update `components/index.tsx` with new exports
- [ ] Replace static icons with animated versions
- [ ] Add `<AtmosphericFog />` to screens
- [ ] Replace Text with GradientText where desired
- [ ] Update "ADD" label to "PLUS" (optional)
- [ ] Rebuild app (`npx expo start -c`)

---

## 🚨 Troubleshooting

### Reanimated errors:
- Clear cache: `npx expo start -c`
- Ensure plugin is LAST in babel.config.js
- Rebuild: `npx expo prebuild --clean`

### MaskedView not working:
- Ensure `@react-native-masked-view/masked-view` is installed
- May need pod install for iOS: `cd ios && pod install`

### Animations not smooth:
- Enable Hermes engine in app.json
- Use `useNativeDriver: true` where applicable

---

**SpendTrak Cinematic Edition V2**
*Now with living, breathing icons* ✨
