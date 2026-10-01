import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Animated,
  Easing,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Svg, {
  Path,
  Defs,
  LinearGradient,
  Stop,
  G,
} from 'react-native-svg';

export interface Servex3DLogoProps {
  /**
   * Reference height in dp (width will scale according to aspect ratio ~1.42:1)
   */
  size?: number;
  /**
   * Whether to run the subtle luxury 3D ambient tilt and floating loop
   */
  enable3DTilt?: boolean;
  /**
   * External 3D rotation Y interpolation if driven by parent choreography
   */
  rotateYAnim?: Animated.AnimatedInterpolation<string | number>;
  /**
   * External 3D rotation X interpolation if driven by parent choreography
   */
  rotateXAnim?: Animated.AnimatedInterpolation<string | number>;
  /**
   * External scale interpolation if driven by parent choreography
   */
  scaleAnim?: Animated.AnimatedInterpolation<string | number>;
  /**
   * External opacity value
   */
  opacityAnim?: Animated.AnimatedInterpolation<string | number>;
  /**
   * Optional custom container style
   */
  style?: StyleProp<ViewStyle>;
}

export const Servex3DLogo: React.FC<Servex3DLogoProps> = ({
  size = 72,
  enable3DTilt = true,
  rotateYAnim,
  rotateXAnim,
  scaleAnim,
  opacityAnim,
  style,
}) => {
  // Proportions: SX monogram viewBox is 200×140 (aspect ratio 1.428)
  const height = size;
  const width = Math.round(size * 1.428);

  // Internal continuous 3D micro-tilt animations (subtle, executive, realistic depth)
  const [internalTiltY] = useState(() => new Animated.Value(0));
  const [internalTiltX] = useState(() => new Animated.Value(0));
  const [internalFloat] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (!enable3DTilt) return;

    // Continuous smooth 3D pendulum oscillation
    const tiltAnimation = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(internalTiltY, {
            toValue: 7, // 7 degrees right tilt
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(internalTiltX, {
            toValue: -4, // -4 degrees tilt up
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(internalFloat, {
            toValue: -4,
            duration: 2200,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(internalTiltY, {
            toValue: -7, // -7 degrees left tilt
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(internalTiltX, {
            toValue: 4, // 4 degrees tilt down
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(internalFloat, {
            toValue: 4,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    tiltAnimation.start();

    return () => {
      tiltAnimation.stop();
    };
  }, [enable3DTilt, internalTiltY, internalTiltX, internalFloat]);

  // Derived 3D rotations
  const finalRotateY = useMemo(() => {
    if (rotateYAnim) return rotateYAnim;
    return internalTiltY.interpolate({
      inputRange: [-180, 180],
      outputRange: ['-180deg', '180deg'],
    });
  }, [rotateYAnim, internalTiltY]);

  const finalRotateX = useMemo(() => {
    if (rotateXAnim) return rotateXAnim;
    return internalTiltX.interpolate({
      inputRange: [-180, 180],
      outputRange: ['-180deg', '180deg'],
    });
  }, [rotateXAnim, internalTiltX]);

  const finalTranslateY = useMemo(() => {
    return internalFloat;
  }, [internalFloat]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width,
          height,
          opacity: opacityAnim,
          transform: [
            { perspective: 900 },
            { rotateY: finalRotateY as any },
            { rotateX: finalRotateX as any },
            { translateY: finalTranslateY },
            ...(scaleAnim ? [{ scale: scaleAnim as any }] : []),
          ],
        },
        style,
      ]}
      pointerEvents="none"
    >
      <Svg
        width={width}
        height={height}
        viewBox="0 0 200 140"
        style={styles.svg}
      >
        <Defs>
          {/* 1. Primary White Specular Platinum Gradient for Front Faces */}
          <LinearGradient id="svxFrontWhite" x1="0%" y1="0%" x2="100%" y2="90%">
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <Stop offset="45%" stopColor="#F8FAFC" stopOpacity="1" />
            <Stop offset="80%" stopColor="#E2E8F0" stopOpacity="1" />
            <Stop offset="100%" stopColor="#CBD5E1" stopOpacity="1" />
          </LinearGradient>

          {/* 2. Realistic 3D Origami Inner Shadow Fold (Deep Recess Depth) */}
          <LinearGradient id="svxInnerShadow" x1="10%" y1="0%" x2="90%" y2="100%">
            <Stop offset="0%" stopColor="#0B0F17" stopOpacity="1" />
            <Stop offset="30%" stopColor="#1E293B" stopOpacity="1" />
            <Stop offset="65%" stopColor="#334155" stopOpacity="1" />
            <Stop offset="100%" stopColor="#64748B" stopOpacity="1" />
          </LinearGradient>

          {/* 3. 3D Lower Ribbon Sweep Curve with Ambient Reflection */}
          <LinearGradient id="svxLowerSweep" x1="90%" y1="0%" x2="10%" y2="100%">
            <Stop offset="0%" stopColor="#0F172A" stopOpacity="1" />
            <Stop offset="32%" stopColor="#1E293B" stopOpacity="1" />
            <Stop offset="65%" stopColor="#94A3B8" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>

          {/* 4. Diagonal Intersecting "X" Bar Gradient */}
          <LinearGradient id="svxDiagMetal" x1="0%" y1="20%" x2="100%" y2="80%">
            <Stop offset="0%" stopColor="#475569" stopOpacity="1" />
            <Stop offset="45%" stopColor="#94A3B8" stopOpacity="1" />
            <Stop offset="80%" stopColor="#E2E8F0" stopOpacity="1" />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
          </LinearGradient>

          {/* 5. Subtle Servex Ocean Blue Ambient Edge Glow */}
          <LinearGradient id="svxBlueEdge" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#3B82F6" stopOpacity="0.45" />
            <Stop offset="100%" stopColor="#60A5FA" stopOpacity="0.05" />
          </LinearGradient>
        </Defs>

        <G id="servex-3d-geometry">
          {/* Layer 1: X-Monogram Diagonal Under-Pass Bar (Behind S Ribbon) */}
          <Path
            d="M 72 35 L 115 35 L 160 82 L 125 82 Z"
            fill="url(#svxInnerShadow)"
          />

          {/* Layer 2: X-Monogram Top-Right Beveled Wing */}
          <Path
            d="M 138 25 L 200 25 L 160 67 L 128 67 Z"
            fill="url(#svxFrontWhite)"
          />

          {/* Layer 3: X-Monogram Bottom-Right Anchored Leg */}
          <Path
            d="M 128 67 L 160 67 L 200 140 L 164 140 Z"
            fill="url(#svxFrontWhite)"
          />

          {/* Layer 4: S-Monogram Deep 3D Volumetric Fold Shadow (Produces Ribbon Thickness) */}
          <Path
            d="M 58 0 L 114 25 L 60 25 C 38 25 24 38 24 55 C 24 72 38 85 60 85 L 122 85 C 105 85 92 98 92 112 C 92 126 104 140 122 140 L 0 140 Z"
            fill="url(#svxLowerSweep)"
            opacity={0.92}
          />

          {/* Layer 5: S-Monogram Upper Beveled Ribbon (3D Curving Hood) */}
          <Path
            d="M 58 0 L 114 25 L 75 25 C 45 25 26 40 26 56 C 26 68 35 78 48 83 C 32 76 20 62 20 48 C 20 22 36 0 58 0 Z"
            fill="url(#svxFrontWhite)"
          />

          {/* Layer 6: S-to-X Center Dynamic Origami Crossover Facet */}
          <Path
            d="M 75 25 L 114 25 L 148 60 C 130 60 115 50 100 40 C 90 33 82 28 75 25 Z"
            fill="url(#svxDiagMetal)"
          />

          {/* Layer 7: S-Monogram Lower Sweeping Foot Facet */}
          <Path
            d="M 0 140 L 88 140 C 112 140 124 125 124 105 C 124 88 110 75 90 75 L 48 75 C 35 75 26 82 20 90 L 0 140 Z"
            fill="url(#svxFrontWhite)"
          />

          {/* Layer 8: 3D Specular Highlight Bevel Creases (Gives Razor-Sharp Precision Edges) */}
          <Path
            d="M 58 0 L 114 25"
            stroke="#FFFFFF"
            strokeWidth={1.75}
            strokeLinecap="round"
            opacity={0.85}
          />
          <Path
            d="M 138 25 L 200 25"
            stroke="#FFFFFF"
            strokeWidth={1.75}
            strokeLinecap="round"
            opacity={0.85}
          />
          <Path
            d="M 0 140 L 88 140"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.7}
          />
          <Path
            d="M 164 140 L 200 140"
            stroke="#FFFFFF"
            strokeWidth={1.5}
            strokeLinecap="round"
            opacity={0.7}
          />
        </G>
      </Svg>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.65,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  svg: {
    overflow: 'visible',
  },
});
