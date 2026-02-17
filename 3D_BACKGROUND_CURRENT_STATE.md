# 3D BACKGROUND & VISUAL LAYERS — CURRENT STATE AUDIT

**Date:** 2026-02-14
**Branch:** master
**Expo SDK:** 54.0.33 | **React Native:** 0.81.5 | **React:** 19.1.0

---

## 1. VISUAL LAYER STACK (Render Order, Bottom to Top)

```
Layer 0: ThreeBackground container (#000000 black)
         ├─ IF expo-gl installed: GLView (3D Three.js scene — 25 objects + 1500 particles)
         └─ ELSE (CURRENT): FallbackBackground (2D animated — 16 shapes + 50 particles)
         └─ Smoke Overlay (2x LinearGradient at bottom 50% — green fog rgba(0,255,136,0.03→0.25))

Layer 1: BottomGlow (absolute bottom, 45% screen height, zIndex: 1)
         ├─ Base LinearGradient (green, opacity ~0.22 at bottom)
         ├─ Cloud 1 (SVG RadialGradient, center-bottom, #00ff88, breathing 6s)
         ├─ Cloud 2 (SVG RadialGradient, left-bottom, #00cc6a, breathing 5s)
         ├─ Cloud 3 (SVG RadialGradient, right-bottom, #00e67a, breathing 4s)
         └─ Pulse LinearGradient (green, throbbing 8s)

Layer 2: StatusBar (light style)

Layer 3: OfflineBanner (conditional, only when offline)

Layer 4: Stack Navigator (contentStyle: backgroundColor: 'transparent')
         └─ Current Route Screen (all have transparent backgrounds)

Layer 5: QuantumAliveOverlay (zIndex: 9998, in tabs layout only)
         ├─ QuantumToast
         ├─ QuantumCelebration
         └─ QuantumFloatingPresence (breathing dot, bottom: 80)

Layer 6: Behavioral/Contextual Overlays (modals, upgrade prompts, etc.)
```

**Key architectural principle:** The root `app/_layout.tsx` (line 216-269) wraps EVERYTHING inside `<ThreeBackground>`, which renders the 3D/2D background at the absolute bottom, then children on top. `<BottomGlow />` is a sibling rendered at line 217 inside ThreeBackground. All screens use `backgroundColor: 'transparent'` so the background shows through.

---

## 2. EXISTING 3D/ANIMATED BACKGROUND

### Does a Three.js WebView background exist? **NO (not WebView-based)**

The 3D background uses **expo-gl + expo-three** (native OpenGL), NOT a WebView. However:

### Is it currently rendering 3D? **NO — Falls back to 2D**

**Reason:** expo-gl, expo-three, and three are **NOT installed** (not in package.json, not in node_modules). The code at `src/components/background/AnimatedBackground.tsx` lines 33-40 does a try-catch `require()` which fails silently, so `GLView`, `ExpoRenderer`, and `THREE` are all `null`.

**Decision logic** (line 462-467):
```typescript
if (GLView && ExpoRenderer && THREE) {
  return <ThreeBackground />;  // Never reached currently
}
return <FallbackBackground />;  // Always used currently
```

### 3D Scene Details (dormant code, lines 49-274):

| Property | Value |
|----------|-------|
| Camera | PerspectiveCamera, FOV 75, position z=50 |
| Fog | FogExp2, color #000000, density 0.02 |
| Light 1 | PointLight #00ff88, intensity 2, distance 100, pos (30,30,30) |
| Light 2 | PointLight #39FF14, intensity 1.5, distance 100, pos (-30,-30,30) |
| Ambient | AmbientLight #ffffff, intensity 0.3 |
| Objects | **25 total** in random positions across 100x100x100 space |
| Geometries | TorusKnotGeometry(3,1,64,8), IcosahedronGeometry(4,0), OctahedronGeometry(5,0), TetrahedronGeometry(4,0) |
| Material | MeshPhongMaterial, HSL green, emissive #00ff88, opacity 0.6, 50% wireframe |
| Animation | Per-object rotation (±0.02/frame), sine float (0.02), scale pulse (1±0.1) |
| Particles | **1500** BufferGeometry points, spread ±100, HSL green, size 0.5, additive blending |
| Particle animation | Slow y-rotation (0.0005/frame) |
| Touch | PanResponder tracks finger → camera pans |

### Does it match the website? **YES — by design**

