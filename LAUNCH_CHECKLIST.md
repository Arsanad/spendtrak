# SpendTrak Launch Checklist

## Pre-Launch Requirements

### 1. Code Quality
- [ ] All unit tests passing (`npm test`)
- [ ] All E2E tests passing (`./scripts/run-e2e.sh all`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint warnings (`npm run lint`)
- [ ] Code coverage > 70%

### 2. Security
- [ ] Security check passing (`./scripts/security-check.sh`)
- [ ] No exposed API keys or secrets in codebase
- [ ] All sensitive data stored in SecureStore
- [ ] HTTPS enforced for all API calls
- [ ] Environment variables properly configured
- [ ] .env files in .gitignore

### 3. Configuration
- [ ] app.config.js environment settings verified
- [ ] EAS project ID configured in eas.json
- [ ] Bundle identifiers set for iOS and Android
- [ ] Version numbers updated (version, buildNumber, versionCode)
- [ ] App icons and splash screens finalized

### 4. Backend (Supabase)
- [ ] Production Supabase project created
- [ ] Row Level Security (RLS) policies enabled
- [ ] Edge Functions deployed and tested
- [ ] Database migrations applied
- [ ] API rate limiting configured
- [ ] Backup strategy in place

### 5. Third-Party Services
- [ ] OAuth credentials configured (Google, Microsoft)
- [ ] Push notification service configured
- [ ] Error tracking service configured (Sentry recommended)
- [ ] Analytics service configured

### 6. App Store Preparation

#### iOS App Store
- [ ] Apple Developer account active
- [ ] App Store Connect app created
- [ ] Screenshots prepared (6.5", 5.5", iPad)
- [ ] App description and keywords finalized
- [ ] Privacy policy URL ready
- [ ] Support URL ready
- [ ] App review notes prepared

#### Google Play Store
- [ ] Google Play Console account active
- [ ] App listing created
- [ ] Screenshots prepared (phone, tablet)
- [ ] Feature graphic prepared (1024x500)
- [ ] App description and keywords finalized
- [ ] Privacy policy URL ready
- [ ] Content rating questionnaire completed
- [ ] Data safety form completed

### 7. Assets Required

#### App Icons
- [ ] iOS icon (1024x1024 px, no transparency)
- [ ] Android adaptive icon (foreground + background)
- [ ] Android legacy icon (512x512 px)

#### Splash Screen
- [ ] iOS splash image (1242x2688 px recommended)
- [ ] Android splash image (matching size)

#### Store Assets
- [ ] App Store screenshots (all sizes)
- [ ] Play Store screenshots (phone + tablet)
- [ ] Feature graphic (Play Store)
- [ ] Promotional images (optional)

### 8. Build & Deploy

#### Development Build
```bash
eas build --profile development --platform all
```

#### Preview Build
```bash
eas build --profile preview --platform all
```

#### Production Build
```bash
eas build --profile production --platform all
```

#### Submit to Stores
```bash
# iOS
eas submit --platform ios

# Android
eas submit --platform android
```

### 9. Post-Launch Monitoring
- [ ] Error tracking dashboard set up
- [ ] Analytics dashboard set up
- [ ] User feedback channel ready (support email)
- [ ] Crash reporting alerts configured
- [ ] Performance monitoring enabled

### 10. Legal & Compliance
- [ ] Terms of Service published
- [ ] Privacy Policy published
- [ ] Cookie policy (if web)
- [ ] GDPR compliance (if EU users)
- [ ] CCPA compliance (if California users)
- [ ] Age rating correctly set

---

## Quick Commands

```bash
# Run all tests
npm test

# Type check
npm run type-check

# Lint
npm run lint

# Security check
./scripts/security-check.sh

# E2E tests
./scripts/run-e2e.sh all

# Build for production
eas build --profile production --platform all
```

---

## Contact

For questions about the launch process, contact the development team.

---

Last updated: January 2026
