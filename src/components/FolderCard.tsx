import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../theme/tokens';
import { SpringPressable } from './AnimatedComponents';

interface FolderCardProps {
  title: string;
  subtitle: string;
  icon?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  badgeCount?: number;
}

export const FolderCard: React.FC<FolderCardProps> = ({
  title,
  subtitle,
  icon,
  onPress,
  style,
  badgeCount,
}) => {
  return (
    <SpringPressable
      style={[styles.cardContainer, style]}
      onPress={onPress}
      scaleTo={0.96}
    >
      {/* SVG Folder Silhouette Background */}
      <Svg
        style={StyleSheet.absoluteFill}
        viewBox="0 0 160 170"
        preserveAspectRatio="none"
      >
        <Path
          d="M 0 22 A 22 22 0 0 1 22 0 L 68 0 C 76 0 80 4 84 9 C 88 14 92 14 100 14 L 138 14 A 22 22 0 0 1 160 36 L 160 148 A 22 22 0 0 1 138 170 L 22 170 A 22 22 0 0 1 0 148 Z"
          fill="#16161A"
          stroke="#222228"
          strokeWidth={1}
        />
      </Svg>

      {/* Internal Content */}
      <View style={styles.innerContent}>
        {/* Top Icon Row */}
        <View style={styles.topRow}>
          <View style={styles.iconWrapper}>{icon}</View>
          {badgeCount !== undefined && badgeCount > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>{badgeCount}</Text>
            </View>
          )}
        </View>

        {/* Bottom Title & Subtitle */}
        <View style={styles.bottomInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    </SpringPressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: 165,
    borderRadius: 22,
    position: 'relative',
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  innerContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 4,
  },
  iconWrapper: {
    opacity: 0.6,
  },
  badgePill: {
    backgroundColor: '#23232C',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#30303A',
  },
  badgeText: {
    fontFamily: fonts.displayBold,
    color: '#E2E2E8',
    fontSize: 10,
  },
  bottomInfo: {
    gap: 3,
  },
  title: {
    fontFamily: fonts.displayBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontFamily: fonts.body,
    color: '#7E7E86',
    fontSize: 12.5,
  },
});
