# SpendTrak Manual Items Verification
Generated: 2026-02-10

## Summary
- Total items: 38
- ✅ Already Done: 10
- ⚠️ Partially Done: 10
- ❌ Still Need Manual Action: 18

---

## ✅ ALREADY DONE (No action needed)

| # | Item | Evidence |
|---|------|----------|
| 43 | RevenueCat Project | Real API keys in `.env`: `appl_JsrdMaSY...` (iOS) and `goog_qsaJSBI...` (Android) — valid prefixes confirm real keys |
| 44 | App Store Connect Products | Product IDs `spendtrak_premium_monthly` and `spendtrak_premium_yearly` defined in `src/config/revenuecat.ts:112-120` with pricing metadata |
| 45 | Google Play Console Products | Same product IDs used cross-platform; RevenueCat Android key (`goog_`) confirms Play Store connection |
| 46 | RevenueCat Connected to Stores | Real API keys present + full initialization in `src/services/purchases.ts:130-229` with `Purchases.configure()` call |
| 52 | Verify Sentry Works | `Sentry.init()` at `src/services/errorMonitoring.ts:19` with real DSN `https://6e59d490...@o4510790514966528.ingest.us.sentry.io/...` |
| 39-42 | Website Pages Built | All 4 files exist: `website/index.html`, `website/privacy.html`, `website/terms.html`, `website/support.html` — full content with SEO, FAQ, legal text |
| 37 | Support URL | `app.config.js:224` → `https://spendtrak.app/support`; `website/support.html` has full FAQ + contact form + `support@spendtrak.app` email |
| 38 | Marketing URL | `spendtrak.app` referenced in `app.config.js` (deep links, associated domains, privacy/terms/support URLs); `website/index.html` is full landing page |
| 48 | Free Trial / Promo Offers | Trial eligibility code fully implemented: `checkTrialEligibility()`, `checkTrialEligibilityByProductId()`, `getTrialDurationString()` in `src/services/purchases.ts:918-1021`; `SubscriptionStatus` includes `isTrialActive`, `trialEndDate` |
| 69 | Production Android Keystore | `spendtrak.keystore` exists at project root; `eas.json` preview profile uses `credentialsSource: "local"`; production uses EAS-managed (remote) |

---

## ⚠️ PARTIALLY DONE (Some manual action still needed)

| # | Item | What's Done | What's Still Needed |
|---|------|-------------|---------------------|
| 68 | Google Play Console | `android.package` = `com.spendtrak.app` in `app.config.js:30`; `eas.json:57` references `./google-service-account.json` with `track: "internal"` | `google-service-account.json` file does NOT exist — download from Google Play Console → Service Accounts and place in project root |
| 51 | Sentry Project | Real DSN in `.env:20`; `@sentry/react-native/expo` plugin in `app.config.js:191-196` | `SENTRY_ORG` and `SENTRY_PROJECT` not defined in `.env` or `.env.example` — only referenced as `process.env.SENTRY_ORG` in `app.config.js:193-194`. Add to `.env` or EAS secrets for source map uploads |
| 25 | Edge Function Secrets | 7 secrets documented in `.env.example`: `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CLOUD_PROJECT_ID`, `MICROSOFT_CLIENT_SECRET`, `EMAIL_ENCRYPTION_KEY`, `GEMINI_API_KEY` | `REVENUECAT_WEBHOOK_AUTH_KEY` is used in `supabase/functions/revenuecat-webhook/index.ts:33` but NOT documented in `.env.example`. Add it. Also verify all secrets are actually set in Supabase Dashboard |
| 26 | Production .env | `.env` has real values for: Supabase URL/key, Google Web Client ID, Sentry DSN, RevenueCat iOS/Android keys, OpenAI key, Gemini key | `EXPO_PUBLIC_MICROSOFT_CLIENT_ID` still placeholder (`your_microsoft_client_id_here`). `SENTRY_ORG`/`SENTRY_PROJECT` missing. No separate `.env.production` file |
| 29 | App Preview Video | `assets/videos/spendtrak-intro.MOV` exists | Verify video meets App Store requirements: 15-30 sec, H.264, specific resolutions (1080p/4K). MOV may need conversion for Google Play (MP4 preferred) |
| 35 | Apple App Privacy Labels | Privacy policy URL in `store-listings/app-store.md:96`; `docs/app-store-listing.md` exists | No explicit App Privacy label documentation (data types: collected, linked to identity, used for tracking). Must be filled in App Store Connect UI |
| 36 | Google Data Safety Form | `store-listings/play-store.md:112-131` documents Data Safety Section with data collection, sharing, security practices, deletion | Actual form must be submitted in Google Play Console. LAUNCH_CHECKLIST.md shows "Data safety form completed" is still unchecked |
| 5 | Session Timeout/Refresh | `src/utils/authErrorHandler.ts:48` has `refreshSession()` function; multiple services call `supabase.auth.refreshSession()`; `onAuthStateChange` handles auth state | No explicit session TIMEOUT or inactivity auto-logout. Only a UI "sleep" timeout (30s) in `QuantumContext.tsx:171` for the mascot, not auth |
| 20 | Staging Environment | `eas.json` has `preview` profile with `distribution: "internal"` that effectively serves as staging | No explicit `staging` profile in `eas.json`. No `SUPABASE_URL_STAGING` env var. Preview profile may be sufficient |
| 21 | Database Backups | Referenced in `LAUNCH_CHECKLIST.md` and `FINAL_AUDIT_REPORT.md` | Actual backup configuration is a Supabase Dashboard setting (Pro plan: daily backups, point-in-time recovery). Verify in Supabase Dashboard → Settings → Backups |

