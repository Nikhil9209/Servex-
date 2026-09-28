import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  Dimensions,
  Easing,
  PanResponder,
  ScrollView,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { StatusBar } from 'expo-status-bar';
import { colors, fonts } from '../theme/tokens';
import BuildingHouseAnimation from '../components/BuildingHouseAnimation';

const { width, height } = Dimensions.get('window');

function GridBackground({ opacity }: { opacity: Animated.Value }) {
  const gap = 44;
  const lines = useMemo(() => {
    const arr = [];
    for (let x = 0; x <= width; x += gap) {
      arr.push(
        <Line
          key={`v${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={height}
          stroke={colors.lineSoft}
          strokeWidth={1}
        />
      );
    }
    for (let y = 0; y <= height; y += gap) {
      arr.push(
        <Line
          key={`h${y}`}
          x1={0}
          y1={y}
          x2={width}
          y2={y}
          stroke={colors.lineSoft}
          strokeWidth={1}
        />
      );
    }
    return arr;
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity }]}>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        {lines}
      </Svg>
    </Animated.View>
  );
}

function Letter({ char, index, base }: { char: string; index: number; base: number }) {
  const opacity = useMemo(() => new Animated.Value(0), []);
  const y = useMemo(() => new Animated.Value(16), []);
  const scale = useMemo(() => new Animated.Value(1.15), []);

  useEffect(() => {
    Animated.sequence([
      Animated.delay(base + index * 60),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [base, index, opacity, y, scale]);

  return (
    <Animated.Text
      style={[
        styles.wordmarkLetter,
        { opacity, transform: [{ translateY: y }, { scale }] },
      ]}
    >
      {char}
    </Animated.Text>
  );
}

export interface WelcomeScreenProps {
  onReplaySplash?: () => void;
}

export default function WelcomeScreen({ onReplaySplash }: WelcomeScreenProps = {}) {
  const [buildKey, setBuildKey] = useState(0);
  const [isBuildDone, setIsBuildDone] = useState(false);
  const [showHeroContent, setShowHeroContent] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(false);

  const gridOpacity = useMemo(() => new Animated.Value(0.4), []);
  const wordmarkWrapY = useMemo(() => new Animated.Value(12), []);
  const taglineOpacity = useMemo(() => new Animated.Value(0), []);
  const taglineY = useMemo(() => new Animated.Value(10), []);
  const subOpacity = useMemo(() => new Animated.Value(0), []);
  const featuresOpacity = useMemo(() => new Animated.Value(0), []);
  const ctaOpacity = useMemo(() => new Animated.Value(0), []);
  const ctaScale = useMemo(() => new Animated.Value(1), []);
  const replayScale = useMemo(() => new Animated.Value(1), []);

  // Interactive 3D Orbit Pan
  const pan = useMemo(() => new Animated.ValueXY(), []);
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) =>
          dragEnabled && (Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            friction: 6,
            tension: 40,
            useNativeDriver: false,
          }).start();
        },
      }),
    [dragEnabled, pan]
  );

  const handleBuildComplete = () => {
    setIsBuildDone(true);
    setDragEnabled(true);
    setShowHeroContent(true);

    // Staggered reveal of hero branding & CTA
    Animated.sequence([
      Animated.timing(wordmarkWrapY, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 380, useNativeDriver: true }),
      ]),
      Animated.timing(subOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(featuresOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      Animated.timing(ctaOpacity, { toValue: 1, duration: 380, useNativeDriver: true }),
    ]).start();
  };

  const handleReplay = () => {
    setIsBuildDone(false);
    setShowHeroContent(false);
    setDragEnabled(false);
    taglineOpacity.setValue(0);
    taglineY.setValue(10);
    subOpacity.setValue(0);
    featuresOpacity.setValue(0);
    ctaOpacity.setValue(0);
    wordmarkWrapY.setValue(12);
    pan.setValue({ x: 0, y: 0 });
    setBuildKey((prev) => prev + 1);
  };

  const dragTransforms = useMemo(() => {
    const clamp = { extrapolate: 'clamp' as const };
    return {
      dragX: pan.x.interpolate({ inputRange: [-140, 140], outputRange: [-12, 12], ...clamp }),
      dragY: pan.y.interpolate({ inputRange: [-140, 140], outputRange: [-10, 10], ...clamp }),
      dragRotate: pan.x.interpolate({ inputRange: [-140, 140], outputRange: ['-3.5deg', '3.5deg'], ...clamp }),
    };
  }, [pan]);

  const onPressCtaIn = () =>
    Animated.spring(ctaScale, { toValue: 0.96, useNativeDriver: true, friction: 6 }).start();
  const onPressCtaOut = () =>
    Animated.spring(ctaScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  const onPressReplayIn = () =>
    Animated.spring(replayScale, { toValue: 0.92, useNativeDriver: true, friction: 6 }).start();
  const onPressReplayOut = () =>
    Animated.spring(replayScale, { toValue: 1, useNativeDriver: true, friction: 5 }).start();

  const word = useMemo(() => 'SERVEX'.split(''), []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <GridBackground opacity={gridOpacity} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BRAND HEADER / STATUS BAR */}
        <View style={styles.topHeader}>
          <View style={styles.topBrandPill}>
            <View style={styles.topBrandDot} />
            <Text style={styles.topBrandText}>SERVEX OS • CONTRACTOR SUITE</Text>
          </View>
          <View style={styles.headerRightActions}>
            {onReplaySplash && (
              <Pressable
                onPress={onReplaySplash}
                hitSlop={8}
                style={styles.introPill}
              >
                <Text style={styles.introIcon}>⚡</Text>
                <Text style={styles.introText}>Intro</Text>
              </Pressable>
            )}
            {isBuildDone && (
              <Pressable
                onPress={handleReplay}
                onPressIn={onPressReplayIn}
                onPressOut={onPressReplayOut}
                hitSlop={8}
              >
                <Animated.View
                  style={[styles.replayPill, { transform: [{ scale: replayScale }] }]}
                >
                  <Text style={styles.replayIcon}>↻</Text>
                  <Text style={styles.replayText}>Build</Text>
                </Animated.View>
              </Pressable>
            )}
          </View>
        </View>

        {/* 5-SECOND ARCHITECTURAL HOUSE ANIMATION STAGE */}
        <View style={styles.centerStage} {...panResponder.panHandlers}>
          <Animated.View
            style={[
              styles.animatedHouseContainer,
              {
                transform: [
                  { translateX: dragTransforms.dragX },
                  { translateY: dragTransforms.dragY },
                  { rotate: dragTransforms.dragRotate },
                ],
              },
            ]}
          >
            <BuildingHouseAnimation
              key={buildKey}
              onComplete={handleBuildComplete}
              autoPlay={true}
            />
          </Animated.View>

          {/* HERO BRANDING & WORDMARK (Reveals upon build completion) */}
          {showHeroContent && (
            <Animated.View
              style={[
                styles.heroDetails,
                { transform: [{ translateY: wordmarkWrapY }] },
              ]}
            >
              {/* Wordmark */}
              <View style={styles.wordmarkRow}>
                {word.map((c, i) => (
                  <Letter key={i} char={c} index={i} base={0} />
                ))}
              </View>

              {/* Tagline */}
              <Animated.Text
                style={[
                  styles.tagline,
                  {
                    opacity: taglineOpacity,
                    transform: [{ translateY: taglineY }],
                  },
                ]}
              >
                BUILD. MANAGE. TRUST.
              </Animated.Text>

              {/* Subtitle */}
              <Animated.Text style={[styles.subtitle, { opacity: subOpacity }]}>
                Next-generation project management, real-time telemetry, and structural execution for modern contractors.
              </Animated.Text>

              {/* Architectural Feature Badges */}
              <Animated.View
                style={[styles.badgesRow, { opacity: featuresOpacity }]}
              >
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>⚡ 5D BIM SYNC</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>📐 99.8% PRECISION</Text>
                </View>
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>🛡️ VERIFIED</Text>
                </View>
              </Animated.View>
            </Animated.View>
          )}
        </View>

        {/* BOTTOM CTA BUTTON */}
        <Animated.View
          style={[
            styles.bottomCtaWrap,
            {
              opacity: ctaOpacity,
              pointerEvents: isBuildDone ? 'auto' : 'none',
            },
          ]}
        >
          <Pressable
            onPressIn={onPressCtaIn}
            onPressOut={onPressCtaOut}
            style={{ width: '100%' }}
          >
            <Animated.View
              style={[styles.cta, { transform: [{ scale: ctaScale }] }]}
            >
              <Text style={styles.ctaText}>Get Started</Text>
              <Text style={styles.ctaArrow}>➔</Text>
            </Animated.View>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 54,
    paddingBottom: 36,
    paddingHorizontal: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topHeader: {
    width: '100%',
    maxWidth: 380,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  topBrandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.lineSoft,
  },
  topBrandDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.good,
    marginRight: 6,
  },
  topBrandText: {
    fontFamily: fonts.bodyMedium,
    color: colors.muted,
    fontSize: 10.5,
    letterSpacing: 1,
  },
  replayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(192, 133, 82, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(192, 133, 82, 0.4)',
  },
  replayIcon: {
    color: colors.brassBright,
    fontSize: 12,
    marginRight: 4,
    fontWeight: 'bold',
  },
  replayText: {
    fontFamily: fonts.displayBold,
    color: colors.brassBright,
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  introPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(157, 78, 221, 0.14)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(157, 78, 221, 0.4)',
    marginRight: 6,
  },
  introIcon: {
    color: colors.neonPurpleBright,
    fontSize: 11,
    marginRight: 4,
  },
  introText: {
    fontFamily: fonts.displayBold,
    color: colors.neonPurpleBright,
    fontSize: 10.5,
    letterSpacing: 0.5,
  },
  centerStage: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  animatedHouseContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  heroDetails: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  wordmarkRow: {
    flexDirection: 'row',
    marginTop: 6,
    marginBottom: 8,
  },
  wordmarkLetter: {
    fontFamily: fonts.displayBold,
    color: colors.ink,
    fontSize: 32,
    letterSpacing: 3,
  },
  tagline: {
    fontFamily: fonts.displayBold,
    color: colors.brassBright,
    fontSize: 13,
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 18,
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  featureBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.line,
  },
  featureBadgeText: {
    fontFamily: fonts.bodyMedium,
    color: colors.blueprint,
    fontSize: 10,
    letterSpacing: 0.6,
  },
  bottomCtaWrap: {
    width: '100%',
    maxWidth: 360,
    marginTop: 12,
  },
  cta: {
    backgroundColor: colors.brass,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brass,
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  ctaText: {
    fontFamily: fonts.displayBold,
    color: '#15171B',
    fontSize: 15.5,
    letterSpacing: 0.5,
    marginRight: 8,
  },
  ctaArrow: {
    color: '#15171B',
    fontSize: 15,
    fontWeight: 'bold',
  },
});