# SpendTrak Bundle Audit Report

*Generated: 2026-02-10*

## Summary

- **Total dependencies**: 59
- **Unused dependencies**: 19
- **Large dependencies (>500KB)**: 2
- **Config-only dependencies**: 5

## Unused Dependencies

These packages are in `package.json` but are not imported anywhere in `src/` or `app/` and are not referenced in config files.

| Package | Version | Est. Size | Recommendation |
|---------|---------|-----------|----------------|
| `react-native-web` | ^0.21.0 | ~200KB | Keep if web support is needed. Otherwise remove. |
| `react-dom` | 19.1.0 | ~130KB | Keep if web support is needed. Otherwise remove. |
| `@gorhom/bottom-sheet` | ^5.2.8 | ~120KB | Remove — not imported anywhere. Use expo-router modals instead. |
| `expo-dev-client` | ~6.0.20 | ~100KB | Review — may be removable. |
| `zod` | ^4.3.5 | ~55KB | Remove — not imported. Remove with @hookform/resolvers. |
| `@hookform/resolvers` | ^5.2.2 | ~40KB | Remove — react-hook-form is also unused (no useForm calls found). |
| `react-native-screens` | ~4.16.0 | ~40KB | Review — may be removable. |
| `react-hook-form` | ^7.70.0 | ~30KB | Remove — no useForm/useController calls found in codebase. |
| `react-native-mmkv` | ^4.1.1 | ~30KB | Remove — not imported. AsyncStorage is used instead. |
| `react-native-nitro-modules` | ^0.33.1 | ~20KB | Remove — not imported anywhere. |
| `react-native-worklets` | 0.5.1 | ~20KB | Keep — peer dependency of react-native-reanimated. |
| `@expo/metro-runtime` | ~6.1.2 | ~15KB | Review — may be removable. |
| `expo-linking` | ~8.0.11 | ~15KB | Remove — not imported. expo-router handles deep linking. |
| `react-native-shadow-2` | ^7.1.2 | ~15KB | Remove — not imported. Shadows are done via RN styles. |
| `semver` | ^7.7.3 | ~12KB | Remove — not imported anywhere. |
| `expo-device` | ~8.0.10 | ~10KB | Remove — not imported. Can be re-added if device info is needed later. |
| `install` | ^0.13.0 | ~5KB | Remove — this is an accidental npm artifact (the `install` package). |
| `@babel/plugin-syntax-import-meta` | ^7.10.4 | ~1KB | Review — may be removable. |
| `clsx` | ^2.1.1 | ~1KB | Remove — tiny but unused. No class merging in RN project. |

## Large Dependencies (>500KB)

| Package | Est. Size | Status | Notes |
|---------|-----------|--------|-------|
| `react-native` | ~900KB | USED | Core framework — cannot be removed. |
| `@sentry/react-native` | ~600KB | USED | Required for error monitoring. Consider lazy-loading. |

## Duplicate / Overlap Analysis

| Concern | Details |
|---------|---------|
| `react-hook-form` + `@hookform/resolvers` + `zod` | All three are unused. Remove together. |
| `react-native-mmkv` vs `AsyncStorage` | MMKV is installed but unused — AsyncStorage is used everywhere. Remove MMKV. |
| `expo-image` vs `expo-image-picker` | `expo-image` (display) is unused. `expo-image-picker` (selection) is used. Remove `expo-image`. |
| `@gorhom/bottom-sheet` vs modals | Bottom sheet not imported. Modals are handled via expo-router. Remove it. |

## Lighter Alternatives

| Current | Alternative | Savings |
|---------|-------------|---------|
| `date-fns` (~300KB) | `dayjs` (~7KB) | ~293KB — if only basic formatting is used |
| `@sentry/react-native` (~600KB) | `expo-updates` error boundary | Significant — but loses crash analytics |

## Config-Only Dependencies

These are not imported in source code but are referenced in build configuration.

| Package | Used In |
|---------|---------|
| `expo-notifications` | config files |
| `expo` | config files |
| `expo-image` | config files |
| `expo-asset` | app.config.js (plugin) |
| `expo-font` | app.config.js (plugin) |

