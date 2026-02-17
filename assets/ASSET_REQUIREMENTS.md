# SpendTrak Asset Requirements

## Required Assets for App Store Submission

### App Icons

#### iOS (Required)
| Size | Usage | Filename |
|------|-------|----------|
| 1024x1024 | App Store | `icon.png` |
| 180x180 | iPhone App Icon | auto-generated |
| 167x167 | iPad Pro | auto-generated |
| 152x152 | iPad, iPad mini | auto-generated |
| 120x120 | iPhone | auto-generated |
| 87x87 | iPhone Spotlight | auto-generated |
| 80x80 | iPad Spotlight | auto-generated |
| 60x60 | iPhone | auto-generated |
| 58x58 | Settings | auto-generated |
| 40x40 | iPad, iPhone Spotlight | auto-generated |
| 29x29 | Settings | auto-generated |
| 20x20 | Notification | auto-generated |

**Note:** Only `icon.png` at 1024x1024 is required. Expo generates all other sizes.

#### Android (Required)
| Asset | Size | Filename |
|-------|------|----------|
| Adaptive Icon Foreground | 432x432 | `adaptive-icon.png` |
| Adaptive Icon Background | 432x432 | Color in app.config.js |
| Legacy Icon | 512x512 | auto-generated |
| Notification Icon | 96x96 | `notification-icon.png` (optional) |

### Splash Screen

| Platform | Size | Filename |
|----------|------|----------|
| Universal | 1284x2778 | `splash-icon.png` |

**Design Guidelines:**
- Use SpendTrak brand green (#00C853)
- Black background (#000000) for dark theme
- Center logo/icon in safe area
- Keep content within center 40% for safe display

### App Store Screenshots

#### iOS Screenshots (Required sizes)
| Device | Size | Required |
|--------|------|----------|
| iPhone 6.7" | 1290x2796 | Yes (primary) |
| iPhone 6.5" | 1242x2688 | Yes |
| iPhone 5.5" | 1242x2208 | Yes |
| iPad Pro 12.9" | 2048x2732 | If supports iPad |

**Screenshot requirements:**
- 3-10 screenshots per size
- Show key features: Dashboard, Transactions, Subscriptions, AI Consultant
- Use device frames (optional but recommended)
- Include text callouts highlighting features

#### Android Screenshots
| Type | Size | Required |
|------|------|----------|
| Phone | 1080x1920 (min) | Yes |
| 7" Tablet | 1200x1920 | If supports tablets |
| 10" Tablet | 1600x2560 | If supports tablets |

**Screenshot requirements:**
- 2-8 screenshots per device type
- Feature graphic required: 1024x500

### Store Listing Assets

#### App Store (iOS)
- [ ] App Name (30 chars max)
- [ ] Subtitle (30 chars max)
- [ ] Promotional Text (170 chars, can update anytime)
- [ ] Description (4000 chars max)
- [ ] Keywords (100 chars max, comma-separated)
- [ ] What's New (4000 chars max)
- [ ] Privacy Policy URL
- [ ] Support URL
- [ ] Marketing URL (optional)

#### Play Store (Android)
- [ ] App Name (50 chars max)
- [ ] Short Description (80 chars max)
- [ ] Full Description (4000 chars max)
- [ ] Feature Graphic (1024x500)
- [ ] Promo Video (optional, YouTube link)
- [ ] Privacy Policy URL

### Design Specifications

#### Brand Colors
```
Primary Green: #00C853
Primary Dark: #00A843
Background: #000000
Surface: #121212
Text Primary: #00C853
Text Secondary: #1B5E20
Text Tertiary: #2E7D32
Border: #2E7D32
```

#### Typography
```
Primary Font: System Default (iOS/Android native)
Headings: Bold/Semibold weight
Body: Regular weight
Accent Font: Cinzel (for logo/branding only)
```

### File Locations

```
assets/
├── icon.png              # Main app icon (1024x1024)
├── adaptive-icon.png     # Android adaptive icon foreground
├── splash-icon.png       # Splash screen center image
├── favicon.png           # Web favicon (48x48)
├── screenshots/          # App store screenshots
│   ├── ios/
│   │   ├── 6.7-inch/
│   │   ├── 6.5-inch/
│   │   ├── 5.5-inch/
│   │   └── ipad/
│   └── android/
│       ├── phone/
│       └── tablet/
└── ASSET_REQUIREMENTS.md # This file
```

### Checklist

- [ ] App icon (1024x1024, no transparency, no alpha)
- [ ] Adaptive icon (Android foreground image)
- [ ] Splash screen image
- [ ] Favicon for web
- [ ] iOS screenshots (all 3 sizes minimum)
- [ ] Android screenshots (phone + tablets if supported)
- [ ] Feature graphic (Android)
- [ ] Privacy policy hosted and accessible

---

## Notes

1. **No transparency:** App Store icons must not have transparency
2. **Safe area:** Keep splash content in center 40% of screen
3. **Dark theme:** All assets should work with pure black background
4. **Green branding:** Primary green (#00C853) should be consistent
5. **Localization:** Prepare localized screenshots if targeting multiple regions

---

Last updated: January 2026
