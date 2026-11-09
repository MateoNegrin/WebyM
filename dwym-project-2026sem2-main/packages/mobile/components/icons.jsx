import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from './theme.js';

export function BrandMark({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" accessibilityElementsHidden importantForAccessibility="no">
      <Rect x="1" y="1" width="26" height="26" rx="4" fill="none" stroke="#fff" strokeWidth="2" />
      <Path d="M1 10h26M1 19h26M10 1v26M19 1v26" stroke="#fff" strokeOpacity={0.35} />
      <Circle cx="14.5" cy="14.5" r="4" fill={colors.flare} />
    </Svg>
  );
}

export const BackIcon = () => (
  <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <Path d="M15 5l-7 7 7 7" />
  </Svg>
);

const tabIconProps = (color) => ({ width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' });

export const HomeIcon = ({ color }) => (
  <Svg {...tabIconProps(color)}>
    <Path d="M3 11l9-8 9 8M5 10v10h14V10" />
  </Svg>
);

export const GridIcon = ({ color }) => (
  <Svg {...tabIconProps(color)}>
    <Rect x="3" y="3" width="18" height="18" rx="2" />
    <Path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </Svg>
);

export const ProfileIcon = ({ color }) => (
  <Svg {...tabIconProps(color)}>
    <Circle cx="12" cy="8" r="4" />
    <Path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
  </Svg>
);

/** Ilustración de la pantalla de ingreso. */
export function HeroArt({ size = 180 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 320 320">
      <Rect width="320" height="320" fill="#0F2D49" />
      {Array.from({ length: 10 }, (_, i) => (
        <Path key={i} d={`M${i * 32} 0V320M0 ${i * 32}H320`} stroke="#2C557A" />
      ))}
      <Rect x="33" y="33" width="158" height="30" rx="4" fill="#3E6D91" />
      <Rect x="225" y="65" width="30" height="126" rx="4" fill="#3E6D91" />
      <Rect x="65" y="161" width="94" height="30" rx="4" fill="#3E6D91" />
      <Rect x="97" y="225" width="94" height="30" rx="4" fill="#3E6D91" />
      <Rect x="33" y="289" width="62" height="30" rx="4" fill="#3E6D91" />
      <Rect x="225" y="97" width="30" height="30" fill={colors.accent} />
      <Path d="M233 105l14 14M247 105l-14 14" stroke="#fff" strokeWidth="3" />
      <Rect x="129" y="33" width="30" height="30" fill={colors.accent} />
      <Path d="M137 41l14 14M151 41l-14 14" stroke="#fff" strokeWidth="3" />
      <Circle cx="48" cy="209" r="5" fill="#7FA6C2" />
      <Circle cx="176" cy="113" r="5" fill="#7FA6C2" />
      <Circle cx="272" cy="241" r="5" fill="#7FA6C2" />
    </Svg>
  );
}
