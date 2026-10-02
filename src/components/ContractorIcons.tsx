import React from 'react';
import Svg, { Path, Rect, Circle, Line, Polyline, Polygon } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

export const HomeTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v6H4.5A1.5 1.5 0 0 1 3 20v-9.5z"
      stroke={color}
      strokeWidth={focused ? 2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? 'rgba(26, 115, 232, 0.15)' : 'none'}
    />
  </Svg>
);

export const ScheduleTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3"
      y="4"
      width="18"
      height="18"
      rx="3"
      stroke={color}
      strokeWidth={focused ? 2 : 1.8}
      fill={focused ? 'rgba(26, 115, 232, 0.15)' : 'none'}
    />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

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

export const BriefcaseIcon: React.FC<{ size?: number; color?: string }> = JobsTabIcon;

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
    <Circle cx="16" cy="14" r="1.5" fill={color} />
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

export const FileTextIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="14 2 14 8 20 8" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="16" y1="13" x2="8" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="16" y1="17" x2="8" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="10" y1="9" x2="8" y2="9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const RulerSquareIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.3 8.7L15.3 2.7C14.9 2.3 14.3 2.3 13.9 2.7L2.7 13.9C2.3 14.3 2.3 14.9 2.7 15.3L8.7 21.3C9.1 21.7 9.7 21.7 10.1 21.3L21.3 10.1C21.7 9.7 21.7 9.1 21.3 8.7Z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Line x1="7.5" y1="9" x2="10" y2="11.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="10.5" y1="6" x2="13" y2="8.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="13.5" y1="15" x2="16" y2="17.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CheckCircleIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#10B981',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.8} />
    <Path
      d="M8.5 12.5L10.8 14.8L15.5 9.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CurrencyRupeeIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 3h12M6 8h12M6 13l7 8M6 8a4.5 4.5 0 0 0 9 0M6 13h4.5"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const WalletIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M16 3H4a2 2 0 0 0-2 2v2h18V5a2 2 0 0 0-2-2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="16" cy="14" r="1.5" fill={color} />
  </Svg>
);

export const MessageSquareIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LinkIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="5" x2="12" y2="19" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

export const ShieldCheckIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#10B981',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const LogoutIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#EF4444',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const ShareIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="18" cy="5" r="3" stroke={color} strokeWidth={1.8} />
    <Circle cx="6" cy="12" r="3" stroke={color} strokeWidth={1.8} />
    <Circle cx="18" cy="19" r="3" stroke={color} strokeWidth={1.8} />
    <Line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const DownloadIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Polyline points="7 10 12 15 17 10" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="12" y1="15" x2="12" y2="3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const LockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#D97706',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const UnlockIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#10B981',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="11" width="18" height="11" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M7 11V7a5 5 0 0 1 9.9-1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const PhoneIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CalendarIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth={1.8} />
    <Line x1="16" y1="2" x2="16" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="8" y1="2" x2="8" y2="6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    <Line x1="3" y1="10" x2="21" y2="10" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const CameraIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={1.8} />
  </Svg>
);

export const SparklesIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#F59E0B',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2l2.4 5.2L20 8.4l-4 3.9.9 5.7-4.9-2.6-4.9 2.6.9-5.7-4-3.9 5.6-1.2L12 2z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const FilterIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CheckIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#10B981',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Polyline points="20 6 9 17 4 12" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CloseIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowRightIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="5" y1="12" x2="19" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 5 19 12 12 19" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ArrowLeftIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="19" y1="12" x2="5" y2="12" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 19 5 12 12 5" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const CopyIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#A1A1AA',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="9" y="9" width="13" height="13" rx="2" stroke={color} strokeWidth={1.8} />
    <Path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
  </Svg>
);

export const SendIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 16,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="22" y1="2" x2="11" y2="13" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    <Polygon points="22 2 15 22 11 13 2 9 22 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const SlidersIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 18,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    {/* Top slider track with vertical tick */}
    <Line x1="4" y1="8" x2="20" y2="8" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="8" y1="5" x2="8" y2="11" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    {/* Bottom slider track with vertical tick */}
    <Line x1="4" y1="16" x2="20" y2="16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Line x1="16" y1="13" x2="16" y2="19" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
  </Svg>
);

export const ArrowUpIcon: React.FC<{ size?: number; color?: string }> = ({
  size = 20,
  color = '#FFFFFF',
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="12" y1="19" x2="12" y2="5" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    <Polyline points="5 12 12 5 19 12" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BarChartTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Line x1="6" y1="20" x2="6" y2="14" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
    <Line x1="12" y1="20" x2="12" y2="6" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
    <Line x1="18" y1="20" x2="18" y2="10" stroke={color} strokeWidth={focused ? 2.5 : 2} strokeLinecap="round" />
  </Svg>
);

export const ChatTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
      stroke={color}
      strokeWidth={focused ? 2.2 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill={focused ? 'rgba(255, 255, 255, 0.12)' : 'none'}
    />
  </Svg>
);

export const GridTabIcon: React.FC<IconProps> = ({
  size = 22,
  color = '#71717A',
  focused = false,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect
      x="3.5"
      y="3.5"
      width="6.5"
      height="6.5"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={focused ? 2 : 1.8}
    />
    <Rect
      x="14"
      y="3.5"
      width="6.5"
      height="6.5"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={focused ? 2 : 1.8}
    />
    <Rect
      x="14"
      y="14"
      width="6.5"
      height="6.5"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={focused ? 2 : 1.8}
    />
    <Rect
      x="3.5"
      y="14"
      width="6.5"
      height="6.5"
      rx="2"
      fill={focused ? color : 'none'}
      stroke={color}
      strokeWidth={focused ? 2 : 1.8}
    />
  </Svg>
);
