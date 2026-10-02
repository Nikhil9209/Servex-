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
import { SX_DOT_PARTICLES, SxDotParticle } from './sxDashParticlesData';
import { fonts } from '../theme/tokens';

export interface ServexLivingParticleLogoProps {
  /**
   * Width of the SX particle logo in dp (defaults to sleek ~96-104dp)
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

  // Compact, executive proportion (~96 to 104dp on mobile)
  const width = customWidth || Math.min(Math.max(Math.round(screenWidth * 0.26), 92), 106);
  // SX logo aspect ratio is ~1.428 (width / height)
  const height = Math.round(width / 1.428);

  // SVG Native Path Ref for ultra-high performance 60 FPS zero-overhead updates
  const pathRef = useRef<any>(null);

  // Fallback state for platforms where setNativeProps is bypassed
  const [initialPath] = useState(() => generateFramePath(0, 1.0));
  const [currentPath, setCurrentPath] = useState<string>(initialPath);

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
        outputRange: [5, 5, 0, 0],
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

      const pathData = generateFramePath(elapsed, flowStrength);

      const updated = updatePathD(pathRef, pathData);

      // If direct native props / DOM mutation wasn't available, throttle React state update to 30fps fallback
      if (!updated) {
        const now = Date.now();
        if (now - lastStateUpdateTime > 32) {
          lastStateUpdateTime = now;
          setCurrentPath(pathData);
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
      {/* The Servex SX White Dot Particle Logo in Continuous Fluid Wave Motion */}
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
          viewBox="0 0 140 98"
          style={styles.svg}
        >
          {/* All dots in 100% pure white, forming ONLY the Servex SX logo */}
          <Path
            ref={pathRef}
            d={currentPath}
            stroke="#FFFFFF"
            strokeWidth={2.7}
            strokeLinecap="round"
            strokeOpacity={0.96}
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
 * Calculates continuous procedural fluid wave paths for all 223 organic white SX dots
 */
function generateFramePath(time: number, flowStrength: number): string {
  let pathStr = '';

  const count = SX_DOT_PARTICLES.length;
  const CX = 70;
  const CY = 49;
  const SPAN_X = 124;
  const SPAN_Y = 86;

  for (let i = 0; i < count; i++) {
    const p: SxDotParticle = SX_DOT_PARTICLES[i];

    // Procedural fluid harmonic waves (concentric swirl + radial ripple)
    const wave1 = Math.sin(time * 2.0 + p.normY * 4.5 + p.normX * 3.0 + p.phase);
    const wave2 = Math.cos(time * 2.4 + p.normX * 5.0 - p.normY * 3.5);
    const wave3 = Math.sin(time * 1.4 + (p.normX * p.normX + p.normY * p.normY) * 5.5);

    // Subtle fluid wave displacement (amplitude ~ 1.0 to 1.5 units in 140x98 space)
    const dx = (wave1 * 1.4 + wave3 * 0.7) * flowStrength;
    const dy = (wave2 * 1.2 + wave1 * 0.6) * flowStrength;

    const cx = CX + p.normX * SPAN_X + dx;
    const cy = CY + p.normY * SPAN_Y + dy;

    // Pure circular white dot using zero-displacement horizontal segment with strokeLinecap="round"
    pathStr += `M${(cx - 0.05).toFixed(1)} ${cy.toFixed(1)}h0.1`;
  }

  return pathStr;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 2,
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
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
});
