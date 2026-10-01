import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Image,
  Dimensions,
  Pressable,
  ViewStyle,
} from 'react-native';
import { LOGO_PARTICLES, LogoParticle } from './logoParticlesData';
import { fonts } from '../theme/tokens';

const LOGO_SRC = require('../../assets/servex_logo.png');

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
  // SX emblem aspect ratio is ~1.42 (width / height)
  const logoWidth = Math.round(logoHeight * 1.42);

  // Image size for clean solid asset (centered square container)
  const solidImageSize = Math.round(logoHeight * 1.18);

  // Run the 2.0-second native animated choreo
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;

    anim = Animated.timing(progress, {
      toValue: 1,
      duration: 2000,
      easing: Easing.bezier(0.22, 1, 0.36, 1), // Swift, refined easeOutCubic/Quint
      useNativeDriver: true,
    });

    // Listener for milestone triggers
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

    return () => {
      progress.removeListener(id);
      anim?.stop();
    };
  }, [progress]);

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

  // Subtle logo scale: settle from 1.05 to 1.0
  const headerScale = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.6, 0.75, 1.0],
        outputRange: [1.08, 1.04, 1.0, 0.94],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Solid logo opacity:
  // 0.0 to 0.60: 0
  // 0.60 to 0.70: cross-fades in cleanly from 0 -> 1
  // 0.70 to 1.0: remains 1
  const solidLogoOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.58, 0.7, 1.0],
        outputRange: [0, 0, 1, 1],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // Subtle blue ambient aura behind emblem
  const subtleGlowOpacity = useMemo(
    () =>
      progress.interpolate({
        inputRange: [0, 0.45, 0.68, 1.0],
        outputRange: [0, 0.35, 0.22, 0.15],
        extrapolate: 'clamp',
      }),
    [progress]
  );

  // SERVEX wordmark:
  // 0.0 to 0.70: hidden (0)
  // 0.70 to 0.84: fades in (0 -> 1) with subtle upward movement (8 -> 0)
  // 0.84 to 1.0: remains 1
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

  // Render individual particle interpolations
  const renderedParticles = useMemo(() => {
    return LOGO_PARTICLES.map((p: LogoParticle) => {
      // Coordinate calculation
      const targetX = p.targetX * logoWidth;
      const targetY = p.targetY * logoHeight;

      // Initial scattered position: 1.5x - 2.0x logo radius around center
      const scatterX = (p.targetX * 0.32 + p.scatterX * 1.38) * logoWidth;
      const scatterY = (p.targetY * 0.32 + p.scatterY * 1.38) * logoHeight;

      // Stagger window normalized from delay (0 to 120ms => 0.0 to 0.06 normalized)
      const stagger = (p.delay / 120) * 0.06;
      const startMove = 0.14 + stagger;
      const reachTarget = 0.48 + stagger;

      // X translation: scatter -> target
      const translateX = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [scatterX, scatterX, targetX, targetX],
        extrapolate: 'clamp',
      });

      // Y translation: scatter -> target
      const translateY = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [scatterY, scatterY, targetY, targetY],
        extrapolate: 'clamp',
      });

      // Opacity:
      // 0.0 -> 0.12: fades in (0 -> 0.9)
      // 0.12 -> 0.60: visible while moving and forming (0.9 -> 1.0)
      // 0.60 -> 0.70: cross-fades out cleanly as solid logo takes over (1.0 -> 0.0)
      const opacity = progress.interpolate({
        inputRange: [0, 0.12, 0.58, 0.68, 1.0],
        outputRange: [0, 0.88, 1.0, 0, 0],
        extrapolate: 'clamp',
      });

      // Scale: slightly smaller initially, crisp at target
      const scale = progress.interpolate({
        inputRange: [0, startMove, reachTarget, 1.0],
        outputRange: [0.75, 0.85, 1.0, 1.0],
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
  }, [progress, logoWidth, logoHeight]);

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
              width: solidImageSize * 1.5,
              height: solidImageSize * 1.5,
              borderRadius: (solidImageSize * 1.5) / 2,
              opacity: subtleGlowOpacity,
            },
          ]}
        />

        {/* Center Stage for Logo / Particles */}
        <View
          style={[
            styles.stageContainer,
            { width: logoWidth + 40, height: logoHeight + 40 },
          ]}
        >
          {/* 1. Assembling Particles Layer */}
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            <View style={styles.particlesCenterWrapper}>
              {renderedParticles}
            </View>
          </View>

          {/* 2. Solid Servex Monogram Image Layer (fades in cleanly on top) */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.solidLogoWrapper,
              {
                width: solidImageSize,
                height: solidImageSize,
                opacity: solidLogoOpacity,
              },
            ]}
          >
            <Image
              source={LOGO_SRC}
              style={[
                styles.solidLogoImage,
                { width: solidImageSize, height: solidImageSize },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* 3. SERVEX Wordmark (fades in underneath) */}
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
    shadowRadius: 24,
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
    shadowOpacity: 0.4,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  solidLogoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidLogoImage: {
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
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
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
});
