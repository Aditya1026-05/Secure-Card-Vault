import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useColors } from '@/hooks/useColors';
import { useCardVault, VaultCard, CardCategory } from '@/context/CardVaultContext';

const categoryIcons: Record<CardCategory, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Library: 'bookshelf',
  'Student ID': 'school-outline',
  Gym: 'dumbbell',
  Membership: 'badge-account-outline',
  'Credit Card': 'credit-card-outline',
  'Debit Card': 'credit-card-fast-outline',
  Insurance: 'shield-check-outline',
  Custom: 'card-outline',
};

const CODE39_MAP: Record<string, string> = {
  '0': '000110100', '1': '100100001', '2': '001100001', '3': '101100000',
  '4': '000110001', '5': '100110000', '6': '001110000', '7': '000100101',
  '8': '100100100', '9': '001100100', 'A': '100001001', 'B': '001001001',
  'C': '101001000', 'D': '000011001', 'E': '100011000', 'F': '001011000',
  'G': '000001101', 'H': '100001100', 'I': '001001100', 'J': '000011100',
  'K': '100000011', 'L': '001000011', 'M': '101000010', 'N': '000010011',
  'O': '100010010', 'P': '001010010', 'Q': '000000111', 'R': '100000110',
  'S': '001000110', 'T': '000010110', 'U': '110000001', 'V': '011000001',
  'W': '111000000', 'X': '010010001', 'Y': '110010000', 'Z': '011010000',
  '-': '010000101', '.': '110000100', ' ': '011000100', '$': '010101000',
  '/': '010100010', '+': '010001010', '%': '000101010', '*': '010010100',
};

export function ModernBarcode({ value, compact = false, height, scale = 1 }: { value: string; compact?: boolean; height?: number; scale?: number }) {
  const elements = useMemo(() => {
    const rawVal = (value || '102306233').toUpperCase();
    const filtered = rawVal.split('').filter(c => CODE39_MAP[c] !== undefined).join('');
    const finalStr = filtered.startsWith('*') && filtered.endsWith('*') ? filtered : `*${filtered}*`;

    const result: Array<{ isBar: boolean; width: number }> = [];

    for (let charIndex = 0; charIndex < finalStr.length; charIndex++) {
      const char = finalStr[charIndex];
      const pattern = CODE39_MAP[char];
      if (!pattern) continue;

      for (let i = 0; i < 9; i++) {
        const isBar = i % 2 === 0;
        const isWide = pattern[i] === '1';
        result.push({
          isBar,
          width: isWide ? 2.5 : 1.0,
        });
      }

      if (charIndex < finalStr.length - 1) {
        result.push({
          isBar: false,
          width: 1.0,
        });
      }
    }

    return result;
  }, [value]);

  return (
    <View style={[styles.barcode, compact && styles.barcodeCompact]}>
      <View style={[styles.barcodeBars, height !== undefined && { height }, { gap: 0 }]}>
        {elements.map((elem, index) => (
          <View
            key={index}
            style={{
              width: elem.width * scale,
              backgroundColor: elem.isBar ? '#000000' : 'transparent',
              height: '100%',
            }}
          />
        ))}
      </View>
      {!compact && <Text style={styles.barcodeValue}>{value || '102306233'}</Text>}
    </View>
  );
}

