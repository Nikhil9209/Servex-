import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { SX_DASH_PARTICLES, DashParticle } from './sxDashParticlesData';
import { fonts } from '../theme/tokens';

export interface ServexLivingParticleLogoProps {
  /**
   * Width of the particle field in dp (defaults to ~70% of screen width, ~260-280dp)
   */
  width?: number;
  /**
   * Whether to show the clean SERVEX wordmark underneath
   */
  showWordmark?: boolean;
  /**
   * Particle shape: 'dots' (crisp white circular points) or 'dashes' (slanted line segments). Defaults to 'dots'.
   */
  particleShape?: 'dots' | 'dashes';
  /**
   * Shared progress animation for intro timing (0 to 1)
   */
  introProgress?: Animated.Value;
  /**
   * Custom container style
   */
  containerStyle?: ViewStyle;
}

interface FramePaths {
  logoWhite: string;
  logoAccent: string;
  fieldWhite: string;
  fieldDepth: string;
}

export const ServexLivingParticleLogo: React.FC<ServexLivingParticleLogoProps> = ({
  width: customWidth,
  showWordmark = true,
  particleShape = 'dots',
  introProgress,
  containerStyle,
}) => {
  const windowDims = Dimensions.get('window');
  const screenWidth = windowDims.width;

  // Proportions matching reference image: ~68-72% of screen width (e.g. ~260-280dp)
  const width = customWidth || Math.min(Math.max(Math.round(screenWidth * 0.70), 250), 285);
  // Aspect ratio is 270 / 230 ≈ 1.174
  const height = Math.round(width * (230 / 270));

  // SVG Native Path Refs for ultra-high performance 60 FPS zero-overhead updates
  const logoWhitePathRef = useRef<any>(null);
  const logoAccentPathRef = useRef<any>(null);
  const fieldWhitePathRef = useRef<any>(null);
  const fieldDepthPathRef = useRef<any>(null);

  // Fallback state for platforms where setNativeProps is bypassed
  const [initialPaths] = useState(() => generateFramePaths(0, 1.0, particleShape));
  const [currentPaths, setCurrentPaths] = useState<FramePaths>(initialPaths);

  // Internal time reference
  const startTimeRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);

  // Intro fade-in and wordmark animations
  const [internalIntro] = useState(() => new Animated.Value(1));
  const progress = introProgress || internalIntro;

  const logoOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.15, 1.0],
        outputRange: [0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  const wordmarkOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.58, 0.72, 1.0],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  const wordmarkTranslateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.58, 0.72, 1.0],
        outputRange: [6, 6, 0, 0],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Continuous fluid wave particle animation loop targeting 60 FPS
  useEffect(() => {
    let isCancelled = false;
    startTimeRef.current = Date.now();

    // Direct DOM/Native update helper
    const updatePathD = (ref: any, d: string) => {
      if (!ref?.current) return false;
      try {
        if (Platform.OS === 'web') {
          // Direct SVG DOM attribute mutation (0.05ms)
          if (ref.current.setAttribute) {
            ref.current.setAttribute('d', d);
            return true;
          }
        }
        // React Native Native Driver setNativeProps
        if (ref.current.setNativeProps) {
          ref.current.setNativeProps({ d });
          return true;
        }
      } catch {
        return false;
      }
      return false;
    };

    let lastStateUpdateTime = 0;

    const animateLoop = () => {
      if (isCancelled) return;

      const elapsed = (Date.now() - startTimeRef.current) * 0.0016; // Time scale

      // Flow strength ramps smoothly from 0.3 to 1.0 during the first 0.8s
      const flowStrength = Math.min(1.0, 0.3 + (Date.now() - startTimeRef.current) * 0.001);

      const paths = generateFramePaths(elapsed, flowStrength, particleShape);

      const updatedLogoWhite = updatePathD(logoWhitePathRef, paths.logoWhite);
      const updatedLogoAccent = updatePathD(logoAccentPathRef, paths.logoAccent);
      const updatedFieldWhite = updatePathD(fieldWhitePathRef, paths.fieldWhite);
      const updatedFieldDepth = updatePathD(fieldDepthPathRef, paths.fieldDepth);

      // If direct native props / DOM mutation wasn't available, throttle React state update to 30fps fallback
      if (!updatedLogoWhite || !updatedLogoAccent || !updatedFieldWhite || !updatedFieldDepth) {
        const now = Date.now();
        if (now - lastStateUpdateTime > 32) {
          lastStateUpdateTime = now;
          setCurrentPaths(paths);
        }
      }

      rafIdRef.current = requestAnimationFrame(animateLoop);
    };

    rafIdRef.current = requestAnimationFrame(animateLoop);

    return () => {
      isCancelled = true;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [particleShape]);

  const isDots = particleShape === 'dots';

  return (
    <View style={[styles.container, containerStyle]}>
      {/* The SX Living Particle Field in Vortex Wave Motion */}
      <Animated.View
        style={[
          styles.fieldWrapper,
          {
            width,
            height,
            opacity: logoOpacity,
          },
        ]}
        pointerEvents="none"
      >
        <Svg
          width={width}
          height={height}
          viewBox="0 0 270 230"
          style={styles.svg}
        >
          {/* Layer 1: Ambient field deep dots/dashes (soft slate/silver) */}
          <Path
            ref={fieldDepthPathRef}
            d={currentPaths.fieldDepth}
            stroke="#64748B"
            strokeWidth={isDots ? 2.0 : 1.15}
            strokeLinecap="round"
            strokeOpacity={0.25}
          />

          {/* Layer 2: Ambient field bright dots/dashes (soft platinum) */}
          <Path
            ref={fieldWhitePathRef}
            d={currentPaths.fieldWhite}
            stroke="#CBD5E1"
            strokeWidth={isDots ? 2.6 : 1.35}
            strokeLinecap="round"
            strokeOpacity={0.42}
          />

          {/* Layer 3: Servex SX Logo Main (crisp luminous white dots) */}
          <Path
            ref={logoWhitePathRef}
            d={currentPaths.logoWhite}
            stroke="#FFFFFF"
            strokeWidth={isDots ? 3.8 : 1.85}
            strokeLinecap="round"
            strokeOpacity={0.98}
          />

          {/* Layer 4: Servex SX Logo Accents (electric ocean blue dots) */}
          <Path
            ref={logoAccentPathRef}
            d={currentPaths.logoAccent}
            stroke="#60A5FA"
            strokeWidth={isDots ? 4.0 : 1.9}
            strokeLinecap="round"
            strokeOpacity={1.0}
          />
        </Svg>
      </Animated.View>

      {/* Clean SERVEX Wordmark underneath */}
      {showWordmark && (
        <Animated.View
          style={[
            styles.wordmarkWrapper,
            {
              opacity: wordmarkOpacity,
              transform: [{ translateY: wordmarkTranslateY }],
            },
          ]}
          pointerEvents="none"
        >
          <Text style={styles.wordmarkText}>SERVEX</Text>
        </Animated.View>
      )}
    </View>
  );
};

/**
 * Calculates continuous procedural vortex fluid wave paths for all 361 SX particles
 */
function generateFramePaths(
  time: number,
  flowStrength: number,
  shape: 'dots' | 'dashes' = 'dots'
): FramePaths {
  let logoWhite = '';
  let logoAccent = '';
  let fieldWhite = '';
  let fieldDepth = '';

  const count = SX_DASH_PARTICLES.length;
  const CX = 135;
  const CY = 115;
  const SPAN_X = 240;
  const SPAN_Y = 200;
  const isDots = shape === 'dots';

  for (let i = 0; i < count; i++) {
    const p: DashParticle = SX_DASH_PARTICLES[i];

    // Base coordinates in 270x230 viewBox
    const X0 = CX + p.normX * SPAN_X;
    const Y0 = CY + p.normY * SPAN_Y;

    // Polar coordinates relative to vortex center
    const dx = X0 - CX;
    const dy = Y0 - CY;
    const r = Math.sqrt(dx * dx + dy * dy);
    const alpha = Math.atan2(dy, dx);

    // Procedural fluid harmonic waves (concentric swirl + radial ripple)
    const radialWave = Math.sin(time * 1.9 - r * 0.042 + p.phase);
    const harmonicWave = Math.cos(time * 2.3 + p.normX * 4.2 - p.normY * 3.6);
    const breathWave = Math.sin(time * 1.2 + r * 0.025);

    // Fluid displacement along tangential vortex flow + radial undulation
    const flowVel = (1.9 + harmonicWave * 1.2) * flowStrength;
    const radialVel = (radialWave * 1.5) * flowStrength;

    // Clockwise swirl tangent: dx_tangent = -sin(alpha), dy_tangent = cos(alpha)
    const dispX = -Math.sin(alpha) * flowVel + Math.cos(alpha) * radialVel;
    const dispY = Math.cos(alpha) * flowVel + Math.sin(alpha) * radialVel;

    const cx = X0 + dispX;
    const cy = Y0 + dispY;

    let seg = '';

    if (isDots) {
      // Circular white dot: zero-displacement segment with strokeLinecap="round"
      seg = `M${(cx - 0.05).toFixed(1)} ${cy.toFixed(1)}h0.1`;
    } else {
      // Slanted dash particle with flow field tangent
      const waveTilt = (radialWave * 0.22 + harmonicWave * 0.16) * flowStrength;
      const angle = alpha + Math.PI / 2 + waveTilt;
      const len = p.baseLength * (1 + breathWave * 0.12);
      const halfL = len * 0.5;

      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);

      const x1 = (cx - halfL * cosA).toFixed(1);
      const y1 = (cy - halfL * sinA).toFixed(1);
      const x2 = (cx + halfL * cosA).toFixed(1);
      const y2 = (cy + halfL * sinA).toFixed(1);

      seg = `M${x1} ${y1}L${x2} ${y2}`;
    }

    if (p.isLogo) {
      if (p.isAccent) {
        logoAccent += seg;
      } else {
        logoWhite += seg;
      }
    } else {
      if (p.opacity > 0.28) {
        fieldWhite += seg;
      } else {
        fieldDepth += seg;
      }
    }
  }

  return {
    logoWhite,
    logoAccent,
    fieldWhite,
    fieldDepth,
  };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  fieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    overflow: 'visible',
  },
  wordmarkWrapper: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 8,
    textTransform: 'uppercase',
  },
});
