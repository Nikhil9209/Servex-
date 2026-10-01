import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Servex Official 3D Monogram Logo (Black & Silver-White)
const DEFAULT_LOGO_IMAGE = require('../../assets/servex_logo.png');

export interface DiscordSplashScreenProps {
  /**
   * Called when the splash animation completes or is tapped to enter.
   */
  onFinish?: () => void;
  /**
   * Custom image source for the logo. Defaults to Servex SX emblem.
   */
  imageSource?: ImageSourcePropType;
  /**
   * Duration in ms before auto-transitioning (default: 4200ms).
   */
  durationMs?: number;
  /**
   * Allow user to tap anywhere to skip directly into the app.
   */
  allowSkip?: boolean;
}

// Executive UI Proportions: 92×92dp squircle with 22dp radius
const BOX_SIZE = 92;
const BOX_RADIUS = 22;

export default function DiscordSplashScreen({
  onFinish,
  imageSource = DEFAULT_LOGO_IMAGE,
  durationMs = 4200,
  allowSkip = true,
}: DiscordSplashScreenProps) {
  // Animation values
  const logoRotateAnim = useMemo(() => new Animated.Value(0), []);
  const logoScaleAnim = useMemo(() => new Animated.Value(1), []);
  const boxScaleAnim = useMemo(() => new Animated.Value(1), []);
  const boxRotateAnim = useMemo(() => new Animated.Value(0), []);
  const floatAnim = useMemo(() => new Animated.Value(0), []);
  const glowPulseAnim = useMemo(() => new Animated.Value(0.3), []);
  const fadeOutAnim = useMemo(() => new Animated.Value(1), []);

  const hasFinishedRef = useRef(false);

  // Memoized interpolations
  const logoRotate = useMemo(
    () =>
      logoRotateAnim.interpolate({
        inputRange: [-360, 360],
        outputRange: ['-360deg', '360deg'],
      }),
    [logoRotateAnim]
  );

  const boxRotate = useMemo(
    () =>
      boxRotateAnim.interpolate({
        inputRange: [-360, 360],
        outputRange: ['-360deg', '360deg'],
      }),
    [boxRotateAnim]
  );

  const completeSplash = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    Animated.parallel([
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(boxScaleAnim, {
        toValue: 1.14,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish?.();
    });
  }, [fadeOutAnim, boxScaleAnim, onFinish]);

  // Refined, high-end motion design:
  // Compact, tactile, precision Swiss-watch choreography
  useEffect(() => {
    let isCancelled = false;

    const runAnimationCycle = () => {
      if (isCancelled) return;

      // --- CYCLE 1: Refined Tilt -> Anticipation Dip -> 360 Snap ---
      Animated.sequence([
        // 1. Tilt Left (-12deg)
        Animated.parallel([
          Animated.timing(logoRotateAnim, {
            toValue: -13,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(boxRotateAnim, {
            toValue: -4,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 2. Tilt Right (+13deg)
        Animated.parallel([
          Animated.timing(logoRotateAnim, {
            toValue: 13,
            duration: 360,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(boxRotateAnim, {
            toValue: 4,
            duration: 360,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        // 3. Return Center (0deg)
        Animated.parallel([
          Animated.timing(logoRotateAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(boxRotateAnim, {
            toValue: 0,
            duration: 220,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // 4. Anticipation Shrink ("make it small in between")
        Animated.parallel([
          Animated.timing(logoScaleAnim, {
            toValue: 0.76,
            duration: 250,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(boxScaleAnim, {
            toValue: 0.93,
            duration: 250,
            easing: Easing.inOut(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
        Animated.delay(70),
        // 5. Fast 360° Spin with Spring Pop
        Animated.parallel([
          Animated.timing(logoRotateAnim, {
            toValue: 360,
            duration: 540,
            easing: Easing.bezier(0.22, 1, 0.36, 1),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(logoScaleAnim, {
              toValue: 1.07,
              duration: 360,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(logoScaleAnim, {
              toValue: 1.0,
              duration: 180,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
          Animated.sequence([
            Animated.timing(boxScaleAnim, {
              toValue: 1.04,
              duration: 360,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(boxScaleAnim, {
              toValue: 1.0,
              duration: 180,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.delay(420),
      ]).start(() => {
        if (isCancelled) return;
        logoRotateAnim.setValue(0); // 360deg == 0deg visually seamless

        // --- CYCLE 2: Shrink -> Counter 360 Spin -> Reverse Tilt ---
        Animated.sequence([
          // 1. Shrink In Between
          Animated.parallel([
            Animated.timing(logoScaleAnim, {
              toValue: 0.76,
              duration: 240,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(boxScaleAnim, {
              toValue: 0.93,
              duration: 240,
              easing: Easing.inOut(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
          Animated.delay(60),
          // 2. Counter 360 Spin & Pop Up
          Animated.parallel([
            Animated.timing(logoRotateAnim, {
              toValue: -360,
              duration: 540,
              easing: Easing.bezier(0.22, 1, 0.36, 1),
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(logoScaleAnim, {
                toValue: 1.07,
                duration: 360,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(logoScaleAnim, {
                toValue: 1.0,
                duration: 180,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(boxScaleAnim, {
                toValue: 1.04,
                duration: 360,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(boxScaleAnim, {
                toValue: 1.0,
                duration: 180,
                easing: Easing.inOut(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
          ]),
          Animated.delay(90),
        ]).start(() => {
          if (isCancelled) return;
          logoRotateAnim.setValue(0);

          // 3. Subtle Sway Right then Left
          Animated.sequence([
            Animated.parallel([
              Animated.timing(logoRotateAnim, {
                toValue: 13,
                duration: 290,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(boxRotateAnim, {
                toValue: 4,
                duration: 290,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(logoRotateAnim, {
                toValue: -13,
                duration: 340,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: true,
              }),
              Animated.timing(boxRotateAnim, {
                toValue: -4,
                duration: 340,
                easing: Easing.inOut(Easing.cubic),
                useNativeDriver: true,
              }),
            ]),
            Animated.parallel([
              Animated.timing(logoRotateAnim, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
              Animated.timing(boxRotateAnim, {
                toValue: 0,
                duration: 220,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }),
            ]),
            Animated.delay(550),
          ]).start(() => {
            if (!isCancelled) {
              runAnimationCycle(); // Seamless continuous loop
            }
          });
        });
      });
    };

    runAnimationCycle();

    return () => {
      isCancelled = true;
      logoRotateAnim.stopAnimation();
      logoScaleAnim.stopAnimation();
      boxScaleAnim.stopAnimation();
      boxRotateAnim.stopAnimation();
    };
  }, [logoRotateAnim, logoScaleAnim, boxScaleAnim, boxRotateAnim]);

  // Subtle floating micro-drift & soft ambient aura
  useEffect(() => {
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -3,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 3,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    floatLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 0.5,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0.2,
          duration: 1000,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    const timer = setTimeout(() => {
      completeSplash();
    }, durationMs);

    return () => {
      floatLoop.stop();
      glowLoop.stop();
      clearTimeout(timer);
    };
  }, [durationMs, floatAnim, glowPulseAnim, completeSplash]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeOutAnim,
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Touch anywhere to enter app */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={allowSkip ? completeSplash : undefined}
        accessible={true}
        accessibilityLabel="Servex Logo Screen"
      >
        <View style={styles.centerContainer}>
          {/* Delicate Ambient Halo */}
          <Animated.View
            style={[
              styles.ambientGlow,
              {
                opacity: glowPulseAnim,
              },
            ]}
          />

          {/* Precision 92×92dp Luxury Squircle Box */}
          <Animated.View
            style={[
              styles.squareBox,
              {
                transform: [
                  { translateY: floatAnim },
                  { scale: boxScaleAnim },
                  { rotate: boxRotate },
                ],
              },
            ]}
          >
            {/* The SX Monogram inside the Square Box with Rotation & Squash-Stretch */}
            <Animated.View
              style={[
                styles.logoWrap,
                {
                  transform: [
                    { rotate: logoRotate },
                    { scale: logoScaleAnim },
                  ],
                },
              ]}
            >
              <Image
                source={imageSource}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000', // Pitch black OLED canvas
    zIndex: 9999,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: BOX_SIZE * 1.6,
    height: BOX_SIZE * 1.6,
    borderRadius: (BOX_SIZE * 1.6) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
  },
  squareBox: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderRadius: BOX_RADIUS,
    backgroundColor: '#0A0B0E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.9,
    shadowRadius: 18,
    elevation: 12,
    overflow: 'hidden',
  },
  logoWrap: {
    width: '76%',
    height: '76%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
});