export function ModernCardFace({ card, back, onBarcodePress }: { card: VaultCard; back: boolean; onBarcodePress?: (value: string) => void }) {
  const colors = useColors();
  const { faceIdEnabled } = useCardVault();
  const [isRevealed, setIsRevealed] = useState(false);

  const handleRevealToggle = async () => {
    if (isRevealed) {
      setIsRevealed(false);
      return;
    }
    if (!faceIdEnabled) {
      setIsRevealed(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return;
    }
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (hasHardware && isEnrolled) {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to view secure card info',
          fallbackLabel: 'Use Device Passcode',
        });
        if (result.success) {
          setIsRevealed(true);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
      } else {
        setIsRevealed(true);
      }
    } catch {
      setIsRevealed(true);
    }
  };

  const isBankCard = card.category === 'Credit Card' || card.category === 'Debit Card';
  const isLibraryOrStudent = card.category === 'Library' || card.category === 'Student ID';

  if (back) {
    if (isBankCard) {
      const cleanDigits = card.number.replace(/[^0-9]/g, '');
      const maskedDigits = isRevealed 
        ? cleanDigits 
        : cleanDigits.slice(0, 12).replace(/\d/g, '•') + cleanDigits.slice(12);
      const matches = maskedDigits.match(/.{1,4}/g);
      const maskedNumber = matches ? matches.join(' ') : maskedDigits;
      const maskedCVV = isRevealed ? (card.cvv || '•••') : '•••';
      const maskedValidThru = isRevealed ? (card.validThru || '••/••') : '••/••';

      return (
        <View style={styles.cardFace}>
          <LinearGradient colors={['#181818', '#0A0A0A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

          <View style={styles.magStripe} />

          <View style={styles.bankBackContent}>
            {/* Signature Area (Directly on gradient card surface - no boxes) */}
            <View style={styles.signatureRow}>
              <View style={styles.signatureStrip}>
                <Text style={styles.signatureStripText}>Authorized Signature</Text>
              </View>
              <View style={styles.cvvBox}>
                <Text style={styles.cvvLabel}>CVV</Text>
                <Text style={styles.cvvText}>{maskedCVV}</Text>
              </View>
            </View>

            {/* Card Info Area */}
            <View style={styles.bankInfoBlock}>
              <View style={styles.bankInfoLeft}>
                <Text style={styles.bankNumberLabel}>CARD NUMBER</Text>
                <Text style={styles.bankNumberText}>{maskedNumber}</Text>
                <View style={styles.bankRow}>
                  <View style={{ marginRight: 24 }}>
                    <Text style={styles.bankDetailLabel}>VALID THRU</Text>
                    <Text style={styles.bankDetailText}>{maskedValidThru}</Text>
                  </View>
                  <View>
                    <Text style={styles.bankDetailLabel}>HOLDER</Text>
                    <Text style={styles.bankDetailText}>{card.holder.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* Reveal Toggle Eye Button */}
              <Pressable
                onPress={handleRevealToggle}
                style={({ pressed }) => [
                  styles.revealEyeBtn,
                  isRevealed && { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                  pressed && { opacity: 0.7 }
                ]}
              >
                <Ionicons
                  name={isRevealed ? "eye-off-outline" : "eye-outline"}
                  size={16}
                  color="#FFFFFF"
                />
              </Pressable>
            </View>
          </View>

          {/* Premium Metallic Silver Border */}
          <View style={styles.metalEdge} pointerEvents="none" />
        </View>
      );
    }

    if (isLibraryOrStudent) {
      const barcodeValue = card.barcode || card.rollNo || card.number || '102306233';
      return (
        <View style={styles.cardFace}>
          <LinearGradient colors={['#F5F5F5', '#E5E5E5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={styles.largeBarcodeBackContent}>
            <Text style={styles.largeBarcodeHeader}>{card.category.toUpperCase()} BARCODE (TAP TO EXPAND)</Text>
            <Pressable 
              onPress={() => onBarcodePress?.(barcodeValue)} 
              style={({ pressed }) => [
                styles.largeBarcodeWrapper,
                pressed && { opacity: 0.8 }
              ]}
              accessibilityLabel="Expand Barcode to Fullscreen"
            >
              <ModernBarcode value={barcodeValue} height={90} scale={1.6} />
            </Pressable>
            <Text style={styles.largeBarcodeFooter}>ID: {barcodeValue}</Text>
          </View>
          <View style={[styles.metalEdge, { borderColor: 'rgba(0,0,0,0.08)' }]} pointerEvents="none" />
        </View>
      );
    }

    // Default other cards back face
    return (
      <View style={styles.cardFace}>
        <LinearGradient colors={['#161616', '#080808']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.magStripe} />
        <View style={styles.backContent}>
          <View style={styles.backTopline}>
            <Text style={styles.cardMicro}>SECURE DIGITAL VAULT</Text>
            <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
          </View>
          <View style={{ marginVertical: 12 }}>
            <Text style={styles.backNumber}>{card.number}</Text>
          </View>
          <View style={styles.backBottom}>
            <Text style={styles.backDetail}>HOLDER: {card.holder.toUpperCase()}</Text>
            <Text style={[styles.backDetail, { opacity: 0.6 }]}>Tap to flip</Text>
          </View>
        </View>
        <View style={styles.metalEdge} pointerEvents="none" />
      </View>
    );
  }

  const gradient = {
    green: ['#14201A', '#0A120E', '#030504'] as const,
    lavender: ['#1A1722', '#0E0B12', '#040305'] as const,
    blue: ['#141A22', '#0A0E12', '#030305'] as const,
    orange: ['#221812', '#120D0A', '#050303'] as const,
    graphite: ['#1C1E20', '#0D0F10', '#040405'] as const,
    maroon: ['#221417', '#120A0C', '#050303'] as const,
    brown: ['#1C1613', '#0F0B09', '#040303'] as const,
  }[card.color] || ['#1C1E20', '#0D0F10', '#040405'];

  // Front Face (Luxurious minimal metallic card with brushed steel reflection)
  return (
    <View style={styles.cardFace}>
      {/* Brushed Titanium Base - Color-coded luxurious dark metals */}
      <LinearGradient
        colors={gradient}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Mirror Sheen Reflection Catching Light - Softened */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.06)',
          'rgba(255,255,255,0.01)',
          'rgba(255,255,255,0.10)',
          'rgba(255,255,255,0.01)',
          'rgba(255,255,255,0.04)'
        ]}
        locations={[0, 0.38, 0.45, 0.55, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.cardTop}>
        <View style={styles.brandMark}>
          <MaterialCommunityIcons name={categoryIcons[card.category]} size={18} color="#FFFFFF" />
        </View>
        <Text style={styles.cardMicro}>{card.category.toUpperCase()}</Text>
        <View style={styles.nfcMark}>
          <Ionicons name="wifi" size={16} color="#FFFFFF" />
        </View>
      </View>

      <View style={styles.cardMiddle}>
        <Text numberOfLines={1} style={styles.cardTitle}>{card.title}</Text>
        <Text numberOfLines={1} style={styles.institution}>{card.institution}</Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={{ flexDirection: 'row', gap: 20, flex: 1, alignItems: 'flex-end' }}>
          <View>
            <Text style={styles.cardLabel}>CARDHOLDER</Text>
            <Text style={styles.holder}>{card.holder}</Text>
          </View>
          {isLibraryOrStudent && (
            <View style={{ marginLeft: 14 }}>
              <Text style={styles.cardLabel}>ROLL NO / ID</Text>
              <Text style={styles.holder}>{card.rollNo || card.number || '—'}</Text>
            </View>
          )}
        </View>

        {/* Luxury Gold Smart Chip */}
        <LinearGradient
          colors={['#E5C060', '#F9E49B', '#B89030', '#F9E49B', '#A47D22']}
          locations={[0, 0.25, 0.5, 0.75, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chip}
        >
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
        </LinearGradient>
      </View>

      {/* Luxury Metallic Accent Border Outline */}
      <View style={styles.metalEdge} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  cardFace: {
    flex: 1,
    borderRadius: 20,
    padding: 21,
    overflow: 'hidden',
    backgroundColor: '#101010',
  },
  metalEdge: {
    position: 'absolute',
    inset: 0,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardMicro: {
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#D9D9D9',
  },
  nfcMark: {
    marginLeft: 'auto',
    transform: [{ rotate: '90deg' }],
    opacity: 0.7,
  },
  cardMiddle: {
    marginTop: 'auto',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#FFFFFF',
  },
  institution: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.2,
    color: '#8C8C8C',
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  cardLabel: {
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 4,
    color: '#8C8C8C',
  },
  holder: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: '#F5F5F5',
  },
  chip: {
    width: 35,
    height: 25,
    borderRadius: 6,
    padding: 4,
    gap: 3,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chipLine: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  magStripe: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: '#000000',
  },
  bankBackContent: {
    flex: 1,
    paddingVertical: 14,
    marginTop: 40,
  },
  signatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 10,
    gap: 10,
  },
  signatureStrip: {
    flex: 1,
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  signatureStripText: {
    fontStyle: 'italic',
    fontSize: 9,
    color: '#8C8C8C',
  },
  cvvBox: {
    width: 50,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.15)',
  },
  cvvLabel: {
    fontSize: 7,
    color: '#8C8C8C',
    fontWeight: '700',
    position: 'absolute',
    top: 2,
  },
  cvvText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  bankInfoBlock: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    marginTop: 'auto',
    marginBottom: 2,
  },
  bankInfoLeft: {
    flex: 1,
  },
  bankNumberLabel: {
    fontSize: 8,
    color: '#8C8C8C',
    fontWeight: '700',
    letterSpacing: 1,
  },
  bankNumberText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginVertical: 4,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  bankRow: {
    flexDirection: 'row',
    marginTop: 2,
  },
  bankDetailLabel: {
    fontSize: 7,
    color: '#8C8C8C',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bankDetailText: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
    color: '#F5F5F5',
  },
  revealEyeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  largeBarcodeBackContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  largeBarcodeHeader: {
    fontSize: 8,
    letterSpacing: 2,
    fontWeight: '700',
    color: '#555555',
    marginBottom: 6,
  },
  largeBarcodeWrapper: {
    padding: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeBarcodeFooter: {
    fontSize: 12,
    letterSpacing: 1.5,
    fontWeight: '700',
    color: '#000000',
    marginTop: 6,
  },
  barcode: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  barcodeBars: {
    height: 31,
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'center',
    gap: 2,
  },
  barcodeValue: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 2.2,
    fontWeight: '600',
    color: '#000000',
  },
  barcodeCompact: {
    height: 37,
    marginTop: 10,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  backContent: {
    flex: 1,
    justifyContent: 'flex-end',
    marginTop: 40,
  },
  backTopline: {
    position: 'absolute',
    top: 1,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backNumber: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1.4,
    color: '#FFFFFF',
  },
  backDetail: {
    fontSize: 9,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  backBottom: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});
