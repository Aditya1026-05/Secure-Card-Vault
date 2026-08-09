import { useCardVault } from '@/context/CardVaultContext';
import { classicTheme } from '@/themes/classicTheme';
import { modernTheme } from '@/themes/modernTheme';

/**
 * Returns the design tokens dynamically depending on the selected UI mode.
 */
export function useColors() {
  try {
    const { uiMode } = useCardVault();
    return uiMode === 'classic' ? classicTheme : modernTheme;
  } catch {
    // Return modernTheme as fallback if context is not yet active (e.g. during seeding/testing)
    return modernTheme;
  }
}
