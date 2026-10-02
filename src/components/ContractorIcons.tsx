import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const DashboardTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="3"
      width="7"
      height="7"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
    <Rect
      x="14"
      y="3"
      width="7"
      height="7"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
    <Rect
      x="14"
      y="14"
      width="7"
      height="7"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
    <Rect
      x="3"
      y="14"
      width="7"
      height="7"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
  </Svg>
);

export const JobsTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect
      x="2"
      y="6"
      width="20"
      height="15"
      rx="2"
      fill={focused ? 'rgba(255, 255, 255, 0.1)' : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
    <Path
      d="M10 12h4m-2-2v4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
    />
  </Svg>
);

export const EarningsTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="16" cy="14" r="1" fill={focused ? color : color} />
  </Svg>
);

export const ProfileTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle
      cx="12"
      cy="7"
      r="4"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={1.8}
    />
  </Svg>
);

export const MapPinIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="10" r="3" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const ClockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 14,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 6v6l4 2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronRightIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#71717A',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 18l6-6-6-6"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CrewIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 21v-2a4 4 0 0 0-3-3.87"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 21v-2a4 4 0 0 1 4-4h2a4 4 0 0 1 4 4v2"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="15" cy="7" r="4" stroke={color} strokeWidth={1.8} />
    <Path
      d="M7 21v-2a4 4 0 0 1 3-3.87"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="8" cy="8" r="3" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const BuildingIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="2" width="16" height="20" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M9 22v-4h6v4" stroke={color} strokeWidth={1.8} />
    <Path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01" stroke={color} strokeWidth={2.5} strokeLinecap="round" />
  </Svg>
);
