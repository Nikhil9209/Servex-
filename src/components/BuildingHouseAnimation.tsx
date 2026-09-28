import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  Pressable,
} from 'react-native';
import Svg, {
  Rect,
  Line,
  Polyline,
  Polygon,
  Circle,
  Ellipse,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
} from 'react-native-svg';
import { colors, fonts } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface BuildingHouseAnimationProps {
  onComplete?: () => void;
  autoPlay?: boolean;
}

const PHASES = [
  { label: 'PHASE 01 // EXCAVATION & FOUNDATION', desc: 'Slab footings & anchor grid locked' },
  { label: 'PHASE 02 // STEEL FRAMING & WALLS', desc: 'I-beam columns & ground enclosure' },
  { label: 'PHASE 03 // CANTILEVER & UPPER SUITE', desc: 'Mid-floor slab & balcony balustrade' },
  { label: 'PHASE 04 // ROOF TRUSS & SOLAR ARRAY', desc: 'Angled slate roof, chimney & PV cells' },
  { label: 'PHASE 05 // GLAZING & INTERIOR LIGHTS', desc: 'Thermal glazing, sconces & handover' },
  { label: 'STRUCTURE READY // SERVEX CONTRACTOR', desc: 'Architectural build verified • 100%' },
];

export default function BuildingHouseAnimation({
  onComplete,
  autoPlay = true,
}: BuildingHouseAnimationProps) {
  const [percent, setPercent] = useState(0);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Master timeline driver: 0 -> 1 over 5000ms
  const masterTimeline = useMemo(() => new Animated.Value(0), []);

  // Discrete animated layers for high-impact physics springs and ease transitions
  const foundationAnim = useMemo(() => new Animated.Value(0), []);
  const framingAnim = useMemo(() => new Animated.Value(0), []);
  const groundWallsAnim = useMemo(() => new Animated.Value(0), []);
  const doorAnim = useMemo(() => new Animated.Value(0), []);
  const interFloorAnim = useMemo(() => new Animated.Value(0), []);
  const upperWallsAnim = useMemo(() => new Animated.Value(0), []);
  const roofAnim = useMemo(() => new Animated.Value(0), []);
  const solarChimneyAnim = useMemo(() => new Animated.Value(0), []);
  const windowsAnim = useMemo(() => new Animated.Value(0), []);
  const landscapeAnim = useMemo(() => new Animated.Value(0), []);
  const lightsOnAnim = useMemo(() => new Animated.Value(0), []);
  const blueprintGuidesAnim = useMemo(() => new Animated.Value(1), []);
  const completionPulseAnim = useMemo(() => new Animated.Value(0), []);
  const hudOpacity = useMemo(() => new Animated.Value(1), []);

  // Laser scanner loop
  const scanLineY = useMemo(() => new Animated.Value(0), []);

  // Idle float once built
  const idleFloat = useMemo(() => new Animated.Value(0), []);

  const runAnimation = useCallback(() => {
    // Reset all values
    masterTimeline.setValue(0);
    foundationAnim.setValue(0);
    framingAnim.setValue(0);
    groundWallsAnim.setValue(0);
    doorAnim.setValue(0);
    interFloorAnim.setValue(0);
    upperWallsAnim.setValue(0);
    roofAnim.setValue(0);
    solarChimneyAnim.setValue(0);
    windowsAnim.setValue(0);
    landscapeAnim.setValue(0);
    lightsOnAnim.setValue(0);
    blueprintGuidesAnim.setValue(1);
    completionPulseAnim.setValue(0);
    hudOpacity.setValue(1);
    idleFloat.setValue(0);

    // Laser scan animation
    const laserLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    laserLoop.start();

    // Attach listener for percentage and phase HUD updates
    const listenerId = masterTimeline.addListener(({ value }) => {
      const p = Math.min(100, Math.round(value * 100));
      setPercent(p);

      if (p < 20) setActivePhaseIndex(0);
      else if (p < 40) setActivePhaseIndex(1);
      else if (p < 60) setActivePhaseIndex(2);
      else if (p < 80) setActivePhaseIndex(3);
      else if (p < 98) setActivePhaseIndex(4);
      else setActivePhaseIndex(5);
    });

    // 5-SECOND (5000ms) MASTER TIMELINE & COORDINATED SEQUENCES
    const animSequence = Animated.parallel([
      // 1. Continuous master driver (5000ms total)
      Animated.timing(masterTimeline, {
        toValue: 1,
        duration: 5000,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        useNativeDriver: false,
      }),

      // 2. Foundation & Groundwork: 0ms -> 750ms
      Animated.sequence([
        Animated.delay(50),
        Animated.spring(foundationAnim, {
          toValue: 1,
          friction: 6.5,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),

      // 3. Steel I-Beam Framing: 700ms -> 1500ms
      Animated.sequence([
        Animated.delay(700),
        Animated.spring(framingAnim, {
          toValue: 1,
          friction: 7,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),

      // 4. Ground Floor Walls & Entry: 1100ms -> 1900ms
      Animated.sequence([
        Animated.delay(1100),
        Animated.parallel([
          Animated.spring(groundWallsAnim, {
            toValue: 1,
            friction: 7.5,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(doorAnim, {
            toValue: 1,
            duration: 650,
            easing: Easing.out(Easing.back(1.4)),
            useNativeDriver: true,
          }),
        ]),
      ]),

      // 5. Inter-floor Cantilever Slab: 1750ms -> 2450ms
      Animated.sequence([
        Animated.delay(1750),
        Animated.spring(interFloorAnim, {
          toValue: 1,
          friction: 7,
          tension: 48,
          useNativeDriver: true,
        }),
      ]),

      // 6. Upper Story Volume & Balcony: 2200ms -> 2950ms
      Animated.sequence([
        Animated.delay(2200),
        Animated.spring(upperWallsAnim, {
          toValue: 1,
          friction: 7,
          tension: 42,
          useNativeDriver: true,
        }),
      ]),

      // 7. Roof Truss & Slate Panels: 2750ms -> 3600ms
      Animated.sequence([
        Animated.delay(2750),
        Animated.spring(roofAnim, {
          toValue: 1,
          friction: 6.8,
          tension: 38,
          useNativeDriver: true,
        }),
      ]),

      // 8. Solar Panels & Chimney: 3250ms -> 3900ms
      Animated.sequence([
        Animated.delay(3250),
        Animated.spring(solarChimneyAnim, {
          toValue: 1,
          friction: 6,
          tension: 50,
          useNativeDriver: true,
        }),
      ]),

      // 9. Windows & Architectural Glazing: 3500ms -> 4150ms
      Animated.sequence([
        Animated.delay(3500),
        Animated.spring(windowsAnim, {
          toValue: 1,
          friction: 7.5,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),

      // 10. Landscaping (Trees & Planters): 3800ms -> 4450ms
      Animated.sequence([
        Animated.delay(3800),
        Animated.spring(landscapeAnim, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
      ]),

      // 11. Warm Lighting & Porch Sconce ignition: 4150ms -> 4650ms
      Animated.sequence([
        Animated.delay(4150),
        Animated.timing(lightsOnAnim, {
          toValue: 1,
          duration: 550,
          easing: Easing.bezier(0.2, 0.8, 0.3, 1),
          useNativeDriver: true,
        }),
      ]),

      // 12. Dissolve Blueprint guides into finished architecture: 4350ms -> 4800ms
      Animated.sequence([
        Animated.delay(4350),
        Animated.timing(blueprintGuidesAnim, {
          toValue: 0,
          duration: 450,
          useNativeDriver: true,
        }),
      ]),

      // 13. Completion Shockwave & Badge Pulse: 4700ms -> 5000ms
      Animated.sequence([
        Animated.delay(4700),
        Animated.timing(completionPulseAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
    ]);

    animSequence.start(() => {
      masterTimeline.removeListener(listenerId);
      laserLoop.stop();
      setIsCompleted(true);
      setActivePhaseIndex(5);
      setPercent(100);

      // Start gentle idle float on the completed house
      Animated.loop(
        Animated.sequence([
          Animated.timing(idleFloat, {
            toValue: -6,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(idleFloat, {
            toValue: 0,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Fade out the construction HUD slightly after completion
      Animated.timing(hudOpacity, {
        toValue: 0,
        duration: 400,
        delay: 200,
        useNativeDriver: true,
      }).start(() => {
        if (onComplete) {
          onComplete();
        }
      });
    });

    return () => {
      masterTimeline.removeListener(listenerId);
      laserLoop.stop();
      animSequence.stop();
    };
  }, [
    masterTimeline,
    foundationAnim,
    framingAnim,
    groundWallsAnim,
    doorAnim,
    interFloorAnim,
    upperWallsAnim,
    roofAnim,
    solarChimneyAnim,
    windowsAnim,
    landscapeAnim,
    lightsOnAnim,
    blueprintGuidesAnim,
    completionPulseAnim,
    hudOpacity,
    idleFloat,
    scanLineY,
    onComplete,
  ]);

  const skipAnimation = useCallback(() => {
    masterTimeline.setValue(1);
    foundationAnim.setValue(1);
    framingAnim.setValue(1);
    groundWallsAnim.setValue(1);
    doorAnim.setValue(1);
    interFloorAnim.setValue(1);
    upperWallsAnim.setValue(1);
    roofAnim.setValue(1);
    solarChimneyAnim.setValue(1);
    windowsAnim.setValue(1);
    landscapeAnim.setValue(1);
    lightsOnAnim.setValue(1);
    blueprintGuidesAnim.setValue(0);
    completionPulseAnim.setValue(1);
    hudOpacity.setValue(0);
    setIsCompleted(true);
    setPercent(100);
    setActivePhaseIndex(5);

    // Idle float
    Animated.loop(
      Animated.sequence([
        Animated.timing(idleFloat, {
          toValue: -6,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(idleFloat, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    if (onComplete) onComplete();
  }, [
    masterTimeline,
    foundationAnim,
    framingAnim,
    groundWallsAnim,
    doorAnim,
    interFloorAnim,
    upperWallsAnim,
    roofAnim,
    solarChimneyAnim,
    windowsAnim,
    landscapeAnim,
    lightsOnAnim,
    blueprintGuidesAnim,
    completionPulseAnim,
    hudOpacity,
    idleFloat,
    onComplete,
  ]);

  useEffect(() => {
    if (autoPlay) {
      const cleanup = runAnimation();
      return cleanup;
    }
  }, [autoPlay, runAnimation]);

  // Interpolated transforms for each building block:
  const foundationY = foundationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0],
  });
  const foundationScaleX = foundationAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.3, 1.05, 1],
  });

  const framingY = framingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });
  const framingScaleY = framingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const groundWallsY = groundWallsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-45, 0],
  });

  const doorScale = doorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const interFloorScaleX = interFloorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 1],
  });
  const interFloorY = interFloorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const upperWallsY = upperWallsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-55, 0],
  });

  const roofY = roofAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-75, 0],
  });
  const roofScale = roofAnim.interpolate({
    inputRange: [0, 0.8, 1],
    outputRange: [0.75, 1.04, 1],
  });

  const solarChimneyScale = solarChimneyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const windowsScale = windowsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const landscapeScale = landscapeAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0, 1.15, 1],
  });

  const laserY = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 240],
  });

  const pulseScale = completionPulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1.4],
  });
  const pulseOpacity = completionPulseAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.9, 0],
  });

  const currentPhase = PHASES[activePhaseIndex] || PHASES[0];

  return (
    <View style={styles.wrapper}>
      {/* 5-SECOND CONSTRUCTION TELEMETRY HUD */}
      <Animated.View style={[styles.hudContainer, { opacity: hudOpacity }]}>
        {/* Phase Header & Coordinates */}
        <View style={styles.hudTopRow}>
          <View style={styles.hudBadge}>
            <View style={styles.hudBadgeDot} />
            <Text style={styles.hudBadgeText}>BUILD SEQUENCE</Text>
          </View>
          <Text style={styles.hudCoords}>{"GRID // 37°46'N • EL +12.4m"}</Text>
          <Pressable onPress={skipAnimation} hitSlop={12} style={styles.skipButton}>
            <Text style={styles.skipText}>SKIP ➔</Text>
          </Pressable>
        </View>

        {/* Dynamic Phase Title & Percentage */}
        <View style={styles.phaseInfoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.phaseTitle}>{currentPhase.label}</Text>
            <Text style={styles.phaseDesc}>{currentPhase.desc}</Text>
          </View>
          <View style={styles.percentBlock}>
            <Text style={styles.percentNumber}>{percent}</Text>
            <Text style={styles.percentSymbol}>%</Text>
          </View>
        </View>

        {/* Segmented Phase Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                {
                  width: masterTimeline.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
          </View>
          {/* Step markers */}
          <View style={styles.stepMarkersRow}>
            {[0, 1, 2, 3, 4].map((step) => {
              const isStepDone = percent >= (step + 1) * 20;
              const isStepCurrent = activePhaseIndex === step;
              return (
                <View
                  key={step}
                  style={[
                    styles.stepDot,
                    isStepDone && styles.stepDotDone,
                    isStepCurrent && styles.stepDotActive,
                  ]}
                />
              );
            })}
          </View>
        </View>
      </Animated.View>

      {/* SVG HOUSE CONSTRUCTION STAGE */}
      <Animated.View
        style={[
          styles.houseStage,
          {
            transform: [{ translateY: idleFloat }],
          },
        ]}
      >
        <Svg width={340} height={270} viewBox="0 0 340 270">
          <Defs>
            {/* Warm Interior Window Glow */}
            <LinearGradient id="warmWindowGlow" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#FFF2B2" stopOpacity="0.95" />
              <Stop offset="0.6" stopColor={colors.warmLight} stopOpacity="0.85" />
              <Stop offset="1" stopColor={colors.brassBright} stopOpacity="0.75" />
            </LinearGradient>

            {/* Porch Sconce Light Flare */}
            <RadialGradient id="porchLightBeam" cx="50%" cy="0%" r="90%">
              <Stop offset="0" stopColor={colors.warmLight} stopOpacity="0.75" />
              <Stop offset="0.5" stopColor={colors.brassBright} stopOpacity="0.35" />
              <Stop offset="1" stopColor={colors.warmLight} stopOpacity="0" />
            </RadialGradient>

            {/* Solar Panel Sheen */}
            <LinearGradient id="solarSheen" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor="#3B82F6" stopOpacity="0.9" />
              <Stop offset="0.5" stopColor={colors.solarCell} stopOpacity="0.95" />
              <Stop offset="1" stopColor="#0B1D3A" stopOpacity="1" />
            </LinearGradient>

            {/* Slate Roof Gradient */}
            <LinearGradient id="roofSlate" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="#323842" />
              <Stop offset="1" stopColor="#1E222A" />
            </LinearGradient>
          </Defs>

          {/* BASE SHADOW & GROUND BLUEPRINT AXIS */}
          <Ellipse cx="170" cy="232" rx="140" ry="14" fill="#0E1013" opacity={0.6} />
          <Line x1="15" y1="222" x2="325" y2="222" stroke={colors.blueprintDim} strokeWidth={1} strokeDasharray="4,4" opacity={0.5} />
          <Line x1="170" y1="18" x2="170" y2="242" stroke={colors.lineSoft} strokeWidth={0.8} strokeDasharray="3,3" opacity={0.3} />
        </Svg>

        {/* BLUEPRINT MEASUREMENT CALLOUTS */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            { opacity: blueprintGuidesAnim },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Top width dimension */}
            <Line x1="45" y1="20" x2="295" y2="20" stroke={colors.blueprintDim} strokeWidth={1} />
            <Line x1="45" y1="16" x2="45" y2="24" stroke={colors.blueprint} strokeWidth={1.5} />
            <Line x1="295" y1="16" x2="295" y2="24" stroke={colors.blueprint} strokeWidth={1.5} />
            {/* Corner targets */}
            <Circle cx="45" cy="222" r="3" fill="none" stroke={colors.blueprint} strokeWidth={1.2} />
            <Circle cx="295" cy="222" r="3" fill="none" stroke={colors.blueprint} strokeWidth={1.2} />
            <Circle cx="125" cy="22" r="3" fill="none" stroke={colors.brass} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        {/* LAYER 1: FOUNDATION & FOOTINGS */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: foundationAnim,
              transform: [
                { translateY: foundationY },
                { scaleX: foundationScaleX },
              ],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Foundation Pilings */}
            <Rect x="65" y="222" width="18" height="12" rx="1" fill="#1C1F26" stroke={colors.blueprintDim} strokeWidth={1} />
            <Rect x="161" y="222" width="18" height="12" rx="1" fill="#1C1F26" stroke={colors.blueprintDim} strokeWidth={1} />
            <Rect x="257" y="222" width="18" height="12" rx="1" fill="#1C1F26" stroke={colors.blueprintDim} strokeWidth={1} />

            {/* Heavy Reinforced Concrete Base Slab */}
            <Rect x="42" y="210" width="256" height="13" rx="2" fill="#222730" stroke={colors.blueprint} strokeWidth={1.6} />
            {/* Concrete segmentation lines */}
            <Line x1="105" y1="210" x2="105" y2="223" stroke={colors.line} strokeWidth={1} />
            <Line x1="170" y1="210" x2="170" y2="223" stroke={colors.line} strokeWidth={1} />
            <Line x1="235" y1="210" x2="235" y2="223" stroke={colors.line} strokeWidth={1} />

            {/* Cascading Floating Entry Steps */}
            <Rect x="134" y="218" width="68" height="4.5" rx="1.2" fill={colors.brass} opacity={0.95} />
            <Rect x="138" y="214" width="60" height="4.5" rx="1.2" fill={colors.brassBright} opacity={0.8} />
            <Rect x="142" y="210" width="52" height="4.5" rx="1.2" fill={colors.ink} opacity={0.7} />
          </Svg>
        </Animated.View>

        {/* LAYER 2: STEEL FRAMING & I-BEAMS */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: framingAnim,
              transform: [
                { translateY: framingY },
                { scaleY: framingScaleY },
              ],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Ground Steel Columns */}
            <Rect x="54" y="132" width="8" height="78" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />
            <Rect x="124" y="132" width="8" height="78" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />
            <Rect x="198" y="132" width="8" height="78" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />
            <Rect x="278" y="152" width="8" height="58" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />

            {/* Upper Steel Columns */}
            <Rect x="54" y="60" width="8" height="72" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />
            <Rect x="124" y="60" width="8" height="72" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />
            <Rect x="198" y="60" width="8" height="72" fill={colors.steel} stroke={colors.blueprint} strokeWidth={1} />

            {/* Steel Tie Girders */}
            <Line x1="54" y1="132" x2="206" y2="132" stroke={colors.blueprint} strokeWidth={2} />
            <Line x1="198" y1="152" x2="286" y2="152" stroke={colors.blueprint} strokeWidth={2} />
          </Svg>
        </Animated.View>

        {/* LAYER 3: GROUND FLOOR WALLS & ENTRANCE PORTAL */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: groundWallsAnim,
              transform: [{ translateY: groundWallsY }],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Left Living Wall Panel */}
            <Rect x="62" y="134" width="62" height="76" fill={colors.wallDark} stroke={colors.line} strokeWidth={1} />
            {/* Wall texture horizontal slats */}
            <Line x1="62" y1="152" x2="124" y2="152" stroke={colors.lineSoft} strokeWidth={1} />
            <Line x1="62" y1="172" x2="124" y2="172" stroke={colors.lineSoft} strokeWidth={1} />
            <Line x1="62" y1="192" x2="124" y2="192" stroke={colors.lineSoft} strokeWidth={1} />

            {/* Central Entrance Recess */}
            <Rect x="132" y="134" width="66" height="76" fill="#171A20" stroke={colors.line} strokeWidth={1} />

            {/* Right Garage / Utility Annex */}
            <Rect x="206" y="153" width="72" height="57" fill={colors.surface2} stroke={colors.line} strokeWidth={1} />
            {/* Garage door slats */}
            <Line x1="210" y1="165" x2="274" y2="165" stroke={colors.lineSoft} strokeWidth={1.2} />
            <Line x1="210" y1="177" x2="274" y2="177" stroke={colors.lineSoft} strokeWidth={1.2} />
            <Line x1="210" y1="189" x2="274" y2="189" stroke={colors.lineSoft} strokeWidth={1.2} />
            <Line x1="210" y1="201" x2="274" y2="201" stroke={colors.lineSoft} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        {/* LAYER 4: FRONT PIVOT DOOR & HARDWARE */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: doorAnim,
              transform: [{ scale: doorScale }],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Transom Glass above door */}
            <Rect x="144" y="138" width="42" height="10" rx="1" fill={colors.glassTint} stroke={colors.blueprintDim} strokeWidth={1} />

            {/* Luxury Architectural Pivot Door */}
            <Rect x="144" y="150" width="42" height="60" rx="1.5" fill="#252831" stroke={colors.brass} strokeWidth={1.5} />
            {/* Door grain lines */}
            <Line x1="148" y1="150" x2="148" y2="210" stroke="#1D2027" strokeWidth={1} />
            <Line x1="182" y1="150" x2="182" y2="210" stroke="#1D2027" strokeWidth={1} />

            {/* Vertical Brass Pull Handle */}
            <Line x1="180" y1="168" x2="180" y2="196" stroke={colors.brassBright} strokeWidth={2.5} strokeLinecap="round" />

            {/* Smart Access Scanner Indicator */}
            <Circle cx="150" cy="178" r="2.2" fill={colors.good} />
          </Svg>
        </Animated.View>

        {/* LAYER 5: INTER-FLOOR CANTILEVER DECK & BALUSTRADE */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: interFloorAnim,
              transform: [
                { translateY: interFloorY },
                { scaleX: interFloorScaleX },
              ],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Cantilever Floor Deck */}
            <Rect x="46" y="125" width="166" height="8" rx="1.5" fill={colors.surface} stroke={colors.brass} strokeWidth={1.2} />

            {/* Balcony Glass Balustrade (Left side) */}
            <Rect x="54" y="103" width="66" height="22" rx="1" fill={colors.glassTint} stroke={colors.blueprintDim} strokeWidth={1} />
            {/* Steel handrail */}
            <Line x1="52" y1="103" x2="122" y2="103" stroke={colors.ink} strokeWidth={1.6} />
            <Line x1="54" y1="103" x2="54" y2="125" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="87" y1="103" x2="87" y2="125" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="120" y1="103" x2="120" y2="125" stroke={colors.steel} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        {/* LAYER 6: UPPER STORY MASTER SUITE */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: upperWallsAnim,
              transform: [{ translateY: upperWallsY }],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Balcony Back Wall */}
            <Rect x="58" y="68" width="60" height="57" fill={colors.wallDark} stroke={colors.line} strokeWidth={1} />

            {/* Master Suite Cantilever Volume (Right side) */}
            <Rect x="124" y="60" width="84" height="65" fill={colors.wallDark} stroke={colors.line} strokeWidth={1.2} />

            {/* Vertical Wood/Composite Siding Ribs */}
            <Line x1="184" y1="60" x2="184" y2="125" stroke={colors.brass} strokeWidth={1} opacity={0.6} />
            <Line x1="192" y1="60" x2="192" y2="125" stroke={colors.brass} strokeWidth={1} opacity={0.6} />
            <Line x1="200" y1="60" x2="200" y2="125" stroke={colors.brass} strokeWidth={1} opacity={0.6} />
          </Svg>
        </Animated.View>

        {/* LAYER 7: ARCHITECTURAL WINDOW FRAMES */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: windowsAnim,
              transform: [{ scale: windowsScale }],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* 1. Ground Floor Studio Window Frame */}
            <Rect x="68" y="146" width="50" height="56" rx="2" fill={colors.surface} stroke={colors.blueprintDim} strokeWidth={1.2} />
            <Line x1="85" y1="146" x2="85" y2="202" stroke={colors.steel} strokeWidth={1.4} />
            <Line x1="102" y1="146" x2="102" y2="202" stroke={colors.steel} strokeWidth={1.4} />
            <Line x1="68" y1="174" x2="118" y2="174" stroke={colors.steel} strokeWidth={1.4} />

            {/* 2. Upper Balcony Sliding Glass Door Frame */}
            <Rect x="64" y="74" width="48" height="51" rx="1" fill={colors.surface} stroke={colors.blueprintDim} strokeWidth={1} />
            <Line x1="88" y1="74" x2="88" y2="125" stroke={colors.steel} strokeWidth={1.4} />

            {/* 3. Upper Corner Master Panoramic Window Frame */}
            <Rect x="130" y="68" width="50" height="48" rx="2" fill={colors.surface} stroke={colors.blueprint} strokeWidth={1.4} />
            <Line x1="155" y1="68" x2="155" y2="116" stroke={colors.steel} strokeWidth={1.4} />
            <Line x1="130" y1="92" x2="180" y2="92" stroke={colors.steel} strokeWidth={1.4} />
          </Svg>
        </Animated.View>

        {/* LAYER 7B: WARM INTERIOR WINDOW GLOW (Turns ON smoothly) */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: lightsOnAnim,
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Ground Window Glow */}
            <Rect x="70" y="148" width="46" height="52" rx="1" fill="url(#warmWindowGlow)" />
            {/* Balcony Door Glow */}
            <Rect x="66" y="76" width="44" height="47" rx="1" fill="url(#warmWindowGlow)" />
            {/* Master Corner Window Glow */}
            <Rect x="132" y="70" width="46" height="44" rx="1" fill="url(#warmWindowGlow)" />

            {/* Re-overlay mullions over glow */}
            <Line x1="85" y1="148" x2="85" y2="200" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="102" y1="148" x2="102" y2="200" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="70" y1="174" x2="116" y2="174" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="88" y1="76" x2="88" y2="123" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="155" y1="70" x2="155" y2="114" stroke={colors.steel} strokeWidth={1.2} />
            <Line x1="132" y1="92" x2="178" y2="92" stroke={colors.steel} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        {/* LAYER 8: ROOF TRUSS & SLATE PANELS */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: roofAnim,
              transform: [
                { translateY: roofY },
                { scale: roofScale },
              ],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Main Asymmetric Pitch Roof Gable Truss */}
            <Polygon points="38,62 125,20 220,62" fill="url(#roofSlate)" stroke={colors.brass} strokeWidth={1.5} />

            {/* Extended Architectural Roof Eaves */}
            <Polyline points="32,64 125,18 226,64" fill="none" stroke={colors.brassBright} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1="125" y1="18" x2="125" y2="60" stroke={colors.blueprintDim} strokeWidth={1} strokeDasharray="3,3" />

            {/* Annex Flat Roof Slab (Right volume) */}
            <Rect x="198" y="147" width="88" height="6" rx="1.2" fill={colors.surface} stroke={colors.blueprint} strokeWidth={1.2} />
          </Svg>
        </Animated.View>

        {/* LAYER 9: SOLAR ARRAY & CHIMNEY */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: solarChimneyAnim,
              transform: [{ scale: solarChimneyScale }],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Minimalist Modern Chimney / Ventilation Flue */}
            <Rect x="176" y="14" width="14" height="30" rx="1" fill={colors.steel} stroke={colors.line} strokeWidth={1} />
            <Line x1="172" y1="14" x2="194" y2="14" stroke={colors.ink} strokeWidth={2} />

            {/* 3 Rooftop Angled Solar Panels on Annex */}
            <Polygon points="206,145 224,133 229,133 211,145" fill="url(#solarSheen)" stroke={colors.blueprint} strokeWidth={1} />
            <Polygon points="231,145 249,133 254,133 236,145" fill="url(#solarSheen)" stroke={colors.blueprint} strokeWidth={1} />
            <Polygon points="256,145 274,133 279,133 261,145" fill="url(#solarSheen)" stroke={colors.blueprint} strokeWidth={1} />
          </Svg>
        </Animated.View>

        {/* LAYER 10: LANDSCAPING (Trees, Planters & Path) */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: landscapeAnim,
              transform: [{ scale: landscapeScale }],
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Left Architectural Planter Pot */}
            <Polygon points="22,202 38,202 35,218 25,218" fill={colors.brass} stroke={colors.line} strokeWidth={1} />

            {/* Geometric Modern Pine / Cypress Tree (3-Tiered) */}
            <Polygon points="30,158 18,178 42,178" fill={colors.good} opacity={0.9} />
            <Polygon points="30,172 14,192 46,192" fill={colors.good} opacity={0.8} />
            <Polygon points="30,186 10,204 50,204" fill={colors.good} opacity={0.7} />

            {/* Right Ornamental Planter */}
            <Rect x="288" y="206" width="26" height="12" rx="1.5" fill={colors.surface2} stroke={colors.line} strokeWidth={1} />
            {/* Grass Spikes */}
            <Polyline points="292,206 295,194 298,206" fill="none" stroke={colors.good} strokeWidth={1.4} strokeLinecap="round" />
            <Polyline points="299,206 302,190 305,206" fill="none" stroke={colors.good} strokeWidth={1.4} strokeLinecap="round" />
            <Polyline points="306,206 309,195 312,206" fill="none" stroke={colors.good} strokeWidth={1.4} strokeLinecap="round" />
          </Svg>
        </Animated.View>

        {/* LAYER 11: EXTERIOR PORCH SCONCE & LIGHT CONE */}
        <Animated.View
          style={[
            styles.absoluteLayer,
            {
              opacity: lightsOnAnim,
            },
          ]}
        >
          <Svg width={340} height={270} viewBox="0 0 340 270">
            {/* Sconce fixture */}
            <Circle cx="138" cy="154" r="2.6" fill={colors.brassBright} />
            <Circle cx="138" cy="154" r="1.2" fill="#FFF" />

            {/* Soft Downward Warm Light Cone */}
            <Polygon points="138,154 116,220 196,220" fill="url(#porchLightBeam)" />
          </Svg>
        </Animated.View>

        {/* BLUEPRINT SCANNING LASER BEAM (During Construction) */}
        {!isCompleted && (
          <Animated.View
            style={[
              styles.laserScannerContainer,
              {
                opacity: blueprintGuidesAnim,
                transform: [{ translateY: laserY }],
              },
            ]}
          >
            <View style={styles.laserBeamLine} />
            <View style={styles.laserBeamGlow} />
          </Animated.View>
        )}

        {/* COMPLETION SHOCKWAVE PULSE */}
        <Animated.View
          style={[
            styles.pulseRing,
            {
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  hudContainer: {
    width: Math.min(SCREEN_WIDTH - 40, 360),
    backgroundColor: 'rgba(28, 31, 36, 0.85)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  hudTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(92, 184, 196, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 0.8,
    borderColor: 'rgba(92, 184, 196, 0.4)',
  },
  hudBadgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.blueprint,
    marginRight: 5,
  },
  hudBadgeText: {
    fontFamily: fonts.displayBold,
    color: colors.blueprint,
    fontSize: 9.5,
    letterSpacing: 1,
  },
  hudCoords: {
    fontFamily: fonts.body,
    color: colors.mutedDim,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  skipButton: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipText: {
    fontFamily: fonts.displayBold,
    color: colors.brassBright,
    fontSize: 10,
    letterSpacing: 0.8,
  },
  phaseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phaseTitle: {
    fontFamily: fonts.displayBold,
    color: colors.ink,
    fontSize: 12.5,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  phaseDesc: {
    fontFamily: fonts.body,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 14,
  },
  percentBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginLeft: 10,
  },
  percentNumber: {
    fontFamily: fonts.displayBold,
    color: colors.brassBright,
    fontSize: 26,
    lineHeight: 28,
  },
  percentSymbol: {
    fontFamily: fonts.display,
    color: colors.brass,
    fontSize: 12,
    marginTop: 2,
    marginLeft: 2,
  },
  progressBarContainer: {
    marginTop: 2,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.surface2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.blueprint,
    borderRadius: 2,
  },
  stepMarkersRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.line,
  },
  stepDotDone: {
    backgroundColor: colors.blueprint,
  },
  stepDotActive: {
    backgroundColor: colors.brassBright,
    transform: [{ scale: 1.3 }],
  },
  houseStage: {
    width: 340,
    height: 270,
    alignItems: 'center',
    justifyContent: 'center',
  },
  absoluteLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 340,
    height: 270,
  },
  laserScannerContainer: {
    position: 'absolute',
    left: 30,
    right: 30,
    height: 2,
    zIndex: 20,
  },
  laserBeamLine: {
    width: '100%',
    height: 1.5,
    backgroundColor: colors.blueprint,
    shadowColor: colors.blueprint,
    shadowOpacity: 0.9,
    shadowRadius: 6,
  },
  laserBeamGlow: {
    position: 'absolute',
    top: -3,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: 'rgba(92, 184, 196, 0.15)',
  },
  pulseRing: {
    position: 'absolute',
    width: 280,
    height: 220,
    borderRadius: 140,
    borderWidth: 2,
    borderColor: colors.brassBright,
    zIndex: 25,
  },
});