---

## ❌ STILL NEED MANUAL ACTION (Cannot be done by code)

| # | Item | What Needs To Be Done | Where |
|---|------|----------------------|-------|
| 67 | Apple Developer Account | Set real values for `appleId`, `ascAppId`, `appleTeamId` — currently all `"TODO_BEFORE_SUBMISSION"` in `eas.json:52-54` | Apple Developer portal → App Store Connect; then update `eas.json` |
| 17 | Apple Credentials in eas.json | Same as #67 — all 3 fields are `"TODO_BEFORE_SUBMISSION"` | Update `eas.json` submit.production.ios section |
| 27 | iOS Screenshots | `assets/screenshots/` only has `README.md` with size requirements — no actual images. Need: 1290x2796, 1284x2778, 1242x2208 | Capture on simulator/device, or use Maestro. Save to `assets/screenshots/` |
| 28 | Google Play Screenshots | No actual screenshot images for any device size. Need minimum 1080x1920 + feature graphic 1024x500 | Same as #27 — capture and save to `assets/screenshots/` |
| 47 | Test IAP in Sandbox | RevenueCat code is ready but untested on real devices | Apple Sandbox tester account + physical iOS device; Google Play internal testing track + physical Android device |
| 70 | Test Production Builds | No evidence of successful production build | Run `eas build --platform all --profile production` and verify both APK/IPA install and run |
| 4 | Biometric Lock Screen | Only `NSFaceIDUsageDescription` string in `app.config.js:77`. `expo-local-authentication` NOT in `package.json`. No biometric auth code in `src/` | Install `expo-local-authentication`, implement lock screen component with biometric prompt on app foreground |
| 12-14 | ML Models, Anomaly Detection, Health Score | `detection.ts:4` explicitly says "Rule-based pattern detection (NO AI)"; `financialHealth.ts` uses formula-based scoring. No ML imports (TensorFlow, ONNX, etc.) | Integrate actual ML models (TFLite/ONNX) or cloud ML API for anomaly detection. Currently all rule-based heuristics |
| 18 | GitHub Actions CI/CD | No `.github/workflows/` directory exists | Create workflow YAML files for: lint, test, build, deploy. Example: `.github/workflows/ci.yml` |
| 19 | OTA Updates Enabled | `app.config.js:227`: `updates: { enabled: false }` | Set `enabled: true`, add `url` pointing to EAS update server, configure `runtimeVersion` policy |
| 49 | Revenue Analytics Dashboard | Cannot verify from code — requires RevenueCat web dashboard | Go to RevenueCat Dashboard → Charts. Enable webhooks, set up revenue tracking |
| 53 | External Analytics (Mixpanel/Amplitude) | No external analytics SDK found in `package.json` or `src/`. Internal `analytics.ts` exists but is app-level only | Install Mixpanel/Amplitude/PostHog SDK, initialize in app entry point, add event tracking |
| 54-55 | Sentry Alerts & Performance Dashboards | Sentry SDK is integrated but dashboard alerts/performance monitoring are not configurable from code | Go to Sentry Dashboard → Alerts → Create rules for crash rate, error spikes. Enable Performance monitoring dashboards |
| 57 | GitHub CI/CD Secrets | No CI/CD exists (see #18) | After creating workflows, add secrets in GitHub → Settings → Secrets: `EXPO_TOKEN`, `SENTRY_AUTH_TOKEN`, etc. |
| 58-59 | Visual Regression & Load Testing | No visual regression or load testing tools in `package.json` | Install Percy/Chromatic for visual regression; Artillery/k6 for load testing Supabase Edge Functions |

---

## Key Priority Actions

### Blocking Store Submission (Must Do)
1. **#67/#17** — Get Apple Developer credentials and update `eas.json`
2. **#68** — Download Google Play service account JSON
3. **#27/#28** — Take store screenshots at required sizes
4. **#70** — Run and verify production builds
5. **#47** — Test IAP in sandbox on both platforms

### High Value Quick Wins
6. **#51** — Add `SENTRY_ORG` and `SENTRY_PROJECT` to `.env`
7. **#25** — Add `REVENUECAT_WEBHOOK_AUTH_KEY` to `.env.example`
8. **#26** — Replace Microsoft client ID placeholder with real value
9. **#19** — Enable OTA updates (`updates.enabled: true`)
10. **#35/#36** — Fill out privacy labels in App Store Connect / Play Console

### Nice-to-Have (Post-Launch)
11. **#4** — Biometric lock screen
12. **#12-14** — ML-based anomaly detection
13. **#18/#57** — GitHub Actions CI/CD
14. **#53** — External analytics integration
15. **#58-59** — Visual regression & load testing
