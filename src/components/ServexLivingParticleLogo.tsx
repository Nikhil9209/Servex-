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
   * Width of the particle field in dp (defaults to ~22% of screen width)
   */
  width?: number;
  /**
   * Whether to show the clean SERVEX wordmark underneath
   */
  showWordmark?: boolean;
  /**
   * Shared progress animation for intro timing (0 to 1)
   */
  introProgress?: Animated.Value;
  /**
   * Custom container style
   */
  containerStyle?: ViewStyle;
}

export const ServexLivingParticleLogo: React.FC<ServexLivingParticleLogoProps> = ({
  width: customWidth,
  showWordmark = true,
  introProgress,
  containerStyle,
}) => {
  const windowDims = Dimensions.get('window');
  const screenWidth = windowDims.width;

  // Proportions: ~22% of screen width (e.g. ~88 to 102dp on mobile), capped between 80 and 110
  const width = customWidth || Math.min(Math.max(Math.round(screenWidth * 0.23), 82), 108);
  // SX aspect ratio is ~1.428 (width / height)
  const height = Math.round(width / 1.428);

  // SVG Native Path Refs for ultra-high performance 60 FPS zero-overhead updates
  const whitePathRef = useRef<any>(null);
  const accentPathRef = useRef<any>(null);
  const depthPathRef = useRef<any>(null);

  // Fallback state for platforms where setNativeProps is bypassed
  const [initialPaths] = useState(() => generateFramePaths(0, 1.0));
  const [currentPaths, setCurrentPaths] = useState(initialPaths);

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
        outputRange: [8, 8, 0, 0],
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

      // Flow strength ramps from 0.2 to 1.0 during the first 0.8s
      const flowStrength = Math.min(1.0, 0.2 + (Date.now() - startTimeRef.current) * 0.001);

      const paths = generateFramePaths(elapsed, flowStrength);

      const updatedWhite = updatePathD(whitePathRef, paths.white);
      const updatedAccent = updatePathD(accentPathRef, paths.accent);
      const updatedDepth = updatePathD(depthPathRef, paths.depth);

      // If direct native props / DOM mutation wasn't available, throttle React state update to 30fps fallback
      if (!updatedWhite || !updatedAccent || !updatedDepth) {
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
  }, []);

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Subtle Ambient Back-Glow */}
      <View
        pointerEvents="none"
        style={[
          styles.ambientGlow,
          {
            width: width * 1.5,
            height: height * 1.5,
            borderRadius: (width * 1.5) / 2,
          },
        ]}
      />

      {/* The SX Living Particle Field */}
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
          viewBox="0 0 200 140"
          style={styles.svg}
        >
          {/* Depth layer dashes (soft platinum) */}
          <Path
            ref={depthPathRef}
            d={currentPaths.depth}
            stroke="#94A3B8"
            strokeWidth={1.2}
            strokeLinecap="round"
            strokeOpacity={0.65}
          />

          {/* Main front layer dashes (crisp white / off-white) */}
          <Path
            ref={whitePathRef}
            d={currentPaths.white}
            stroke="#FFFFFF"
            strokeWidth={1.45}
            strokeLinecap="round"
            strokeOpacity={0.92}
          />

          {/* Accent layer dashes (restrained ocean/deep blue) */}
          <Path
            ref={accentPathRef}
            d={currentPaths.accent}
            stroke="#60A5FA"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeOpacity={0.95}
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
 * Calculates continuous procedural fluid wave paths for all 379 SX particles
 */
function generateFramePaths(time: number, flowStrength: number) {
  let whitePath = '';
  let accentPath = '';
  let depthPath = '';

  const count = SX_DASH_PARTICLES.length;
  for (let i = 0; i < count; i++) {
    const p: DashParticle = SX_DASH_PARTICLES[i];

    // Procedural fluid harmonic waves (sine, cosine, radial wave interference)
    const wave1 = Math.sin(time * 2.1 + p.normY * 5.2 + p.normX * 3.4 + p.phase);
    const wave2 = Math.cos(time * 2.5 + p.normX * 5.8 - p.normY * 3.8);
    const wave3 = Math.sin(time * 1.4 + (p.normX * p.normX + p.normY * p.normY) * 6.5);

    // Subtle fluid wave displacement (controlled amplitude ~ 1.8 to 2.8 units in 200x140 space)
    const dx = (wave1 * 2.4 + wave3 * 1.1) * flowStrength;
    const dy = (wave2 * 1.9 + wave1 * 0.9) * flowStrength;

    // Center point in viewBox 0 0 200 140
    const cx = 100 + p.normX * 136 + dx;
    const cy = 70 + p.normY * 96 + dy;

    // Dynamic dash orientation responding to local wave gradient/flow
    const angle = p.baseAngle + (wave1 * 0.24 + wave2 * 0.16) * flowStrength;

    // Dynamic dash length with subtle breathing
    const halfL = (p.length * (1 + wave3 * 0.15)) * 0.5;

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    const x1 = (cx - halfL * cosA).toFixed(1);
    const y1 = (cy - halfL * sinA).toFixed(1);
    const x2 = (cx + halfL * cosA).toFixed(1);
    const y2 = (cy + halfL * sinA).toFixed(1);

    const seg = `M${x1} ${y1}L${x2} ${y2}`;

    if (p.isAccent) {
      accentPath += seg;
    } else if (p.opacity < 0.65) {
      depthPath += seg;
    } else {
      whitePath += seg;
    }
  }

  return {
    white: whitePath,
    accent: accentPath,
    depth: depthPath,
  };
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  ambientGlow: {
    position: 'absolute',
    backgroundColor: '#1E40AF',
    shadowColor: '#3B82F6',
    shadowOpacity: 0.35,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
    opacity: 0.25,
  },
  fieldWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    overflow: 'visible',
  },
  wordmarkWrapper: {
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
});
