/** Tokens del sistema visual "carta náutica" (los mismos que en la web). */
export const colors = {
  paper: '#F2F0E8',
  surface: '#FBFAF6',
  ink: '#0B2239',
  ink2: '#2F4558',
  muted: '#53687A',
  line: '#D6D3C5',
  field: '#6F8798',
  sea: '#1B5E8C',
  seaLight: '#E3ECF1',
  seaMid: '#BFD2DE',
  accent: '#C2410C',
  accentLight: '#FBE9DF',
  ok: '#1F6B4A',
  okLight: '#DDEFE5',
  bad: '#9B2C1B',
  badLight: '#F8E3DE',
  flare: '#F2762E',
  navText: '#C9D8E3',
  sunk: '#3A1305',
  water: '#EAF1F5',
  waterBorder: '#C3D3DD',
  disabled: '#C9CFD3',
  disabledText: '#43525E',
};

/** Familias cargadas en el layout raíz (cada peso es una familia en React Native). */
export const fonts = {
  regular: 'Barlow_400Regular',
  medium: 'Barlow_500Medium',
  semibold: 'Barlow_600SemiBold',
  condensed: 'BarlowCondensed_700Bold',
  mono: 'IBMPlexMono_500Medium',
};

export const fontAssets = {
  Barlow_400Regular: require('@expo-google-fonts/barlow/400Regular/Barlow_400Regular.ttf'),
  Barlow_500Medium: require('@expo-google-fonts/barlow/500Medium/Barlow_500Medium.ttf'),
  Barlow_600SemiBold: require('@expo-google-fonts/barlow/600SemiBold/Barlow_600SemiBold.ttf'),
  BarlowCondensed_700Bold: require('@expo-google-fonts/barlow-condensed/700Bold/BarlowCondensed_700Bold.ttf'),
  IBMPlexMono_500Medium: require('@expo-google-fonts/ibm-plex-mono/500Medium/IBMPlexMono_500Medium.ttf'),
};

/** Estilos de chip por "tono" (los mismos nombres que devuelve @batalla/core). */
export const chipTones = {
  '': { bg: colors.seaLight, fg: colors.ink },
  acc: { bg: colors.accent, fg: '#fff' },
  ok: { bg: colors.ok, fg: '#fff' },
  ink: { bg: colors.ink2, fg: '#fff' },
  line: { bg: 'transparent', fg: colors.ink2, border: colors.field },
};
