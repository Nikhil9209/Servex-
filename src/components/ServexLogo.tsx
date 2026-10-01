import React from 'react';
import { View, Image, StyleSheet, ImageStyle, ViewStyle } from 'react-native';

const LOGO_SRC = require('../../assets/servex_logo.png');

interface ServexLogoProps {
  size?: number;
  containerStyle?: ViewStyle;
  imageStyle?: ImageStyle;
  showBadge?: boolean;
}

export const ServexLogo: React.FC<ServexLogoProps> = ({
  size = 48,
  containerStyle,
  imageStyle,
  showBadge = true,
}) => {
  if (!showBadge) {
    return (
      <Image
        source={LOGO_SRC}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    );
  }

  const badgeSize = size + 16;
  const radius = Math.round(badgeSize * 0.25);

  return (
    <View
      style={[
        styles.badge,
        {
          width: badgeSize,
          height: badgeSize,
          borderRadius: radius,
        },
        containerStyle,
      ]}
    >
      <Image
        source={LOGO_SRC}
        style={[{ width: size, height: size }, imageStyle]}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#0F1116',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#1F242F',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
});
