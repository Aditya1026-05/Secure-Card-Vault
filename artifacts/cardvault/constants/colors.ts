/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#F7F7F5',
    tint: '#F7F7F5',
    background: '#080808',
    foreground: '#F7F7F5',
    card: '#151515',
    cardForeground: '#F7F7F5',
    primary: '#F1F0EC',
    primaryForeground: '#0B0B0B',
    secondary: '#202020',
    secondaryForeground: '#D0D0CC',
    muted: '#1A1A1A',
    mutedForeground: '#8A8A86',
    accent: '#FFFFFF',
    accentForeground: '#0B0B0B',
    destructive: '#FF776B',
    destructiveForeground: '#180604',
    border: '#343434',
    input: '#1C1C1C',
    glass: 'rgba(29, 29, 29, 0.78)',
    glassStrong: 'rgba(47, 47, 47, 0.92)',
    ink: '#0B0B0B',
    softInk: '#222222',
    electric: '#FFFFFF',
    metalTop: '#4B5050',
    metalMid: '#252A2A',
    metalBottom: '#090B0B',
    metalLine: 'rgba(255,255,255,0.44)',
    metalText: '#F4F5F2',
    metalMuted: 'rgba(244,245,242,0.66)',
  },
  dark: {
    text: '#F7F7F5',
    tint: '#F7F7F5',
    background: '#080808',
    foreground: '#F7F7F5',
    card: '#151515',
    cardForeground: '#F7F7F5',
    primary: '#F1F0EC',
    primaryForeground: '#0B0B0B',
    secondary: '#202020',
    secondaryForeground: '#D0D0CC',
    muted: '#1A1A1A',
    mutedForeground: '#8A8A86',
    accent: '#FFFFFF',
    accentForeground: '#0B0B0B',
    destructive: '#FF776B',
    destructiveForeground: '#180604',
    border: '#343434',
    input: '#1C1C1C',
    glass: 'rgba(29, 29, 29, 0.78)',
    glassStrong: 'rgba(47, 47, 47, 0.92)',
    ink: '#0B0B0B',
    softInk: '#222222',
    electric: '#FFFFFF',
    metalTop: '#4B5050',
    metalMid: '#252A2A',
    metalBottom: '#090B0B',
    metalLine: 'rgba(255,255,255,0.44)',
    metalText: '#F4F5F2',
    metalMuted: 'rgba(244,245,242,0.66)',
  },
  radius: 24,
};

export default colors;