File header (line 4): *"EXACT match to spendtrak.app/index.html Three.js background"*
- Same 25 objects, same 4 geometries with identical parameters
- Same 1500 particle system
- Same green color scheme (#00ff88, #39FF14)
- Same fog, same lighting

### What the app currently shows (FallbackBackground, lines 279-457):

| Property | Value |
|----------|-------|
| Shapes | **16 floating shapes** with animated position, rotation, scale, opacity |
| Shape sizes | 20-60px, border colors alternate #00ff88 / #39FF14 |
| Shape styles | 50% wireframe (transparent fill), 50% solid border, mixed border-radius |
| Particles | **50 dots**, sizes 1-3px, twinkling opacity 0.3-0.8 |
| Animation | Y-float (3-7s), rotation (8-20s), scale pulse (2-5s), particle twinkle (1-4s) |
| Smoke overlay | 2 LinearGradients at bottom 50%, green fog up to rgba(0,255,136,0.25) |

---

## 3. EXISTING EFFECTS

### BottomGlow
- **File:** `src/components/background/BottomGlow.tsx` (184 lines)
- **Rendered at:** `app/_layout.tsx` line 217 (inside ThreeBackground)
- **What it does:** Animated green glow radiating upward from screen bottom
- **Height:** 45% of screen height
- **Layers:** 5 (base gradient + 3 SVG cloud layers + pulse gradient)
- **Animation:** 3 independent breathing cycles (4s, 5s, 6s) + 8s pulse throb
- **Colors:** #00ff88, #00cc6a, #00e67a (all green variants)
- **Uses:** react-native-reanimated, react-native-svg, expo-linear-gradient

### Smoke Overlay (part of AnimatedBackground)
- **Location:** Bottom 50% of AnimatedBackground
- **What it does:** 2 stacked LinearGradients creating green smoke/fog from bottom
- **Colors:** Transparent → rgba(0,255,136,0.03→0.25) upward
- **Static:** No animation (just gradient overlays)

### QuantumAliveOverlay
- **File:** `src/components/quantum/QuantumAliveOverlay.tsx` (57 lines)
- **Rendered at:** `app/(tabs)/_layout.tsx` line 130
- **What it does:** Composite overlay for Quantum AI presence
- **Contains:**
  - **QuantumToast** — notification toast from Quantum AI
  - **QuantumCelebration** — celebration animation
  - **QuantumFloatingPresence** — 6px breathing dot near bottom (above tab bar), color changes by emotion
- **zIndex:** 9998

### QuantumFloatingPresence
- **File:** `src/components/quantum/QuantumFloatingPresence.tsx` (120 lines)
- **What it does:** Subtle breathing dot at bottom: 80 showing Quantum is "alive"
- **Animation:** Scale breathing 1.0-1.3, opacity 0.3-0.7, 2s cycles
- **Colors:** Emotion-mapped (idle=deep green, happy=neon, alert=warning orange, etc.)

### QuantumStatusBar
- **File:** `src/components/quantum/QuantumStatusBar.tsx`
- **Rendered at:** Dashboard only (`app/(tabs)/index.tsx`)

### Onboarding Intro Effects (separate, not in main app flow)
- ParticleSystem, BackgroundGrid, ExpandingRings, FlareEffect, GlitchLogo, NoiseOverlay, ScanLine, TypewriterTitle
- Only active during first-time onboarding intro screen

---

## 4. SCREEN TRANSPARENCY MAP

| Screen | File | Background Color | Transparent? | Uses Background Component? | Own Effects? |
|--------|------|-----------------|--------------|---------------------------|-------------|
| **Root Layout** | `app/_layout.tsx` | `transparent` (line 281) | YES | ThreeBackground + BottomGlow (lines 216-217) | Smoke overlay |
| **Tabs Layout** | `app/(tabs)/_layout.tsx` | `transparent` (sceneStyle, line 136) | YES | QuantumAliveOverlay (line 130) | No |
| **Tab Bar** | `app/(tabs)/_layout.tsx` | `Colors.void` (#000000) (line 139) | NO (opaque black) | No | Neon glow on active icon |
| **Dashboard** | `app/(tabs)/index.tsx` | `transparent` (line ~864) | YES | No | No (inherits root) |
| **Transactions** | `app/(tabs)/transactions.tsx` | Redirects to /(tabs) | N/A | N/A | N/A |
| **Stats** | `app/(tabs)/stats.tsx` | `transparent` (line ~1137) | YES | No | No (inherits root) |
| **Alerts** | `app/(tabs)/alerts.tsx` | `transparent` (line ~1059) | YES | No | No (inherits root) |
| **Settings** | `app/(tabs)/settings.tsx` | `transparent` (line ~256) | YES | No | No (inherits root) |
| **Auth Layout** | `app/(auth)/_layout.tsx` | `transparent` (line 80) | YES | No | No (inherits root) |
| **Onboarding** | `app/(onboarding)/_layout.tsx` | `Colors.void` (#000000) (line 226) | NO (opaque) | No | Black overlay transitions |
| **Modals** | `app/(modals)/_layout.tsx` | `transparent` (line 12) | YES | No | No (inherits root) |

---

## 5. DEPENDENCY STATUS

| Package | In package.json? | Installed? | Version | Used By |
|---------|-----------------|-----------|---------|---------|
| **react-native-reanimated** | YES | YES | ~4.1.0 | BottomGlow, QuantumFloatingPresence, many UI components |
| **react-native-svg** | YES | YES | 15.12.1 | BottomGlow (CloudLayer), icons |
| **expo-linear-gradient** | YES | YES | ~15.0.8 | AnimatedBackground smoke, BottomGlow base/pulse |
| **expo-gl** | NO | NO | - | AnimatedBackground ThreeBackground (dormant) |
| **expo-three** | NO | NO | - | AnimatedBackground ThreeBackground (dormant) |
| **three** | NO | NO | - | AnimatedBackground ThreeBackground (dormant) |
| **expo-dev-client** | YES | YES | ~5.1.15 | Required for native modules like expo-gl |
| **react-native-webview** | NO | NO | - | Not used anywhere |

### To enable 3D mode (from file header comments):
```bash
npx expo install expo-gl expo-dev-client
npm install expo-three@8.0.0 three@0.166.1 @types/three@0.166.0 --legacy-peer-deps
eas build --profile development --platform android
```

---

## 6. PROBLEMS FOUND

### Critical Issues
1. **3D background is completely dormant** — expo-gl, expo-three, three are not installed. The 25-object + 1500-particle Three.js scene exists in code but never executes. App always uses 2D FallbackBackground.

2. **No WebView-based alternative** — react-native-webview is not installed either. If you wanted a WebView-based Three.js approach (embedding the website's HTML), that package would need to be added.

### Architectural Notes (not bugs)
3. **FallbackBackground uses old Animated API** — Uses `React Native Animated` (not reanimated) for 2D shapes/particles. This works but is less performant than Reanimated 2 which BottomGlow uses.

4. **Smoke overlay is duplicated** — Both AnimatedBackground (lines 246-267) and BottomGlow (lines 108-166) create green fog/glow at the bottom of the screen. They overlap, which may be intentional (additive layering) but could cause visual redundancy.

5. **QuantumAliveOverlay only in tabs** — It's rendered in `app/(tabs)/_layout.tsx` line 130, not in root layout. Quantum presence disappears on auth, onboarding, modals, and settings sub-pages.

### Import/Reference Issues
6. **QuantumStatusBar imported in index.ts** — `src/components/quantum/index.ts` exports QuantumStatusBar, and it's used in the dashboard. No broken imports found.

7. **All background exports are clean** — `src/components/background/index.ts` exports AnimatedBackground, ThreeBackground, and BottomGlow. Root layout imports ThreeBackground and BottomGlow correctly.

### No Blocking Issues Found
- All current imports resolve correctly
- No missing files that are referenced
- No conflicting background layers (all screens transparent, single source of truth at root)
- The 2D fallback works independently of any 3D packages

---

## 7. COMPLETE FILE REFERENCE

| File | Lines | Purpose |
|------|-------|---------|
| `app/_layout.tsx` | ~289 | Root layout — renders ThreeBackground + BottomGlow wrapping entire app |
| `app/(tabs)/_layout.tsx` | ~470 | Tab layout — transparent scene, QuantumAliveOverlay, opaque tab bar |
| `src/components/background/AnimatedBackground.tsx` | ~501 | 3D/2D background — ThreeBackground (dormant) + FallbackBackground (active) |
| `src/components/background/BottomGlow.tsx` | ~184 | Animated green glow at screen bottom (5 layers) |
| `src/components/background/index.ts` | 5 | Barrel exports |
| `src/components/quantum/QuantumAliveOverlay.tsx` | 57 | Quantum presence composite (toast + celebration + floating dot) |
| `src/components/quantum/QuantumFloatingPresence.tsx` | 120 | Breathing dot indicator |
| `src/design/cinematic/colors.ts` | ~420 | Complete color system (greens, neons, semantics, transparents) |
| `src/config/theme.ts` | ~35 | Backward-compat re-export of cinematic colors |

---

## SUMMARY

The app has a **well-architected visual layer system** with a single background source at the root level and transparent screens throughout. The **3D Three.js background exists in code but is completely dormant** because expo-gl/three/expo-three are not installed. The app currently runs the **2D FallbackBackground** (16 animated shapes + 50 particles) plus **BottomGlow** (5-layer animated green fog). All visual packages needed for the 2D mode (reanimated, SVG, linear-gradient) are properly installed and working.
