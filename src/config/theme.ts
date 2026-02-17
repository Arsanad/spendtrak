// SPENDTRAK CINEMATIC EDITION - Theme Config (Backward Compatibility)
// Re-exports Colors for config files that need category colors

import { Colors } from '../design/cinematic';

export const COLORS = {
  // Category colors - all green shades from Cinematic Edition
  category: {
    foodDining: Colors.neon,          // #00ff88
    transportation: Colors.bright,     // #00e67a
    shopping: Colors.primary,          // #00cc6a
    entertainment: Colors.medium,      // #00a858
    billsUtilities: Colors.deep,       // #008545
    health: Colors.neon,               // #00ff88
    travel: Colors.bright,             // #00e67a
    education: Colors.primary,         // #00cc6a
    personalCare: Colors.medium,       // #00a858
    housing: Colors.deep,              // #008545
    family: Colors.neon,               // #00ff88
    other: Colors.text.tertiary,       // #008545
  },

  // Primary colors
  primary: Colors.primary,
  neon: Colors.neon,

  // Backgrounds
  background: Colors.background,

  // Text
  text: Colors.text,

  // Borders
  border: Colors.border,
};

export default COLORS;
