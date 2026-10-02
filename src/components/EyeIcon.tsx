import React from 'react';
import Svg, { Path } from 'react-native-svg';

export interface EyeIconProps {
  /**
   * If true, renders open eye; if false, renders eye with slash (hidden)
   */
  visible?: boolean;
  size?: number;
  color?: string;
}

export const EyeIcon: React.FC<EyeIconProps> = ({
  visible = true,
  size = 20,
  color = '#71717A',
}) => {
  if (visible) {
    // Open eye
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Path
          d="M2 12C2 12 5.636 5 12 5C18.364 5 22 12 22 12C22 12 18.364 19 12 19C5.636 19 2 12 2 12Z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }

  // Eye with slash (off / hidden)
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.88 9.88C9.33 10.43 9 11.18 9 12C9 13.66 10.34 15 12 15C12.82 15 13.57 14.67 14.12 14.12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10.73 5.08C11.15 5.03 11.57 5 12 5C18.36 5 22 12 22 12C20.89 13.93 19.38 15.48 17.5 16.5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.61 6.61C4.62 7.89 3.03 9.77 2 12C2 12 5.64 19 12 19C13.88 19 15.61 18.38 17.09 17.34"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 3L21 21"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
