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

  // Responsive dimensions - compact executive proportion
  const windowDims = Dimensions.get('window');
  const screenHeight = windowDims.height;

  // Compact, balanced size (~64dp height, ~92dp width)
  const logoHeight = Math.min(Math.max(Math.round(screenHeight * 0.095), 62), 74);
  const logoWidth = Math.round(logoHeight * 1.428);
  const depthScale = Math.round(logoHeight * 0.32);

  // Run the 2.0-second native animated choreo
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;

    anim = Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.22, 1, 0.36, 1),
      useNativeDriver: true,
    });

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

    // Continuous subtle 3D pendulum oscillation after assembly
    const orbitLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ambientOrbitY, {
            toValue: 5,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ambientOrbitX, {
            toValue: -3,
            duration: 2600,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(ambientOrbitY, {
            toValue: -5,
            duration: 2800,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(ambientOrbitX, {
            toValue: 3,
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

  // Header translation: Shifts upward slightly (~ -18dp) as auth form appears
  const headerTranslateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.82, 1.0],
        outputRange: [0, 0, -18],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Subtle logo scale settling
  const headerScale = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.6, 0.75, 1.0],
        outputRange: [1.08, 1.03, 1.0, 0.96],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // 3D Camera / Spatial Rotation across the assembly sequence
  const stageRotateY = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.25, 0.65, 1.0],
        outputRange: ['-30deg', '-18deg', '0deg', '0deg'],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  const stageRotateX = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.25, 0.65, 1.0],
        outputRange: ['15deg', '10deg', '0deg', '0deg'],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // 3D Solid Vector Logo opacity (illuminates directly out of the assembling particles)
  const solidLogoOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.55, 0.72, 1.0],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // SERVEX wordmark:
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
        outputRange: [6, 6, 0, 0],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Render 3D particles (dots & dashes in pure white)
  const rendered3DParticles = useMemo(() => {
    const fov = 350;

    return LOGO_3D_PARTICLES.map((p: Logo3DParticle) => {
      const targetX = p.targetX * logoWidth;
      const targetY = p.targetY * logoHeight;
      const targetZ = p.targetZ * depthScale;

      const scatterX = p.scatterX * logoWidth * 0.95;
      const scatterY = p.scatterY * logoHeight * 0.95;
      const scatterZ = p.scatterZ * depthScale * 2.2;

      const projStart = Math.max(0.4, (fov + scatterZ) / fov);
      const projEnd = Math.max(0.7, (fov + targetZ) / fov);

      const effectiveScatterX = scatterX * projStart;
      const effectiveScatterY = scatterY * projStart;
      const effectiveTargetX = targetX * projEnd;
      const effectiveTargetY = targetY * projEnd;

      const stagger = (p.delay / 140) * 0.07;
      const startMove = 0.12 + stagger;
      const reachTarget = 0.48 + stagger;

      const translateX = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [effectiveScatterX, effectiveScatterX, effectiveTargetX, effectiveTargetX],
        extrapolate: 'clamp',
      });

      const translateY = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [effectiveScatterY, effectiveScatterY, effectiveTargetY, effectiveTargetY],
        extrapolate: 'clamp',
      });

      const startScale = Math.min(1.4, Math.max(0.5, projStart));
      const endScale = Math.min(1.2, Math.max(0.7, projEnd));
      const scale = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [startScale, startScale, endScale, endScale],
        extrapolate: 'clamp',
      });

      // Opacity: particles coalesce into the logo and remain as living vertex nodes on the 3D monogram
      const baseOpacity = p.layer === 'front' ? 1.0 : p.layer === 'bevel' ? 0.85 : 0.65;
      const opacity = progress.interpolate({
        inputRange: [0, 0.12, 0.58, 0.75, 1.0],
        outputRange: [0, 0.85, baseOpacity, baseOpacity * 0.65, baseOpacity * 0.50],
        extrapolate: 'clamp',
      });

      const isDash = p.shape === 'dash';

      return (
        <Animated.View
          key={p.id}
          pointerEvents="none"
          style={[
            styles.particle,
            isDash
              ? {
                  width: p.size * 1.8,
                  height: Math.max(1.5, p.size * 0.45),
                  borderRadius: 1,
                  backgroundColor: '#FFFFFF',
                  opacity,
                  transform: [
                    { translateX },
                    { translateY },
                    { scale },
                    { rotate: p.angle + 'deg' },
                  ],
                }
              : {
                  width: p.size,
                  height: p.size,
                  borderRadius: p.size / 2,
                  backgroundColor: '#FFFFFF',
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
        {/* 3D Space Stage Container */}
        <Animated.View
          style={[
            styles.stageContainer,
            {
              width: logoWidth + 36,
              height: logoHeight + 36,
              transform: [
                { perspective: 900 },
                { rotateY: stageRotateY as any },
                { rotateX: stageRotateX as any },
              ],
            },
          ]}
        >
          {/* 1. 3D Servex Monogram Vector Facets (illuminates directly out of the assembling particles) */}
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

          {/* 2. Assembling & Living 3D White Dots (.) and Dashes (-) in Space */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.particlesCenterWrapper}>
              {rendered3DParticles}
            </View>
          </View>
        </Animated.View>

        {/* 3. SERVEX Wordmark (clean white with letter spacing) */}
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
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: 'transparent',
  },
  headerCluster: {
    alignItems: 'center',
    justifyContent: 'center',
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
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.6,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  solidLogoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkWrapper: {
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wordmarkText: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 7,
    textTransform: 'uppercase',
  },
});