## Full Dependency Table

| Package | Version | Est. Size | Status |
|---------|---------|-----------|--------|
| `react-native-web` | ^0.21.0 | ~200KB | UNUSED |
| `react-dom` | 19.1.0 | ~130KB | UNUSED |
| `@gorhom/bottom-sheet` | ^5.2.8 | ~120KB | UNUSED |
| `expo-dev-client` | ~6.0.20 | ~100KB | UNUSED |
| `zod` | ^4.3.5 | ~55KB | UNUSED |
| `@hookform/resolvers` | ^5.2.2 | ~40KB | UNUSED |
| `react-native-screens` | ~4.16.0 | ~40KB | UNUSED |
| `react-hook-form` | ^7.70.0 | ~30KB | UNUSED |
| `react-native-mmkv` | ^4.1.1 | ~30KB | UNUSED |
| `react-native-nitro-modules` | ^0.33.1 | ~20KB | UNUSED |
| `react-native-worklets` | 0.5.1 | ~20KB | UNUSED |
| `@expo/metro-runtime` | ~6.1.2 | ~15KB | UNUSED |
| `expo-linking` | ~8.0.11 | ~15KB | UNUSED |
| `react-native-shadow-2` | ^7.1.2 | ~15KB | UNUSED |
| `semver` | ^7.7.3 | ~12KB | UNUSED |
| `expo-device` | ~8.0.10 | ~10KB | UNUSED |
| `install` | ^0.13.0 | ~5KB | UNUSED |
| `@babel/plugin-syntax-import-meta` | ^7.10.4 | ~1KB | UNUSED |
| `clsx` | ^2.1.1 | ~1KB | UNUSED |
| `react-native` | 0.81.5 | ~900KB | USED |
| `@sentry/react-native` | ~7.2.0 | ~600KB | USED |
| `date-fns` | ^4.1.0 | ~300KB | USED |
| `react-native-reanimated` | ~4.1.0 | ~250KB | USED |
| `@supabase/supabase-js` | ^2.90.1 | ~200KB | USED |
| `expo-router` | ~6.0.23 | ~120KB | USED |
| `@react-navigation/native` | ^7.1.8 | ~80KB | USED |
| `expo-av` | ^16.0.8 | ~80KB | USED |
| `expo-notifications` | ~0.32.16 | ~80KB | CONFIG-ONLY |
| `react-native-gesture-handler` | ~2.28.0 | ~80KB | USED |
| `react-native-purchases` | ^9.7.5 | ~80KB | USED |
| `expo-camera` | ~17.0.10 | ~60KB | USED |
| `expo-updates` | ~29.0.16 | ~60KB | USED |
| `react-native-svg` | 15.12.1 | ~60KB | USED |
| `@react-native-async-storage/async-storage` | 2.2.0 | ~50KB | USED |
| `expo` | ~54.0.33 | ~50KB | CONFIG-ONLY |
| `react` | 19.1.0 | ~45KB | USED |
| `expo-image` | ~3.0.11 | ~40KB | CONFIG-ONLY |
| `@react-native-community/netinfo` | ^11.4.1 | ~30KB | USED |
| `expo-auth-session` | ~7.0.10 | ~30KB | USED |
| `expo-file-system` | ~19.0.21 | ~25KB | USED |
| `expo-image-picker` | ~17.0.10 | ~25KB | USED |
| `expo-asset` | ~12.0.12 | ~20KB | CONFIG-ONLY |
| `expo-image-manipulator` | ~14.0.8 | ~20KB | USED |
| `react-native-safe-area-context` | ~5.6.0 | ~20KB | USED |
| `expo-apple-authentication` | ~8.0.8 | ~15KB | USED |
| `expo-blur` | ~15.0.8 | ~15KB | USED |
| `expo-font` | ~14.0.10 | ~15KB | CONFIG-ONLY |
| `expo-splash-screen` | ^31.0.13 | ~15KB | USED |
| `@react-native-masked-view/masked-view` | ^0.3.2 | ~10KB | USED |
| `expo-constants` | ~18.0.13 | ~10KB | USED |
| `expo-linear-gradient` | ~15.0.8 | ~10KB | USED |
| `expo-secure-store` | ~15.0.8 | ~10KB | USED |
| `expo-sharing` | ~14.0.8 | ~10KB | USED |
| `expo-web-browser` | ~15.0.10 | ~10KB | USED |
| `zustand` | ^4.5.2 | ~10KB | USED |
| `expo-crypto` | ~15.0.8 | ~8KB | USED |
| `expo-haptics` | ~15.0.8 | ~8KB | USED |
| `@expo-google-fonts/cinzel` | ^0.4.2 | ~5KB | USED |
| `expo-status-bar` | ~3.0.9 | ~5KB | USED |

