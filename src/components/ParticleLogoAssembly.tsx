import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Pressable,
  ViewStyle,
} from 'react-native';
import { LOGO_3D_PARTICLES, Logo3DParticle } from './logoParticles3DData';
import { fonts } from '../theme/tokens';
import { Servex3DLogo } from './Servex3DLogo';

export interface ParticleLogoAssemblyProps {
  /**
   * Optional shared Animated.Value (0 to 1). If not passed, the component creates and drives its own.
   */
  progressAnim?: Animated.Value;
  /**
   * Callback fired when particle assembly stabilizes and logo is solid (~1.2s-1.4s).
   */
  onLogoSettled?: () => void;
  /**
   * Callback fired when entire 2.0s sequence completes and auth form is ready.
   */
  onAnimationComplete?: () => void;
  /**
   * Allow user to tap anywhere on the intro to instantly skip to ready state.
   */
  allowSkip?: boolean;
  /**
   * Optional container override style.
   */
  containerStyle?: ViewStyle;
}

export const ParticleLogoAssembly: React.FC<ParticleLogoAssemblyProps> = ({
  progressAnim: externalProgress,
  onLogoSettled,
  onAnimationComplete,
  allowSkip = true,
  containerStyle,
}) => {
  const [internalProgress] = useState(() => new Animated.Value(0));
  const progress = externalProgress || internalProgress;

  // Continuous subtle 3D spatial orbit after assembly
  const [ambientOrbitY] = useState(() => new Animated.Value(0));
  const [ambientOrbitX] = useState(() => new Animated.Value(0));

  const onLogoSettledRef = useRef(onLogoSettled);
  const onAnimationCompleteRef = useRef(onAnimationComplete);

  useEffect(() => {
    onLogoSettledRef.current = onLogoSettled;
    onAnimationCompleteRef.current = onAnimationComplete;
  }, [onLogoSettled, onAnimationComplete]);

  const hasSettledRef = useRef(false);
  const hasCompletedRef = useRef(false);

  // Responsive dimensions
  const windowDims = Dimensions.get('window');
  const screenHeight = windowDims.height;

  // Logo proportion: ~14-16% of screen height, capped between 85dp and 115dp
  const logoHeight = Math.min(Math.max(Math.round(screenHeight * 0.14), 85), 115);
  // SX emblem aspect ratio is ~1.428 (width / height)
  const logoWidth = Math.round(logoHeight * 1.428);
  const depthScale = Math.round(logoHeight * 0.35); // 3D depth volume

  // Run the 2.0-second native animated choreo
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;

    anim = Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // Swift, refined easeOutCubic/Quint
      useNativeDriver: true,
    });

    // Milestone listener
    const id = progress.addListener(({ value }: { value: number }) => {
      if (value >= 0.68 && !hasSettledRef.current) {
        hasSettledRef.current = true;
        onLogoSettledRef.current?.();
      }
      if (value >= 0.99 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        onAnimationCompleteRef.current?.();
      }
    });

    anim.start();

    // Continuous 3D orbit loop
    const orbitLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ambientOrbitY, {
            toValue: 6,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ambientOrbitX, {
            toValue: -4,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ambientOrbitY, {
            toValue: -6,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ambientOrbitX, {
            toValue: 4,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    orbitLoop.start();

    return () => {
      progress.removeListener(id);
      anim?.stop();
      orbitLoop.stop();
    };
  }, [progress, ambientOrbitY, ambientOrbitX]);

  // Tap to instantly complete animation
  const handleSkip = () => {
    if (!allowSkip || hasCompletedRef.current) return;
    hasSettledRef.current = true;
    hasCompletedRef.current = true;
    progress.setValue(1);
    onLogoSettledRef.current?.();
    onAnimationCompleteRef.current?.();
  };

  // Header translation: Shifts upward slightly (~ -32dp) as auth form appears (0.85 -> 1.0)
  const headerTranslateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.82, 1.0],
        outputRange: [0, 0, -32],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Subtle logo scale settling
  const headerScale = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.6, 0.75, 1.0],
        outputRange: [1.1, 1.04, 1.0, 0.94],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // 3D Camera / Spatial Rotation across the assembly sequence
  // Starts angled in 3D space (-35deg, 18deg) so particles visibly float in 3D space,
  // then swoops to center (0deg) as they assemble into the 3D logo
  const stageRotateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.25, 0.65, 1.0],
        outputRange: ['-35deg', '-22deg', '0deg', '0deg'],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  const stageRotateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.25, 0.65, 1.0],
        outputRange: ['18deg', '12deg', '0deg', '0deg'],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // 3D Solid Vector Logo opacity (illuminates directly out of the particles)
  const solidLogoOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.55, 0.72, 1.0],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Subtle ambient glow aura behind 3D logo
  const subtleGlowOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.45, 0.68, 1.0],
        outputRange: [0, 0.38, 0.25, 0.18],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // SERVEX wordmark:
  // Fades in (0 -> 1) with subtle upward movement (8 -> 0) at 1.4s
  const wordmarkOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.7, 0.84, 1.0],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  const wordmarkTranslateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.7, 0.84, 1.0],
        outputRange: [8, 8, 0, 0],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Render 3D particles in space
  const rendered3DParticles = useMemo(() => {
    // 3D FOV perspective projection factor
    const fov = 350;

    return LOGO_3D_PARTICLES.map((p: Logo3DParticle) => {
      // 3D target coordinates
      const targetX = p.targetX * logoWidth;
      const targetY = p.targetY * logoHeight;
      const targetZ = p.targetZ * depthScale;

      // Initial 3D space scattered position
      const scatterX = p.scatterX * logoWidth * 0.95;
      const scatterY = p.scatterY * logoHeight * 0.95;
      const scatterZ = p.scatterZ * depthScale * 2.2;

      // 3D perspective projection scaling for true space depth
      const projStart = Math.max(0.4, (fov + scatterZ) / fov);
      const projEnd = Math.max(0.7, (fov + targetZ) / fov);

      const effectiveScatterX = scatterX * projStart;
      const effectiveScatterY = scatterY * projStart;
      const effectiveTargetX = targetX * projEnd;
      const effectiveTargetY = targetY * projEnd;

      // Stagger window normalized from delay (0 to 140ms => 0.0 to 0.07)
      const stagger = (p.delay / 140) * 0.07;
      const startMove = 0.12 + stagger;
      const reachTarget = 0.48 + stagger;

      // X translation: space scatter -> 3D logo coordinate
      const translateX = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [effectiveScatterX, effectiveScatterX, effectiveTargetX, effectiveTargetX],
        extrapolate: 'clamp',
      });

      // Y translation: space scatter -> 3D logo coordinate
      const translateY = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [effectiveScatterY, effectiveScatterY, effectiveTargetY, effectiveTargetY],
        extrapolate: 'clamp',
      });

      // 3D Depth Scale: closer particles are larger
      const startScale = Math.min(1.4, Math.max(0.5, projStart));
      const endScale = Math.min(1.2, Math.max(0.7, projEnd));
      const scale = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [startScale, startScale, endScale, endScale],
        extrapolate: 'clamp',
      });

      // Opacity:
      // In space: 0 -> 0.85
      // During attraction: visible in 3D space
      // Once logo solidifies: particles remain as glowing vertex nodes on the 3D logo!
      const baseOpacity = p.layer === 'front' ? 1.0 : p.layer === 'bevel' ? 0.85 : 0.65;
      const opacity = progress.interpolate({
        inputRange: [0, 0.12, 0.58, 0.75, 1.0],
        outputRange: [0, 0.85, baseOpacity, baseOpacity * 0.7, baseOpacity * 0.55],
        extrapolate: 'clamp',
      });

      const halfSize = p.size / 2;

      return (
        <Animated.View
          key={p.id}
          pointerEvents="none"
          style={[
            styles.particle,
            {
              width: p.size,
              height: p.size,
              borderRadius: halfSize,
              backgroundColor: p.color,
              opacity,
              transform: [{ translateX }, { translateY }, { scale }],
            },
          ]}
        />
      );
    });
  }, [progress, logoWidth, logoHeight, depthScale]);

  return (
    <Pressable
      onPress={handleSkip}
      style={[styles.container, containerStyle]}
      accessibilityRole="none"
    >
      <Animated.View
        style={[
          styles.headerCluster,
          {
            transform: [
              { translateY: headerTranslateY },
              { scale: headerScale },
            ],
          },
        ]}
      >
        {/* Subtle Ambient Back-Glow */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ambientGlow,
            {
              width: logoHeight * 1.8,
              height: logoHeight * 1.8,
              borderRadius: (logoHeight * 1.8) / 2,
              opacity: subtleGlowOpacity,
            },
          ]}
        />

        {/* 3D Space Stage Container */}
        <Animated.View
          style={[
            styles.stageContainer,
            {
              width: logoWidth + 48,
              height: logoHeight + 48,
              transform: [
                { perspective: 900 },
                { rotateY: stageRotateY as any },
                { rotateX: stageRotateX as any },
              ],
            },
          ]}
        >
          {/* 1. 3D Servex Monogram Vector Facets (powers up under the particles with metallic gradients) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.solidLogoWrapper,
              {
                opacity: solidLogoOpacity,
              },
            ]}
          >
            <Servex3DLogo
              size={logoHeight}
              enable3DTilt={true}
            />
          </Animated.View>

          {/* 2. Assembling 3D Dot Particles in Space (Particles combine directly into the 3D logo!) */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.particlesCenterWrapper}>
              {rendered3DParticles}
            </View>
          </View>
        </Animated.View>

        {/* 3. SERVEX Wordmark (fades in cleanly underneath 3D logo) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wordmarkWrapper,
            {
              opacity: wordmarkOpacity,
              transform: [{ translateY: wordmarkTranslateY }],
            },
          ]}
        >
          <Text style={styles.wordmarkText}>SERVEX</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  headerCluster: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    backgroundColor: '#3B82F6',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.8,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  stageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  particlesCenterWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  particle: {
    position: 'absolute',
    shadowColor: '#60A5FA',
    shadowOpacity: 0.5,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 0 },
  },
  solidLogoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrapper: {
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
});
