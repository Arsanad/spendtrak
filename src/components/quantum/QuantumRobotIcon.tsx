// QuantumRobotIcon.tsx
// Unified API for the QUANTUM AI icon across the app
// Uses the glowing orb/planet design (AlienQuantumIcon)

import React from 'react';
import AlienQuantumIcon from '../effects/AlienQuantumIcon';

export interface QuantumRobotIconProps {
  size?: number;
  showGlow?: boolean;
  inGlassSphere?: boolean;
  sphereGlowIntensity?: 'subtle' | 'medium' | 'strong';
  /** Use simplified static version for faster initial render */
  simplified?: boolean;
  // Legacy props (ignored, kept for API compatibility)
  use3D?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
  isThinking?: boolean;
}

export const QuantumRobotIcon: React.FC<QuantumRobotIconProps> = ({
  size = 80,
  showGlow = true,
  inGlassSphere = false,
  sphereGlowIntensity = 'medium',
  simplified = false,
}) => {
  return (
    <AlienQuantumIcon
      size={size}
      showGlow={showGlow}
      inGlassSphere={inGlassSphere}
      sphereGlowIntensity={sphereGlowIntensity}
      simplified={simplified}
    />
  );
};

export default QuantumRobotIcon;
