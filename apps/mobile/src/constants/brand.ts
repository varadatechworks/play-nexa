const safeColor=(value:string|undefined,fallback:string)=>/^#[a-fA-F0-9]{6}$/.test(value||"")?value!:fallback;
export const BrandColors = {
  primary: safeColor(process.env.EXPO_PUBLIC_ARENA_PRIMARY_COLOR, '#263712'),
  secondary: '#415126',
  accent: safeColor(process.env.EXPO_PUBLIC_ARENA_ACCENT_COLOR, '#D23808'),
  accentSoft: '#FFF0E7',
  success: '#4D7A35',
  background: '#F5F1E8',
  surface: '#FFFCF6',
  textPrimary: '#202619',
  textSecondary: '#68705F',
  border: '#E2D5BE',
  white: '#FFFFFF',
  warningBackground: '#FFF4DF',
  warningBorder: '#EDC47B',
  warningText: '#86520A',
} as const;