---

# Media Assets Audit

*Generated: 2026-02-10*

## Summary

- **Total assets**: 17 files
- **Total size**: 17.1 MB
- **Large files (>1MB)**: 3
- **Unreferenced files**: 5
- **PNG files**: 7 (6 over 200KB)

## Directory Breakdown

| Directory | Size | Files |
|-----------|------|-------|
| `assets/videos/` | 8.2 MB | 1 |
| `assets/ (root)` | 3.3 MB | 8 |
| `assets/models/` | 2.8 MB | 1 |
| `assets/3d/` | 1.9 MB | 1 |
| `assets/sounds/` | 830 KB | 5 |
| `assets/screenshots/` | 581 B | 1 |
| **TOTAL** | **17.1 MB** | **17** |

## Large Files (>1MB)

| File | Size | Referenced? | Recommendation |
|------|------|------------|----------------|
| `videos/spendtrak-intro.MOV` | 8.2 MB | Yes | Referenced in IntroVideo.tsx. Convert to MP4/H.264 for smaller size. |
| `models/ai-consultant.glb` | 2.8 MB | Yes | Not referenced in code. Candidate for removal (saves 2.8 MB). |
| `3d/quantum-robot.glb` | 1.9 MB | No | Not referenced in code. Candidate for removal (saves 2.0 MB). |

## Unreferenced Assets (Removal Candidates)

These files exist in `assets/` but are not referenced in `src/`, `app/`, or config files.

| File | Size | Notes |
|------|------|-------|
| `3d/quantum-robot.glb` | 1.9 MB | 3D model — likely unused feature |
| `sounds/quantum-intervention.wav` | 622 KB | Sound file — no audio import code found |
| `sounds/quantum-acknowledge.wav` | 172 KB | Sound file — no audio import code found |
| `sounds/quantum-success.mp3` | 18 KB | Sound file — no audio import code found |
| `sounds/quantum-speak.mp3` | 17 KB | Sound file — no audio import code found |

**Total removable size**: ~2.7 MB

## Image Optimization Opportunities

| File | Current Size | Suggestion |
|------|-------------|------------|
| `icon-1024.png` | 904 KB | App icon — keep as PNG (required by stores). Optimize with pngquant. |
| `icon.png` | 904 KB | App icon — keep as PNG (required by stores). Optimize with pngquant. |
| `adaptive-icon.png` | 591 KB | App icon — keep as PNG (required by stores). Optimize with pngquant. |
| `logo.png` | 341 KB | Convert to WebP for ~50-70% size reduction |
| `splash-icon.png` | 341 KB | Splash image — keep as PNG. Optimize with pngquant/tinypng. |
| `splash.png` | 341 KB | Splash image — keep as PNG. Optimize with pngquant/tinypng. |

## Recommendations

1. **Remove unused 3D models** (`quantum-robot.glb`, `ai-consultant.glb`) — saves ~4.8 MB
2. **Remove unused sound files** (if quantum sounds feature is not active) — saves ~813 KB
3. **Convert intro video** from MOV to MP4/H.264 — could reduce 8.3 MB by 50-70%
4. **Optimize PNGs** — run through `pngquant` or `tinypng` for lossless/near-lossless compression
5. **Consider lazy-loading** 3D assets and video only when needed
