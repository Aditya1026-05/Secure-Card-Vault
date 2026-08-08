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
    text: '#F5F7F6',
    tint: '#9AE5B4',
    background: '#090B0A',
    foreground: '#F5F7F6',
    card: '#121715',
    cardForeground: '#F5F7F6',
    primary: '#9AE5B4',
    primaryForeground: '#07110B',
    secondary: '#171D1A',
    secondaryForeground: '#D6E3DB',
    muted: '#1C2420',
    mutedForeground: '#88958D',
    accent: '#B9F2CB',
    accentForeground: '#07110B',
    destructive: '#FF776B',
    destructiveForeground: '#180604',
    border: '#27332D',
    input: '#1A231E',
    glass: 'rgba(28, 38, 33, 0.76)',
    glassStrong: 'rgba(38, 51, 44, 0.9)',
    ink: '#07100B',
    softInk: '#1B2921',
    electric: '#C3FFD3',
  },
  dark: {
    text: '#F5F7F6',
    tint: '#9AE5B4',
    background: '#090B0A',
    foreground: '#F5F7F6',
    card: '#121715',
    cardForeground: '#F5F7F6',
    primary: '#9AE5B4',
    primaryForeground: '#07110B',
    secondary: '#171D1A',
    secondaryForeground: '#D6E3DB',
    muted: '#1C2420',
    mutedForeground: '#88958D',
    accent: '#B9F2CB',
    accentForeground: '#07110B',
    destructive: '#FF776B',
    destructiveForeground: '#180604',
    border: '#27332D',
    input: '#1A231E',
    glass: 'rgba(28, 38, 33, 0.76)',
    glassStrong: 'rgba(38, 51, 44, 0.9)',
    ink: '#07100B',
    softInk: '#1B2921',
    electric: '#C3FFD3',
  },
  radius: 24,
};

export default colors;
