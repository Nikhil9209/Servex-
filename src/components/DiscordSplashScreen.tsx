import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Image,
  ImageSourcePropType,
  Pressable,
} from 'react-native';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '../theme/tokens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Default contractor rotating tool image (artistic purple saw blade + house emblem on solid black)
const DEFAULT_TOOL_IMAGE = require('../../assets/contractor_saw_tool.png');

export interface DiscordSplashScreenProps {
  /**
   * Called when the 5-second intro animation finishes or is skipped.
   */
  onFinish?: () => void;
  /**
   * Optional custom image source if user wants to swap in their own image.
   */
  imageSource?: ImageSourcePropType;
  /**
   * Total duration in milliseconds (defaults to 5000ms as requested).
   */
  durationMs?: number;
  /**
   * Allow user to tap anywhere to skip directly into the app.
   */
  allowSkip?: boolean;
}

// Discord-style dynamic loading phrases with contractor themes
const LOADING_STEPS = [
  'Calibrating blueprint telemetry...',
  'Spinning diamond saw blades & motors...',
  'Aligning 5D architectural coordinates...',
  'Syncing contractor job site metrics...',
  'Ready! Launching Servex Contractor OS...',
];

export default function DiscordSplashScreen({
  onFinish,
  imageSource = DEFAULT_TOOL_IMAGE,
  durationMs = 5000,
  allowSkip = true,
}: DiscordSplashScreenProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Animation values using useMemo per React 19 guidelines
  const spinAnim = useMemo(() => new Animated.Value(0), []);
  const outerRingSpinAnim = useMemo(() => new Animated.Value(0), []);
  const pulseScaleAnim = useMemo(() => new Animated.Value(1), []);
  const glowPulseAnim = useMemo(() => new Animated.Value(0.7), []);
  const progressAnim = useMemo(() => new Animated.Value(0), []);
  const fadeOutAnim = useMemo(() => new Animated.Value(1), []);
  const textFadeAnim = useMemo(() => new Animated.Value(1), []);
  const textTranslateY = useMemo(() => new Animated.Value(0), []);
  const particlesRotation = useMemo(() => new Animated.Value(0), []);

  // Track if finish has already been called
  const hasFinishedRef = useRef(false);

  // Memoized interpolations
  const toolRotate = useMemo(
    () =>
      spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [spinAnim]
  );

  const outerRingRotate = useMemo(
    () =>
      outerRingSpinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
      }),
    [outerRingSpinAnim]
  );

  const particlesRotate = useMemo(
    () =>
      particlesRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
      }),
    [particlesRotation]
  );

  const progressBarWidth = useMemo(
    () =>
      progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      }),
    [progressAnim]
  );

  const completeSplash = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;

    // Smooth exit transition: subtle zoom & fade out
    Animated.parallel([
      Animated.timing(fadeOutAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(pulseScaleAnim, {
        toValue: 1.12,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish?.();
    });
  }, [fadeOutAnim, pulseScaleAnim, onFinish]);

  useEffect(() => {
    // 1. Continuous Saw Blade Rotation (2.2s per 360 revolution)
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    // 2. Counter-rotating energetic blueprint orbit ring (4.2s per revolution)
    const outerRingLoop = Animated.loop(
      Animated.timing(outerRingSpinAnim, {
        toValue: 1,
        duration: 4200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    outerRingLoop.start();

    // 3. Orbital spark particles loop (1.8s)
    const particleLoop = Animated.loop(
      Animated.timing(particlesRotation, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    particleLoop.start();

    // 4. Subtle Discord-style breathing pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseScaleAnim, {
          toValue: 1.04,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseScaleAnim, {
          toValue: 0.98,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 5. Ambient neon glow pulse
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(glowPulseAnim, {
          toValue: 0.5,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    glowLoop.start();

    // 6. Overall 5-second Progress Bar Driver
    const progressListenerId = progressAnim.addListener(({ value }) => {
      setProgressPercent(Math.min(100, Math.floor(value * 100)));
    });

    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        completeSplash();
      }
    });

    // 7. Dynamic status message cycler (every ~1.05s)
    const stepInterval = setInterval(() => {
      // Smooth fade-switch text
      Animated.sequence([
        Animated.timing(textFadeAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(textTranslateY, {
          toValue: 4,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
        Animated.parallel([
          Animated.timing(textFadeAnim, {
            toValue: 1,
            duration: 180,
            useNativeDriver: true,
          }),
          Animated.timing(textTranslateY, {
            toValue: 0,
            duration: 180,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, durationMs / (LOADING_STEPS.length - 0.2));

    return () => {
      spinLoop.stop();
      outerRingLoop.stop();
      particleLoop.stop();
      pulseLoop.stop();
      glowLoop.stop();
      progressAnim.removeListener(progressListenerId);
      clearInterval(stepInterval);
    };
  }, [
    durationMs,
    spinAnim,
    outerRingSpinAnim,
    particlesRotation,
    pulseScaleAnim,
    glowPulseAnim,
    progressAnim,
    textFadeAnim,
    textTranslateY,
    completeSplash,
  ]);

  const toolSize = Math.min(SCREEN_WIDTH * 0.62, 260);

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

      {/* Full screen touch-to-skip wrapper */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={allowSkip ? completeSplash : undefined}
        accessible={true}
        accessibilityLabel="Contractor Launch Intro"
      >
        <View style={styles.contentWrap}>
          {/* Top minimal status indicator */}
          <View style={styles.topStatusContainer}>
            <View style={styles.topBadge}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>SERVEX CORE • INITIALIZING</Text>
            </View>
          </View>

          {/* Central Rotating Stage */}
          <View style={styles.centerStage}>
            {/* Background Neon Aura Glow */}
            <Animated.View
              style={[
                styles.glowAura,
                {
                  width: toolSize * 1.55,
                  height: toolSize * 1.55,
                  borderRadius: (toolSize * 1.55) / 2,
                  opacity: glowPulseAnim,
                },
              ]}
            />

            {/* Blueprint Orbit Ring (SVG) */}
            <Animated.View
              style={[
                styles.outerRingWrap,
                {
                  width: toolSize * 1.36,
                  height: toolSize * 1.36,
                  transform: [{ rotate: outerRingRotate }],
                },
              ]}
            >
              <Svg
                width={toolSize * 1.36}
                height={toolSize * 1.36}
                viewBox="0 0 340 340"
              >
                <Defs>
                  <LinearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <Stop offset="0%" stopColor={colors.neonPurple} stopOpacity="0.8" />
                    <Stop offset="50%" stopColor={colors.neonCyan} stopOpacity="0.6" />
                    <Stop offset="100%" stopColor={colors.neonPurpleBright} stopOpacity="0.1" />
                  </LinearGradient>
                  <LinearGradient id="dashedGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <Stop offset="0%" stopColor={colors.neonCyan} stopOpacity="0.7" />
                    <Stop offset="100%" stopColor={colors.blueprint} stopOpacity="0.2" />
                  </LinearGradient>
                </Defs>

                {/* Concentric subtle guideline rings */}
                <Circle
                  cx="170"
                  cy="170"
                  r="160"
                  stroke="url(#ringGrad)"
                  strokeWidth="1.5"
                  strokeDasharray="10 14"
                  fill="none"
                />
                <Circle
                  cx="170"
                  cy="170"
                  r="145"
                  stroke={colors.neonPurpleGlow}
                  strokeWidth="1"
                  strokeDasharray="4 8"
                  fill="none"
                />
                <Circle
                  cx="170"
                  cy="170"
                  r="130"
                  stroke="url(#dashedGrad)"
                  strokeWidth="2"
                  strokeDasharray="30 20 10 20"
                  fill="none"
                />

                {/* Orbital Node Markers */}
                <Circle cx="170" cy="10" r="3.5" fill={colors.neonCyan} />
                <Circle cx="330" cy="170" r="3.5" fill={colors.neonPurpleBright} />
                <Circle cx="170" cy="330" r="3" fill={colors.blueprint} />
                <Circle cx="10" cy="170" r="3" fill={colors.neonPurple} />
              </Svg>
            </Animated.View>

            {/* Orbiting Spark Particles */}
            <Animated.View
              style={[
                styles.particlesWrap,
                {
                  width: toolSize * 1.25,
                  height: toolSize * 1.25,
                  transform: [{ rotate: particlesRotate }],
                },
              ]}
              pointerEvents="none"
            >
              <View style={[styles.particleDot, styles.p1]} />
              <View style={[styles.particleDot, styles.p2]} />
              <View style={[styles.particleDot, styles.p3]} />
              <View style={[styles.particleDot, styles.p4]} />
            </Animated.View>

            {/* Rotating Saw Blade & Contractor Tool */}
            <Animated.View
              style={[
                styles.toolContainer,
                {
                  width: toolSize,
                  height: toolSize,
                  transform: [
                    { rotate: toolRotate },
                    { scale: pulseScaleAnim },
                  ],
                },
              ]}
            >
              <Image
                source={imageSource}
                style={styles.toolImage}
                resizeMode="contain"
              />
            </Animated.View>
          </View>

          {/* Bottom Discord-style Loading Dock */}
          <View style={styles.bottomDock}>
            {/* Dynamic Loading Message */}
            <Animated.View
              style={[
                styles.statusMessageRow,
                {
                  opacity: textFadeAnim,
                  transform: [{ translateY: textTranslateY }],
                },
              ]}
            >
              <Text style={styles.loadingTipText}>
                {LOADING_STEPS[currentStepIndex]}
              </Text>
            </Animated.View>

            {/* Discord-style Sleek Progress Bar */}
            <View style={styles.progressBarTrack}>
              <Animated.View
                style={[
                  styles.progressBarFill,
                  {
                    width: progressBarWidth,
                  },
                ]}
              />
            </View>

            {/* Percentage & Telemetry Label */}
            <View style={styles.telemetryRow}>
              <Text style={styles.telemetryBrand}>SERVEX OS v1.0</Text>
              <Text style={styles.telemetryPercent}>{progressPercent}%</Text>
            </View>

            {/* Skip hint */}
            {allowSkip && (
              <Text style={styles.skipHintText}>TAP ANYWHERE TO SKIP</Text>
            )}
          </View>
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
    backgroundColor: '#000000', // Pitch black as requested for eye safety
    zIndex: 9999,
  },
  contentWrap: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 56,
    paddingBottom: 40,
    paddingHorizontal: 24,
  },
  topStatusContainer: {
    width: '100%',
    alignItems: 'center',
  },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0C0D11',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1D212A',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.neonCyan,
    marginRight: 8,
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  statusText: {
    color: '#8A92A6',
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    letterSpacing: 1.5,
  },
  centerStage: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    height: SCREEN_HEIGHT * 0.45,
  },
  glowAura: {
    position: 'absolute',
    backgroundColor: 'rgba(157, 78, 221, 0.14)',
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  outerRingWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particlesWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  particleDot: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  p1: {
    top: 4,
    left: '50%',
    backgroundColor: colors.neonCyan,
    shadowColor: colors.neonCyan,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  p2: {
    bottom: 8,
    right: 28,
    backgroundColor: colors.neonPurpleBright,
    shadowColor: colors.neonPurpleBright,
    shadowOpacity: 1,
    shadowRadius: 6,
  },
  p3: {
    top: 40,
    right: 12,
    backgroundColor: '#FFF',
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  p4: {
    bottom: 30,
    left: 16,
    backgroundColor: colors.blueprint,
    width: 4,
    height: 4,
  },
  toolContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.neonPurple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 25,
  },
  toolImage: {
    width: '100%',
    height: '100%',
  },
  bottomDock: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  statusMessageRow: {
    minHeight: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingTipText: {
    color: '#EDEAE3',
    fontFamily: fonts.display,
    fontSize: 13,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  progressBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#161922',
    borderRadius: 2,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#262B38',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.neonCyan,
    borderRadius: 2,
    shadowColor: colors.neonCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  telemetryRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  telemetryBrand: {
    color: '#4B5263',
    fontFamily: fonts.body,
    fontSize: 10,
    letterSpacing: 1,
  },
  telemetryPercent: {
    color: colors.neonPurpleBright,
    fontFamily: fonts.displayBold,
    fontSize: 11,
    letterSpacing: 0.8,
  },
  skipHintText: {
    color: '#3F4452',
    fontFamily: fonts.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.5,
    marginTop: 22,
  },
});
