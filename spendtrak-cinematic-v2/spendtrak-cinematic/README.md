# SpendTrak Cinematic Edition V2

A premium personal finance application with cinematic green aesthetics, built with React Native and Expo.

## ✨ Features

- **Cinematic Design System** - Exclusive green palette, Cinzel font, glassmorphism effects
- **Animated Icons** - 11 custom-animated icons with unique effects
- **Cosmic Eye AI** - Animated AI avatar with natural blinking and glow
- **Atmospheric Fog** - Layered fog gradients with floating particles
- **Glass Cards** - Premium frosted glass UI components
- **Gradient Text** - Vertical gradient text system

## 🎨 Design System

### Colors (Green-Only Palette)
```
Neon:    #00ff88 (brightest, active states)
Bright:  #00e67a (primary text)
Primary: #00cc6a (main UI)
Medium:  #00a858 (secondary)
Deep:    #008545 (borders, inactive)
Dark:    #004d2a (disabled)
Darker:  #002a17 (card borders)
Deepest: #001a0f (shadows)
Void:    #000000 (background)
```

### Typography (Cinzel)
- Regular (400)
- Medium (500)
- SemiBold (600)
- Bold (700)

## 📁 Structure

```
spendtrak-cinematic/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Main tab screens
│   ├── (modals)/                 # Modal screens
│   └── settings/                 # Settings screens
├── src/
│   ├── design/cinematic/         # Design tokens
│   ├── components/
│   │   ├── ui/                   # Core UI components
│   │   ├── icons/                # 67 SVG icons
│   │   ├── effects/              # Visual effects
│   │   ├── premium/              # Premium components
│   │   ├── navigation/           # Navigation components
│   │   ├── charts/               # Chart components
│   │   └── dashboard/            # Dashboard components
├── package.json
└── babel.config.js
```

## 🚀 Installation

1. **Copy Files** - Copy this entire folder to your project root

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure Babel** - Ensure your `babel.config.js` has:
   ```js
   module.exports = function(api) {
     api.cache(true);
     return {
       presets: ['babel-preset-expo'],
       plugins: [
         'react-native-reanimated/plugin', // MUST BE LAST
       ],
     };
   };
   ```

4. **Start Development**
   ```bash
   npx expo start
   ```

## 📦 Key Components

### UI Components
- `GradientText` - Text with vertical gradient
- `GlassCard` - Frosted glass container
- `Button` - Primary, secondary, outline, ghost variants
- `Input` - Text input with animated focus
- `Badge` - Status badges
- `Toggle` - Animated toggle switch
- `Chip` - Selectable chips

### Icons
- 25 core navigation/action icons
- 42 category/feature icons
- 11 animated icons with unique effects

### Effects
- `CosmicEye` - AI avatar with blinking
- `AtmosphericFog` - Ambient background effect

### Premium
- `ProgressRing` - Circular progress indicator
- `TransactionItem` - Transaction list item
- `SubscriptionCard` - Subscription display card
- `SettingsItem` - Settings list item
- `AnimatedNumber` - Counting animation

## 🖼️ Screens Included

### Tab Screens
- Dashboard (index.tsx)
- Transactions
- Stats
- Subscriptions
- Settings
- Alerts (hidden)

### Modal Screens
- Camera (receipt scanning)
- Add Expense
- Add Subscription
- Add Budget
- AI Consultant

### Settings Screens
- Budgets
- (and layout for all other settings screens)

## ⚠️ Important Notes

1. **Colors** - ONLY use colors from the design system. No blue, yellow, or gold.

2. **Reanimated Plugin** - Must be LAST in babel plugins array.

3. **Fonts** - Cinzel fonts are loaded in the root layout.

4. **Backgrounds** - Always use `Colors.void` (#000000).

5. **Borders** - Use thin 1px borders with `Colors.border.default`.

## 📝 License

MIT License - Feel free to use and modify.

---

**SpendTrak Cinematic Edition** - Premium Finance Tracking
