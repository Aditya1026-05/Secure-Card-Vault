import { useEffect } from 'react';
import { Platform } from 'react-native';
import { VaultCard } from '../context/CardVaultContext';

// Safely import the native module proxy only on iOS to avoid crashes on other platforms
let CardVaultLiveActivity: any = null;
if (Platform.OS === 'ios') {
  try {
    CardVaultLiveActivity = require('../modules/cardvault-live-activity').default;
  } catch (error) {
    console.warn('CardVaultLiveActivity module not found. Ensure prebuild and local target linking has run successfully.', error);
  }
}

/**
 * Detect the correct barcode symbology based on the string format.
 * Matches existing barcode layout heuristics.
 */
function detectBarcodeType(value: string): 'code39' | 'code128' | 'qr' | 'pdf417' {
  const clean = value.trim();
  if (clean.startsWith('http://') || clean.startsWith('https://') || clean.length > 25) {
    return 'qr';
  }
  if (/^[0-9]+$/.test(clean)) {
    if (clean.length === 12 || clean.length === 13 || clean.length === 8) {
      return 'code128';
    }
  }
  return 'code39';
}

export function useLiveActivitySync(activeId: string | null, cards: VaultCard[], hydrated: boolean) {
  useEffect(() => {
    // Only synchronize Live Activities on iOS when the native module is loaded and state is hydrated
    if (Platform.OS !== 'ios' || !CardVaultLiveActivity || !hydrated) {
      return;
    }

    const activeCard = cards.find((c) => c.id === activeId);

    if (activeCard) {
      const isCreditOrDebit = activeCard.category === 'Credit Card' || activeCard.category === 'Debit Card';
      const cardType = isCreditOrDebit ? 'payment' : 'library';
      
      // SECURITY: Mask card number inside JS. Send ONLY last 4 digits and mask characters.
      // CVV, PIN, and other credentials are completely excluded.
      const rawNumber = activeCard.number || '';
      const maskedCardNumber = isCreditOrDebit 
        ? rawNumber.replace(/\d(?=\d{4})/g, '•')
        : '';
        
      const validThru = isCreditOrDebit ? (activeCard.validThru || '') : '';
      
      const barcodeValue = !isCreditOrDebit 
        ? (activeCard.barcode || activeCard.rollNo || activeCard.number || '') 
        : '';
      const barcodeType = !isCreditOrDebit ? detectBarcodeType(barcodeValue) : 'code39';

      CardVaultLiveActivity.startOrUpdateActivity(
        activeCard.title,
        activeCard.institution || activeCard.category,
        cardType,
        maskedCardNumber,
        validThru,
        barcodeValue,
        barcodeType,
        activeCard.color || 'graphite'
      );
    } else {
      // End any running Live Activities if no card is selected/active
      CardVaultLiveActivity.endActivity();
    }
  }, [activeId, cards, hydrated]);
}
