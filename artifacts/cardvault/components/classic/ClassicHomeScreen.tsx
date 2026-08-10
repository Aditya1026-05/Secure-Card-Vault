import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CardCategory, useCardVault, VaultCard } from '@/context/CardVaultContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 40, 372);
const CARD_HEIGHT = CARD_WIDTH * 0.64;

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

const categoryOptions: CardCategory[] = [
  'Library',
  'Student ID',
  'Gym',
  'Membership',
  'Credit Card',
  'Debit Card',
  'Insurance',
  'Custom',
];

const COLOR_OPTIONS: { key: VaultCard['color']; label: string; hex: string }[] = [
  { key: 'green', label: 'Emerald', hex: '#1C3F30' },
  { key: 'lavender', label: 'Amethyst', hex: '#3B3254' },
  { key: 'blue', label: 'Sapphire', hex: '#1C2C3F' },
  { key: 'orange', label: 'Amber', hex: '#4B3621' },
  { key: 'graphite', label: 'Titanium', hex: '#36393F' },
  { key: 'maroon', label: 'Ruby', hex: '#4A1D24' },
  { key: 'brown', label: 'Bronze', hex: '#3E2E25' },
  { key: 'black', label: 'Obsidian', hex: '#1A1A1E' },
];

function GlassButton({
  icon,
  onPress,
  label,
  active = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label?: string;
  active?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.iconButton, active && { backgroundColor: colors.primary }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={active ? colors.primaryForeground : colors.foreground} />
    </Pressable>
  );
}

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

function Barcode({ value, compact = false, height, color, scale = 1 }: { value: string; compact?: boolean; height?: number; color?: string; scale?: number }) {
  const colors = useColors();
  const barColor = color || (compact ? colors.ink : colors.foreground);
  const spaceColor = 'transparent';

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
              backgroundColor: elem.isBar ? barColor : spaceColor,
              height: '100%',
            }}
          />
        ))}
      </View>
      {!compact && <Text style={[styles.barcodeValue, { color: barColor }]}>{value || '102306233'}</Text>}
    </View>
  );
}

function FauxQr({ value }: { value: string }) {
  const colors = useColors();
  const cells = useMemo(
    () =>
      Array.from({ length: 81 }, (_, index) => {
        const x = index % 9;
        const y = Math.floor(index / 9);
        const finder = (x < 3 && y < 3) || (x > 5 && y < 3) || (x < 3 && y > 5);
        return finder ? (x === 0 || x === 2 || y === 0 || y === 2 || (x === 1 && y === 1) ? 1 : 0) : (value.charCodeAt(index % value.length) + index) % 3 === 0 ? 1 : 0;
      }),
    [value],
  );
  return (
    <View style={[styles.qr, { backgroundColor: colors.foreground }]}>
      {cells.map((cell, index) => <View key={index} style={[styles.qrCell, { backgroundColor: cell ? colors.ink : colors.foreground }]} />)}
    </View>
  );
}

function CardFace({ card, back, onBarcodePress }: { card: VaultCard; back: boolean; onBarcodePress?: (value: string) => void }) {
  const colors = useColors();
  const { faceIdEnabled } = useCardVault();
  const [isRevealed, setIsRevealed] = useState(false);

  const gradient = {
    green: [colors.metalTop, colors.metalBottom] as const,
    lavender: ['#4A454D', '#101014'] as const,
    blue: ['#37454B', '#0B1012'] as const,
    orange: ['#4B4037', '#120F0D'] as const,
    graphite: [colors.metalMid, colors.metalBottom] as const,
    maroon: ['#523B3E', '#161011'] as const,
    brown: ['#4E413B', '#14100E'] as const,
    black: ['#2E2E32', '#0A0A0C'] as const,
  }[card.color] || [colors.metalMid, colors.metalBottom];

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
      const maskedNumber = isRevealed 
        ? card.number 
        : card.number.replace(/\d(?=\d{4})/g, '•');
      const maskedCVV = isRevealed ? (card.cvv || '•••') : '•••';
      const maskedValidThru = isRevealed ? (card.validThru || '••/••') : '••/••';

      return (
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFace}>
          <View style={[styles.magStripe, { backgroundColor: 'rgba(11, 11, 11, 0.85)' }]} />
          
          <View style={styles.bankBackContent}>
            {/* Signature Area */}
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
                <Text style={[styles.bankNumberText, { color: colors.metalText }]}>{maskedNumber}</Text>
                <View style={styles.bankRow}>
                  <View style={{ marginRight: 24 }}>
                    <Text style={styles.bankDetailLabel}>VALID THRU</Text>
                    <Text style={[styles.bankDetailText, { color: colors.metalText }]}>{maskedValidThru}</Text>
                  </View>
                  <View>
                    <Text style={styles.bankDetailLabel}>HOLDER</Text>
                    <Text style={[styles.bankDetailText, { color: colors.metalText }]}>{card.holder.toUpperCase()}</Text>
                  </View>
                </View>
              </View>

              {/* Reveal Toggle Eye Button */}
              <Pressable 
                onPress={handleRevealToggle}
                style={({ pressed }) => [
                  styles.revealEyeBtn, 
                  { backgroundColor: isRevealed ? 'rgba(112, 203, 139, 0.2)' : 'rgba(255, 255, 255, 0.08)' },
                  pressed && styles.pressed
                ]}
              >
                <Ionicons 
                  name={isRevealed ? "eye-off-outline" : "eye-outline"} 
                  size={18} 
                  color={isRevealed ? "#70CB8B" : colors.metalText} 
                />
              </Pressable>
            </View>
          </View>

          <View style={styles.metalEdge} pointerEvents="none" />
        </LinearGradient>
      );
    }

    if (isLibraryOrStudent) {
      const barcodeValue = card.barcode || card.rollNo || card.number || '102306233';
      return (
        <LinearGradient colors={['#F5F7F6', '#E9F1EC']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFace}>
          <View style={styles.largeBarcodeBackContent}>
            <Text style={styles.largeBarcodeHeader}>{card.category.toUpperCase()} BARCODE</Text>
            <Pressable onPress={() => onBarcodePress?.(barcodeValue)}>
              <View style={styles.largeBarcodeWrapper}>
                <Barcode value={barcodeValue} height={90} color={colors.ink} scale={1.6} />
              </View>
            </Pressable>
            <Text style={styles.largeBarcodeFooter}>ID: {barcodeValue}</Text>
          </View>
          <View style={[styles.metalEdge, { borderColor: 'rgba(0,0,0,0.06)' }]} pointerEvents="none" />
        </LinearGradient>
      );
    }

    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFace}>
        <View style={[styles.magStripe, { backgroundColor: 'rgba(11, 11, 11, 0.62)' }]} />
        <View style={styles.backContent}>
          <View style={styles.backTopline}>
            <Text style={[styles.cardMicro, { color: colors.metalText }]}>CARDVAULT / SECURE VIEW</Text>
            <FauxQr value={card.barcode} />
          </View>
          <Pressable onPress={() => onBarcodePress?.(card.barcode)}>
            <Barcode value={card.barcode} />
          </Pressable>
          <View style={styles.backBottom}>
            <Text style={[styles.backNumber, { color: colors.metalText }]}>{card.number}</Text>
            <Text style={[styles.backDetail, { color: colors.metalMuted }]}>Tap to return</Text>
          </View>
        </View>
        <View style={styles.metalEdge} pointerEvents="none" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFace}>
      <View style={styles.cardGlow} />
      <View style={styles.cardTop}>
        <View style={[styles.brandMark, { backgroundColor: 'rgba(11, 11, 11, 0.15)' }]}>
          <MaterialCommunityIcons name={categoryIcons[card.category]} size={18} color={colors.metalText} />
        </View>
        <Text style={[styles.cardMicro, { color: colors.metalText }]}>{card.category.toUpperCase()}</Text>
        <View style={styles.nfcMark}><Ionicons name="wifi" size={16} color={colors.metalText} /></View>
      </View>
      <View style={styles.cardMiddle}>
        <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.metalText }]}>{card.title}</Text>
        <Text numberOfLines={1} style={[styles.institution, { color: colors.metalMuted }]}>{card.institution}</Text>
      </View>
      <View style={styles.cardBottom}>
        <View style={{ flexDirection: 'row', gap: 20, flex: 1, alignItems: 'flex-end' }}>
          <View>
            <Text style={[styles.cardLabel, { color: colors.metalMuted }]}>CARDHOLDER</Text>
            <Text style={[styles.holder, { color: colors.metalText }]}>{card.holder}</Text>
          </View>
          {isLibraryOrStudent && (
            <View style={{ marginLeft: 14 }}>
              <Text style={[styles.cardLabel, { color: colors.metalMuted }]}>ROLL NO / ID</Text>
              <Text style={[styles.holder, { color: colors.metalText }]}>{card.rollNo || card.number || '—'}</Text>
            </View>
          )}
        </View>
        <View style={styles.chip}>
          <View style={styles.chipLine} /><View style={styles.chipLine} /><View style={styles.chipLine} />
        </View>
      </View>
      <View style={styles.metalSheen} pointerEvents="none" />
      <View style={styles.metalEdge} pointerEvents="none" />
    </LinearGradient>
  );
}

function VaultCardView({
  card,
  onPress,
  onDrop,
  onHorizontalSwipe,
  onDropTarget,
  onDragState,
  index,
  selected,
  swipeDirection,
  onBarcodePress,
  totalCards,
}: {
  card: VaultCard;
  onPress: () => void;
  onDrop: () => void;
  onHorizontalSwipe: (direction: 1 | -1) => void;
  onDropTarget: () => void;
  onDragState: (dragging: boolean) => void;
  index: number;
  selected: boolean;
  swipeDirection: 'left' | 'right' | null;
  onBarcodePress?: (value: string) => void;
  totalCards: number;
}) {
  const colors = useColors();
  const [flipped, setFlipped] = useState(false);
  const [isAnimatingToBack, setIsAnimatingToBack] = useState(false);
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const [isInDropZone, setIsInDropZone] = useState(false);
  
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  const spacingStep = Math.max(10, Math.min(22, 44 / Math.max(2, totalCards)));
  const fannedTranslateY = useRef(new Animated.Value(Math.min(index, 2) * spacingStep)).current;
  const fannedScale = useRef(new Animated.Value(1 - Math.min(index, 2) * 0.04)).current;

  useEffect(() => {
    const targetY = Math.min(index, 2) * spacingStep;
    const targetScale = 1 - Math.min(index, 2) * 0.04;
    
    Animated.parallel([
      Animated.spring(fannedTranslateY, {
        toValue: targetY,
        damping: 22,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(fannedScale, {
        toValue: targetScale,
        damping: 22,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [index, spacingStep]);

  useEffect(() => {
    if (index === 0 && swipeDirection === 'right') {
      translateX.setValue(-SCREEN_WIDTH);
      Animated.spring(translateX, {
        toValue: 0,
        damping: 16,
        stiffness: 120,
        mass: 0.8,
        useNativeDriver: true,
      }).start();
    }
  }, [index, swipeDirection]);

  const indexRef = useRef(index);
  indexRef.current = index;

  const isInDropZoneRef = useRef(false);
  const setInDropZone = (val: boolean) => {
    setIsInDropZone(val);
    isInDropZoneRef.current = val;
  };

  const callbacksRef = useRef({ onDrop, onHorizontalSwipe, onDropTarget, onDragState });
  callbacksRef.current = { onDrop, onHorizontalSwipe, onDropTarget, onDragState };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => indexRef.current === 0 && (Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8),
      onPanResponderGrant: () => {
        Animated.spring(scale, { toValue: 0.8, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
        callbacksRef.current.onDragState(true);
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsLocalDragging(true);
        setInDropZone(false);
      },
      onPanResponderMove: (_, gesture) => {
        translateX.setValue(gesture.dx);
        const dragY = gesture.dy < 0 ? gesture.dy : gesture.dy * 0.22;
        translateY.setValue(dragY);
        const inDropZone = gesture.dy < -110;
        if (inDropZone !== isInDropZoneRef.current) {
          setInDropZone(inDropZone);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        const horizontalThreshold = 60;
        const draggingToTarget = gesture.dy < -110;
        setIsLocalDragging(false);
        setInDropZone(false);
        if (draggingToTarget) {
          Animated.parallel([
            Animated.timing(translateY, { toValue: -140, duration: 200, useNativeDriver: true }),
            Animated.timing(translateX, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 0.5, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            callbacksRef.current.onDropTarget();
            callbacksRef.current.onDragState(false);
            translateY.setValue(0);
            translateX.setValue(0);
            scale.setValue(1);
          });
        } else if (gesture.dx < -horizontalThreshold && Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
          setIsAnimatingToBack(true);
          callbacksRef.current.onDragState(true);
          
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: -SCREEN_WIDTH,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scale, {
              toValue: 1.05,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(-SCREEN_WIDTH);
            scale.setValue(1.05);
            callbacksRef.current.onHorizontalSwipe(1);
            
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: 0,
                damping: 15,
                stiffness: 120,
                mass: 0.8,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1,
                damping: 15,
                stiffness: 120,
                mass: 0.8,
                useNativeDriver: true,
              }),
              Animated.spring(translateY, {
                toValue: 0,
                damping: 15,
                stiffness: 120,
                mass: 0.8,
                useNativeDriver: true,
              }),
            ]).start(() => {
              setIsAnimatingToBack(false);
              callbacksRef.current.onDragState(false);
            });
          });
        } else if (gesture.dx > horizontalThreshold && Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
          setIsAnimatingToBack(true);
          callbacksRef.current.onDragState(true);
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              damping: 15,
              stiffness: 120,
              mass: 0.8,
              useNativeDriver: true,
            }),
            Animated.spring(scale, {
              toValue: 1,
              damping: 15,
              stiffness: 120,
              mass: 0.8,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              damping: 15,
              stiffness: 120,
              mass: 0.8,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setIsAnimatingToBack(false);
            callbacksRef.current.onDragState(false);
          });
          
          callbacksRef.current.onHorizontalSwipe(-1);
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 7 }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 7 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }),
          ]).start(() => callbacksRef.current.onDragState(false));
        }
      },
      onPanResponderTerminate: () => {
        setIsLocalDragging(false);
        setInDropZone(false);
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 7 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 7 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }),
        ]).start(() => callbacksRef.current.onDragState(false));
      },
    }),
  ).current;
 

  const flip = () => {
    void Haptics.selectionAsync();
    const next = flipped ? 0 : 180;
    Animated.timing(rotateY, { toValue: next, duration: 520, useNativeDriver: true }).start();
    setFlipped((value) => !value);
  };

  const frontOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [1, 0, 0] });
  const backOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [0, 0, 1] });
  const frontRotate = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  const isVisible = index <= 2 || isAnimatingToBack;
  const opacity = isVisible ? 1 : 0;

  const animatedScale = Animated.multiply(fannedScale, scale);

  let zIndex = 20 - index;
  if (isAnimatingToBack) {
    zIndex = 10;
  }

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        styles.stackCard,
        {
          zIndex,
          opacity,
          transform: [
            { translateY: fannedTranslateY },
            { translateY },
            { translateX },
            { scale: animatedScale },
          ],
        },
        index > 0 && styles.peekingCard,
      ]}
    >
      <Pressable onPress={flip} style={styles.cardPressable} accessibilityRole="button" accessibilityLabel={`${card.title}, tap to flip`}>
        <Animated.View style={[styles.cardLayer, { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
          <CardFace card={card} back={false} onBarcodePress={onBarcodePress} />
        </Animated.View>
        <Animated.View style={[styles.cardLayer, styles.cardBackLayer, { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
          <CardFace card={card} back onBarcodePress={onBarcodePress} />
        </Animated.View>
      </Pressable>
      {selected && <View style={[styles.selectedRing, { borderColor: colors.primary }]} pointerEvents="none" />}
      {isLocalDragging && (
        <View 
          style={[
            styles.dragIndicatorOverlay, 
            isInDropZone && { backgroundColor: 'rgba(112, 203, 139, 0.25)' }
          ]} 
          pointerEvents="none"
        >
          <BlurView intensity={30} tint={isInDropZone ? "dark" : "light"} style={[styles.dragIndicatorBlur, isInDropZone && { borderColor: '#70CB8B' }]}>
            <MaterialCommunityIcons 
              name={isInDropZone ? "check-circle-outline" : "card-bulleted-outline"} 
              size={20} 
              color={isInDropZone ? "#70CB8B" : "#000000"} 
            />
            <Text style={[styles.dragIndicatorText, isInDropZone && { color: '#70CB8B' }]}>
              {isInDropZone ? "RELEASE TO DROP" : "DRAGGING"}
            </Text>
          </BlurView>
        </View>
      )}
    </Animated.View>
  );
}

function ActiveIsland({
  card,
  onPress,
  compact = false,
  isDragging = false,
  onDrop,
  onClear,
}: {
  card: VaultCard | null;
  onPress: () => void;
  compact?: boolean;
  isDragging?: boolean;
  onDrop?: () => void;
  onClear?: () => void;
}) {
  const colors = useColors();

  if (compact) {
    return (
      <Pressable
        onPress={onDrop ?? onPress}
        style={({ pressed }) => [
          styles.islandCompact,
          isDragging && styles.islandDropActive,
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel={card ? `Active card: ${card.title}` : 'No active card'}
      >
        <View style={styles.islandCompactContent}>
          <View style={[styles.liveDotCompact, { backgroundColor: card ? colors.primary : '#4a4a4a' }]} />
          {card ? (
            <View style={styles.islandCompactRow}>
              <MaterialCommunityIcons 
                name={categoryIcons[card.category]} 
                size={12} 
                color={colors.primary} 
                style={{ marginRight: 4 }} 
              />
              <Text style={styles.islandCompactTitle} numberOfLines={1}>
                {card.title}
              </Text>
            </View>
          ) : (
            <Text style={styles.islandCompactTitle} numberOfLines={1}>
              {isDragging ? 'DROP' : 'OFFLINE'}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onDrop ?? onPress}
      style={({ pressed }) => [
        styles.island,
        isDragging && styles.islandDropActive,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Active Island Card"
    >
      <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.islandHeader}>
        <View style={styles.islandTitleRow}>
          <View style={[styles.liveDot, card && { backgroundColor: colors.primary }]} />
          <Text style={styles.islandEyebrow}>ACTIVE ISLAND</Text>
        </View>
        {card && onClear ? (
          <Pressable 
            onPress={(e) => {
              e.stopPropagation();
              onClear();
            }}
            style={({ pressed }) => pressed && { opacity: 0.7 }}
            hitSlop={8}
          >
            <Text style={{ color: '#FF6b6b', fontSize: 11, fontWeight: 'bold' }}>DEACTIVATE</Text>
          </Pressable>
        ) : (
          <Ionicons name="arrow-up-right-box" size={16} color={colors.mutedForeground} />
        )}
      </View>
      {card ? (
        <View>
          <View style={styles.islandCardRow}>
            <View style={[styles.islandIcon, { backgroundColor: colors.primary }]}>
              <MaterialCommunityIcons name={categoryIcons[card.category]} size={15} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.islandCardName} numberOfLines={1}>{card.title}</Text>
              <Text style={styles.islandCardStatus}>{isDragging ? 'Release to activate' : 'Ready to reveal secure details'}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
          </View>

          {/* Secure details display within Active Island container (Hidden from card face) */}
          {(card.accountNumber || card.routingNumber || card.pin || card.notes || card.ifsc || card.branch) ? (
            <View style={styles.islandSecureDetails}>
              <Text style={styles.islandSecureHeader}>SECURE INFO</Text>
              {card.accountNumber ? (
                <View style={styles.islandDetailRow}>
                  <Text style={styles.islandDetailLabel}>ACCOUNT NO</Text>
                  <Text style={styles.islandDetailValue}>{card.accountNumber}</Text>
                </View>
              ) : null}
              {card.routingNumber ? (
                <View style={styles.islandDetailRow}>
                  <Text style={styles.islandDetailLabel}>ROUTING NO</Text>
                  <Text style={styles.islandDetailValue}>{card.routingNumber}</Text>
                </View>
              ) : null}
              {card.ifsc ? (
                <View style={styles.islandDetailRow}>
                  <Text style={styles.islandDetailLabel}>IFSC CODE</Text>
                  <Text style={styles.islandDetailValue}>{card.ifsc}</Text>
                </View>
              ) : null}
              {card.branch ? (
                <View style={styles.islandDetailRow}>
                  <Text style={styles.islandDetailLabel}>BRANCH</Text>
                  <Text style={styles.islandDetailValue}>{card.branch}</Text>
                </View>
              ) : null}
              {card.pin ? (
                <View style={styles.islandDetailRow}>
                  <Text style={styles.islandDetailLabel}>CARD PIN</Text>
                  <Text style={styles.islandDetailValue}>{card.pin}</Text>
                </View>
              ) : null}
              {card.notes ? (
                <View style={[styles.islandDetailRow, { flexDirection: 'column', alignItems: 'flex-start', gap: 2, marginTop: 4 }]}>
                  <Text style={styles.islandDetailLabel}>SECURE NOTES</Text>
                  <Text style={styles.islandDetailNotes}>{card.notes}</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.islandEmpty}>
          <Text style={styles.islandEmptyTitle}>No card selected</Text>
          <Text style={styles.islandEmptyBody}>Drag a card here</Text>
        </View>
      )}
    </Pressable>
  );
}

function AddCardSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addCard } = useCardVault();
  const [title, setTitle] = useState('');
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<CardCategory>('Membership');
  const [cvv, setCvv] = useState('');
  const [validThru, setValidThru] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branch, setBranch] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedCardColor, setSelectedCardColor] = useState<VaultCard['color']>('green');

  const isDateValid = !validThru || (
    validThru.length === 5 && 
    /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(validThru)
  );

  const isCardNumberValid = (category === 'Credit Card' || category === 'Debit Card')
    ? number.replace(/[^0-9]/g, '').length === 16
    : true;

  const canSave = title.trim().length > 1 && holder.trim().length > 1 && isDateValid && isCardNumberValid;

  const hasCardNumberError = (category === 'Credit Card' || category === 'Debit Card') && 
    number.length > 0 && 
    number.replace(/[^0-9]/g, '').length !== 16;

  const previewCard: VaultCard = {
    id: 'preview',
    title: title.toUpperCase() || 'YOUR CARD',
    holder: holder || 'Your name',
    institution: 'A new card in your vault',
    number: number || '0000 0000',
    barcode: barcode || '102306233',
    category,
    color: selectedCardColor,
    cvv: cvv || undefined,
    validThru: validThru || undefined,
    rollNo: rollNo || undefined,
    accountNumber: accountNumber || undefined,
    routingNumber: routingNumber || undefined,
    pin: pin || undefined,
    notes: notes || undefined,
    ifsc: ifsc || undefined,
    branch: branch || undefined,
  };

  const closeAndReset = () => {
    Keyboard.dismiss();
    setTitle('');
    setHolder('');
    setNumber('');
    setBarcode('');
    setCategory('Membership');
    setCvv('');
    setValidThru('');
    setRollNo('');
    setAccountNumber('');
    setRoutingNumber('');
    setPin('');
    setNotes('');
    setIfsc('');
    setBranch('');
    setDateError('');
    setSelectedCardColor('green');
    onClose();
  };

  const save = () => {
    if (!canSave) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addCard({
      title: title.trim().toUpperCase(),
      holder: holder.trim(),
      institution: 'Added to your private vault',
      number: number.trim() || '—',
      barcode: barcode.trim() || number.trim() || '102306233',
      category,
      color: selectedCardColor,
      cvv: cvv.trim() || undefined,
      validThru: validThru.trim() || undefined,
      rollNo: rollNo.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      routingNumber: routingNumber.trim() || undefined,
      pin: pin.trim() || undefined,
      notes: notes.trim() || undefined,
      ifsc: ifsc.trim() || undefined,
      branch: branch.trim() || undefined,
    });
    closeAndReset();
  };

  const handleCardNumberChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 16);
    const matches = clean.match(/\d{1,4}/g);
    setNumber(matches ? matches.join(' ') : clean);
  };

  const handleDateChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length === 0) {
      setValidThru('');
      setDateError('');
      return;
    }

    let month = clean.slice(0, 2);
    let year = clean.slice(2, 4);

    if (month.length === 1 && parseInt(month, 10) > 1) {
      month = '0' + month;
    }

    if (month.length === 2) {
      const mVal = parseInt(month, 10);
      if (mVal < 1 || mVal > 12) {
        setDateError('Invalid month (01-12)');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }

    if (clean.length > 2) {
      setValidThru(month + '/' + year);
    } else {
      setValidThru(month);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeAndReset}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalScrim} onPress={closeAndReset} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18), height: '92%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>NEW ENTRY</Text>
              <Text style={styles.sheetTitle}>Add to your vault</Text>
            </View>
            <GlassButton icon="close" onPress={closeAndReset} label="Close add card" />
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
              <View style={styles.previewWrap}>
                <Text style={styles.sectionLabel}>LIVE PREVIEW</Text>
                <View pointerEvents="none" style={styles.previewCard}>
                  <CardFace card={previewCard} back={false} />
                </View>
              </View>
              <Text style={styles.sectionLabel}>CARD DETAILS</Text>
              <Field 
                label="CARD TITLE" 
                value={title} 
                onChangeText={(text) => setTitle(text.replace(/[^a-zA-Z0-9\s-_]/g, '').toUpperCase())} 
                placeholder="e.g. THAPAR LIBRARY" 
              />
              <Field 
                label="CARDHOLDER" 
                value={holder} 
                onChangeText={(text) => setHolder(text.replace(/[^a-zA-Z\s.-]/g, ''))} 
                placeholder="Your name" 
              />
              
              {category === 'Credit Card' || category === 'Debit Card' ? (
                <View>
                  <View style={styles.fieldRow}>
                    <View style={{ flex: 1.5 }}>
                      <Field 
                        label="CARD NUMBER" 
                        value={number} 
                        onChangeText={handleCardNumberChange} 
                        placeholder="e.g. 4532 7189 0288 3314" 
                        keyboardType="numbers-and-punctuation" 
                      />
                      {hasCardNumberError ? <Text style={styles.errorLabel}>Must be 16 digits</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field 
                        label="VALID THRU" 
                        value={validThru} 
                        onChangeText={handleDateChange} 
                        placeholder="MM/YY" 
                        maxLength={5} 
                      />
                      {dateError ? <Text style={styles.errorLabel}>{dateError}</Text> : null}
                    </View>
                    <View style={{ flex: 0.8 }}>
                      <Field 
                        label="CVV" 
                        value={cvv} 
                        onChangeText={(text) => setCvv(text.replace(/[^0-9]/g, '').slice(0, 3))} 
                        placeholder="e.g. 451" 
                        maxLength={3} 
                        keyboardType="numbers-and-punctuation" 
                      />
                    </View>
                  </View>
                </View>
              ) : category === 'Library' || category === 'Student ID' ? (
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1.2 }}>
                    <Field 
                      label="CARD NUMBER" 
                      value={number} 
                      onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))} 
                      placeholder="e.g. 102306233" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field 
                      label="ROLL NO / STUDENT ID" 
                      value={rollNo} 
                      onChangeText={(text) => setRollNo(text.replace(/[^a-zA-Z0-9-]/g, ''))} 
                      placeholder="e.g. 102306233" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Field 
                      label="CARD NUMBER" 
                      value={number} 
                      onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))} 
                      placeholder="Optional" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field 
                      label="BARCODE VALUE" 
                      value={barcode} 
                      onChangeText={(text) => setBarcode(text.replace(/[^a-zA-Z0-9\s\-.$/+%]/g, '').toUpperCase())} 
                      placeholder="Optional" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                </View>
              )}

            <Text style={styles.sectionLabel}>CARD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categoryOptions.map((option) => {
                const active = option === category;
                return (
                  <Pressable key={option} onPress={() => { void Haptics.selectionAsync(); setCategory(option); }} style={[styles.categoryChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <MaterialCommunityIcons name={categoryIcons[option]} size={15} color={active ? colors.ink : colors.mutedForeground} />
                    <Text style={[styles.categoryChipText, active && { color: colors.ink }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>CARD COLOR</Text>
            <View style={styles.colorPickerContainer}>
              {COLOR_OPTIONS.map((option) => {
                const active = option.key === selectedCardColor;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedCardColor(option.key);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: option.hex },
                      active && styles.colorSwatchActive,
                    ]}
                    accessibilityLabel={`Select color: ${option.label}`}
                  />
                );
              })}
            </View>
            <Text style={styles.sectionLabel}>SECURE ACCOUNT DETAILS (HIDDEN FROM CARD FACE)</Text>
            {category === 'Credit Card' || category === 'Debit Card' ? (
              <View style={styles.fieldRow}>
                <View style={{ flex: 1.2 }}>
                  <Field 
                    label="IFSC CODE" 
                    value={ifsc} 
                    onChangeText={(text) => setIfsc(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11))} 
                    placeholder="e.g. HDFC0000104" 
                    maxLength={11}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field 
                    label="BRANCH NAME" 
                    value={branch} 
                    onChangeText={(text) => setBranch(text.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 35))} 
                    placeholder="e.g. Connaught Place" 
                  />
                </View>
              </View>
            ) : null}
            <View style={styles.fieldRow}>
              <View style={{ flex: 1.2 }}>
                <Field 
                  label="ACCOUNT NUMBER" 
                  value={accountNumber} 
                  onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))} 
                  placeholder="Optional secure account #" 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field 
                  label="ROUTING NUMBER" 
                  value={routingNumber} 
                  onChangeText={(text) => setRoutingNumber(text.replace(/[^0-9]/g, ''))} 
                  placeholder="Optional routing #" 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Field 
                  label="CARD PIN" 
                  value={pin} 
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))} 
                  placeholder="e.g. 1234" 
                  maxLength={4} 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
            </View>
            <Field 
              label="SECURE NOTES" 
              value={notes} 
              onChangeText={(text) => setNotes(text.slice(0, 200))} 
              placeholder="Enter any extra account details or notes..." 
            />

            <Text style={styles.sectionLabel}>CARD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categoryOptions.map((option) => {
                const active = option === category;
                return (
                  <Pressable key={option} onPress={() => { void Haptics.selectionAsync(); setCategory(option); }} style={[styles.categoryChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <MaterialCommunityIcons name={categoryIcons[option]} size={15} color={active ? colors.ink : colors.mutedForeground} />
                    <Text style={[styles.categoryChipText, active && { color: colors.ink }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={save} disabled={!canSave} style={({ pressed }) => [styles.saveButton, { backgroundColor: canSave ? colors.primary : colors.muted }, pressed && canSave && styles.pressed]} accessibilityRole="button">
              <Text style={[styles.saveButtonText, { color: canSave ? colors.ink : colors.mutedForeground }]}>Save card</Text>
              <Ionicons name="arrow-forward" size={18} color={canSave ? colors.ink : colors.mutedForeground} />
            </Pressable>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cards, faceIdEnabled, setFaceIdEnabled, uiMode, setUiMode } = useCardVault();
  const [hapticsEnabled, setHapticsEnabled] = useState(true);

  const closeAndReset = () => {
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeAndReset}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalScrim} onPress={closeAndReset} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>SYSTEM SETTINGS</Text>
              <Text style={styles.sheetTitle}>Preferences & Info</Text>
            </View>
            <GlassButton icon="close" onPress={closeAndReset} label="Close settings" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            
            <Text style={styles.sectionLabel}>APP PREFERENCES</Text>
            
            <Pressable 
              onPress={() => {
                void Haptics.selectionAsync();
                setHapticsEnabled(!hapticsEnabled);
              }}
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && styles.pressed
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Haptic Feedback</Text>
                  <Text style={styles.settingsRowSub}>Tactile feedback on swipe & actions</Text>
                </View>
              </View>
              <Ionicons 
                name={hapticsEnabled ? "toggle" : "toggle-outline"} 
                size={34} 
                color={hapticsEnabled ? colors.primary : colors.mutedForeground} 
              />
            </Pressable>

            <Pressable 
              onPress={async () => {
                void Haptics.selectionAsync();
                try {
                  const hasHardware = await LocalAuthentication.hasHardwareAsync();
                  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
                  if (hasHardware && isEnrolled) {
                    const result = await LocalAuthentication.authenticateAsync({
                      promptMessage: faceIdEnabled 
                        ? 'Authenticate to disable biometric decryption' 
                        : 'Authenticate to enable biometric decryption',
                      fallbackLabel: 'Use Device Passcode',
                    });
                    if (result.success) {
                      setFaceIdEnabled(!faceIdEnabled);
                      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } else {
                      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                    }
                  } else {
                    setFaceIdEnabled(!faceIdEnabled);
                  }
                } catch {
                  setFaceIdEnabled(!faceIdEnabled);
                }
              }}
              style={({ pressed }) => [
                styles.settingsRow,
                { marginTop: 10 },
                pressed && styles.pressed
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Biometric Decryption</Text>
                  <Text style={styles.settingsRowSub}>Require Face ID to decrypt card details</Text>
                </View>
              </View>
              <Ionicons 
                name={faceIdEnabled ? "toggle" : "toggle-outline"} 
                size={34} 
                color={faceIdEnabled ? colors.primary : colors.mutedForeground} 
              />
            </Pressable>

            {/* Appearance Toggle */}
            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>APPEARANCE</Text>
            <Pressable 
              onPress={() => {
                void Haptics.selectionAsync();
                setUiMode(uiMode === 'classic' ? 'modern' : 'classic');
              }}
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && styles.pressed
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="color-palette-outline" size={20} color={colors.primary} />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>UI Theme Mode</Text>
                  <Text style={styles.settingsRowSub}>Currently: {uiMode.toUpperCase()} UI</Text>
                </View>
              </View>
              <Ionicons 
                name={uiMode === 'modern' ? "toggle" : "toggle-outline"} 
                size={34} 
                color={uiMode === 'modern' ? colors.primary : colors.mutedForeground} 
              />
            </Pressable>

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>VAULT STATISTICS</Text>
            <View style={styles.statsCard}>
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>{cards.length}</Text>
                <Text style={styles.statsLabel}>Total cards secured</Text>
              </View>
              <View style={styles.statsDivider} />
              <View style={styles.statsItem}>
                <Text style={styles.statsValue}>
                  {new Set(cards.map(c => c.category)).size}
                </Text>
                <Text style={styles.statsLabel}>Unique categories</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>SECURITY INFO</Text>
            <View style={styles.securityBanner}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#70CB8B" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.securityTitle}>On-Device Encryption</Text>
                <Text style={styles.securityText}>
                  Your credit/debit, student, library, and membership cards are encrypted and saved strictly in your device's local memory. No data is ever uploaded online.
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>ABOUT APPLICATION</Text>
            <View style={styles.aboutBox}>
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>App Version</Text>
                <Text style={styles.aboutVal}>v1.0.0 (Expo SDK 51)</Text>
              </View>
              <View style={styles.aboutDivider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Developer</Text>
                <Text style={styles.aboutVal}>Aditya Tayal</Text>
              </View>
              <View style={styles.aboutDivider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>License</Text>
                <Text style={styles.aboutVal}>Proprietary & Secure</Text>
              </View>
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function EditCardSheet({ card, onClose }: { card: VaultCard | null; onClose: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { updateCard, deleteCard } = useCardVault();
  
  const [title, setTitle] = useState('');
  const [holder, setHolder] = useState('');
  const [number, setNumber] = useState('');
  const [barcode, setBarcode] = useState('');
  const [category, setCategory] = useState<CardCategory>('Membership');
  const [cvv, setCvv] = useState('');
  const [validThru, setValidThru] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [pin, setPin] = useState('');
  const [notes, setNotes] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [branch, setBranch] = useState('');
  const [dateError, setDateError] = useState('');
  const [selectedCardColor, setSelectedCardColor] = useState<VaultCard['color']>('green');

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setHolder(card.holder);
      setNumber(card.number === '—' ? '' : card.number);
      setBarcode(card.barcode === '102306233' ? '' : card.barcode);
      setCategory(card.category);
      setCvv(card.cvv || '');
      setValidThru(card.validThru || '');
      setRollNo(card.rollNo || '');
      setAccountNumber(card.accountNumber || '');
      setRoutingNumber(card.routingNumber || '');
      setPin(card.pin || '');
      setNotes(card.notes || '');
      setIfsc(card.ifsc || '');
      setBranch(card.branch || '');
      setSelectedCardColor(card.color || 'green');
      setDateError('');
    }
  }, [card]);

  if (!card) return null;

  const isDateValid = !validThru || (
    validThru.length === 5 && 
    /^(0[1-9]|1[0-2])\/[0-9]{2}$/.test(validThru)
  );

  const isCardNumberValid = (category === 'Credit Card' || category === 'Debit Card')
    ? number.replace(/[^0-9]/g, '').length === 16
    : true;

  const canSave = title.trim().length > 1 && holder.trim().length > 1 && isDateValid && isCardNumberValid;

  const hasCardNumberError = (category === 'Credit Card' || category === 'Debit Card') && 
    number.length > 0 && 
    number.replace(/[^0-9]/g, '').length !== 16;

  const previewCard: VaultCard = {
    id: card.id,
    title: title.toUpperCase() || 'YOUR CARD',
    holder: holder || 'Your name',
    institution: card.institution,
    number: number || '0000 0000',
    barcode: barcode || '102306233',
    category,
    color: selectedCardColor,
    cvv: cvv || undefined,
    validThru: validThru || undefined,
    rollNo: rollNo || undefined,
    accountNumber: accountNumber || undefined,
    routingNumber: routingNumber || undefined,
    pin: pin || undefined,
    notes: notes || undefined,
    ifsc: ifsc || undefined,
    branch: branch || undefined,
  };

  const closeAndReset = () => {
    Keyboard.dismiss();
    onClose();
  };

  const save = () => {
    if (!canSave) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateCard(card.id, {
      title: title.trim().toUpperCase(),
      holder: holder.trim(),
      number: number.trim() || '—',
      barcode: barcode.trim() || number.trim() || '102306233',
      category,
      color: selectedCardColor,
      cvv: cvv.trim() || undefined,
      validThru: validThru.trim() || undefined,
      rollNo: rollNo.trim() || undefined,
      accountNumber: accountNumber.trim() || undefined,
      routingNumber: routingNumber.trim() || undefined,
      pin: pin.trim() || undefined,
      notes: notes.trim() || undefined,
      ifsc: ifsc.trim() || undefined,
      branch: branch.trim() || undefined,
    });
    closeAndReset();
  };

  const handleCardNumberChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 16);
    const matches = clean.match(/\d{1,4}/g);
    setNumber(matches ? matches.join(' ') : clean);
  };

  const handleDateChange = (text: string) => {
    const clean = text.replace(/[^0-9]/g, '').slice(0, 4);
    if (clean.length === 0) {
      setValidThru('');
      setDateError('');
      return;
    }

    let month = clean.slice(0, 2);
    let year = clean.slice(2, 4);

    if (month.length === 1 && parseInt(month, 10) > 1) {
      month = '0' + month;
    }

    if (month.length === 2) {
      const mVal = parseInt(month, 10);
      if (mVal < 1 || mVal > 12) {
        setDateError('Invalid month (01-12)');
      } else {
        setDateError('');
      }
    } else {
      setDateError('');
    }

    if (clean.length > 2) {
      setValidThru(month + '/' + year);
    } else {
      setValidThru(month);
    }
  };

  const remove = () => {
    Alert.alert(
      "Delete Card",
      `Are you sure you want to permanently delete "${card.title}" from your secure vault?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            deleteCard(card.id);
            closeAndReset();
          }
        }
      ]
    );
  };

  return (
    <Modal visible={card !== null} animationType="slide" transparent onRequestClose={closeAndReset}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalScrim} onPress={closeAndReset} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18), height: '92%' }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>EDIT ENTRY</Text>
              <Text style={styles.sheetTitle}>Update card details</Text>
            </View>
            <GlassButton icon="close" onPress={closeAndReset} label="Close edit card" />
          </View>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
          >
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
              <View style={styles.previewWrap}>
                <Text style={styles.sectionLabel}>LIVE PREVIEW</Text>
                <View pointerEvents="none" style={styles.previewCard}>
                  <CardFace card={previewCard} back={false} />
                </View>
              </View>
              
              <Text style={styles.sectionLabel}>CARD DETAILS</Text>
              <Field 
                label="CARD TITLE" 
                value={title} 
                onChangeText={(text) => setTitle(text.replace(/[^a-zA-Z0-9\s-_]/g, '').toUpperCase())} 
                placeholder="e.g. THAPAR LIBRARY" 
              />
              <Field 
                label="CARDHOLDER" 
                value={holder} 
                onChangeText={(text) => setHolder(text.replace(/[^a-zA-Z\s.-]/g, ''))} 
                placeholder="Your name" 
              />
              
              {category === 'Credit Card' || category === 'Debit Card' ? (
                <View>
                  <View style={styles.fieldRow}>
                    <View style={{ flex: 1.5 }}>
                      <Field 
                        label="CARD NUMBER" 
                        value={number} 
                        onChangeText={handleCardNumberChange} 
                        placeholder="e.g. 4532 7189 0288 3314" 
                        keyboardType="numbers-and-punctuation" 
                      />
                      {hasCardNumberError ? <Text style={styles.errorLabel}>Must be 16 digits</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field 
                        label="VALID THRU" 
                        value={validThru} 
                        onChangeText={handleDateChange} 
                        placeholder="MM/YY" 
                        maxLength={5} 
                      />
                      {dateError ? <Text style={styles.errorLabel}>{dateError}</Text> : null}
                    </View>
                    <View style={{ flex: 0.8 }}>
                      <Field 
                        label="CVV" 
                        value={cvv} 
                        onChangeText={(text) => setCvv(text.replace(/[^0-9]/g, '').slice(0, 3))} 
                        placeholder="e.g. 451" 
                        maxLength={3} 
                        keyboardType="numbers-and-punctuation" 
                      />
                    </View>
                  </View>
                </View>
              ) : category === 'Library' || category === 'Student ID' ? (
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1.2 }}>
                    <Field 
                      label="CARD NUMBER" 
                      value={number} 
                      onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))} 
                      placeholder="e.g. 102306233" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field 
                      label="ROLL NO / STUDENT ID" 
                      value={rollNo} 
                      onChangeText={(text) => setRollNo(text.replace(/[^a-zA-Z0-9-]/g, ''))} 
                      placeholder="e.g. 102306233" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1 }}>
                    <Field 
                      label="CARD NUMBER" 
                      value={number} 
                      onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))} 
                      placeholder="Optional" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field 
                      label="BARCODE VALUE" 
                      value={barcode} 
                      onChangeText={(text) => setBarcode(text.replace(/[^a-zA-Z0-9\s\-.$/+%]/g, '').toUpperCase())} 
                      placeholder="Optional" 
                      keyboardType="numbers-and-punctuation" 
                    />
                  </View>
                </View>
              )}

            <Text style={styles.sectionLabel}>CARD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categoryOptions.map((option) => {
                const active = option === category;
                return (
                  <Pressable key={option} onPress={() => { void Haptics.selectionAsync(); setCategory(option); }} style={[styles.categoryChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <MaterialCommunityIcons name={categoryIcons[option]} size={15} color={active ? colors.ink : colors.mutedForeground} />
                    <Text style={[styles.categoryChipText, active && { color: colors.ink }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>CARD COLOR</Text>
            <View style={styles.colorPickerContainer}>
              {COLOR_OPTIONS.map((option) => {
                const active = option.key === selectedCardColor;
                return (
                  <Pressable
                    key={option.key}
                    onPress={() => {
                      void Haptics.selectionAsync();
                      setSelectedCardColor(option.key);
                    }}
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: option.hex },
                      active && styles.colorSwatchActive,
                    ]}
                    accessibilityLabel={`Select color: ${option.label}`}
                  />
                );
              })}
            </View>

            <Text style={styles.sectionLabel}>SECURE ACCOUNT DETAILS (HIDDEN FROM CARD FACE)</Text>
            {category === 'Credit Card' || category === 'Debit Card' ? (
              <View style={styles.fieldRow}>
                <View style={{ flex: 1.2 }}>
                  <Field 
                    label="IFSC CODE" 
                    value={ifsc} 
                    onChangeText={(text) => setIfsc(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11))} 
                    placeholder="e.g. HDFC0000104" 
                    maxLength={11}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Field 
                    label="BRANCH NAME" 
                    value={branch} 
                    onChangeText={(text) => setBranch(text.replace(/[^a-zA-Z0-9\s]/g, '').slice(0, 35))} 
                    placeholder="e.g. Connaught Place" 
                  />
                </View>
              </View>
            ) : null}
            <View style={styles.fieldRow}>
              <View style={{ flex: 1.2 }}>
                <Field 
                  label="ACCOUNT NUMBER" 
                  value={accountNumber} 
                  onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))} 
                  placeholder="Optional secure account #" 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <Field 
                  label="ROUTING NUMBER" 
                  value={routingNumber} 
                  onChangeText={(text) => setRoutingNumber(text.replace(/[^0-9]/g, ''))} 
                  placeholder="Optional routing #" 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
            </View>
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <Field 
                  label="CARD PIN" 
                  value={pin} 
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))} 
                  placeholder="e.g. 1234" 
                  maxLength={4} 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
            </View>
            <Field 
              label="SECURE NOTES" 
              value={notes} 
              onChangeText={(text) => setNotes(text.slice(0, 200))} 
              placeholder="Enter any extra account details or notes..." 
            />

            <Text style={styles.sectionLabel}>CARD TYPE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {categoryOptions.map((option) => {
                const active = option === category;
                return (
                  <Pressable key={option} onPress={() => { void Haptics.selectionAsync(); setCategory(option); }} style={[styles.categoryChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <MaterialCommunityIcons name={categoryIcons[option]} size={15} color={active ? colors.ink : colors.mutedForeground} />
                    <Text style={[styles.categoryChipText, active && { color: colors.ink }]}>{option}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.editActionRow}>
              <Pressable onPress={remove} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]} accessibilityRole="button">
                <Ionicons name="trash-outline" size={18} color="#FF5A5A" />
                <Text style={styles.deleteButtonText}>Delete card</Text>
              </Pressable>
              
              <Pressable onPress={save} disabled={!canSave} style={({ pressed }) => [styles.saveChangesButton, { backgroundColor: canSave ? colors.primary : colors.muted }, pressed && canSave && styles.pressed]} accessibilityRole="button">
                <Text style={[styles.saveChangesButtonText, { color: canSave ? colors.ink : colors.mutedForeground }]}>Save Changes</Text>
                <Ionicons name="checkmark" size={18} color={canSave ? colors.ink : colors.mutedForeground} />
              </Pressable>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType, maxLength }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numbers-and-punctuation'; maxLength?: number }) {
  const colors = useColors();
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
        autoCapitalize={label === 'CARD TITLE' ? 'characters' : 'words'}
      />
    </View>
  );
}

export function ClassicHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cards, activeId, setActiveId } = useCardVault();
  const [activeIndex, setActiveIndex] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<VaultCard | null>(null);
  const [islandExpanded, setIslandExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [fullscreenBarcode, setFullscreenBarcode] = useState<string | null>(null);

  const activeCard = cards.find((card) => card.id === activeId) ?? null;
  const visibleCards = useMemo(() => {
    if (cards.length === 0) return [];
    const list: VaultCard[] = [];
    for (let i = 0; i < cards.length; i++) {
      const idx = (activeIndex + i) % cards.length;
      list.push(cards[idx]);
    }
    return list;
  }, [cards, activeIndex]);

  const shiftCard = (direction: number) => {
    if (cards.length < 2) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSwipeDirection(direction > 0 ? 'left' : 'right');
    setActiveIndex((current) => (current + direction + cards.length) % cards.length);
  };

  const handleDrop = () => {
    const card = visibleCards[0];
    if (!card) return;
    setActiveId(card.id);
    setIslandExpanded(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleHorizontalSwipe = (direction: 1 | -1) => {
    shiftCard(direction);
  };

  const handleDropTarget = () => {
    const card = visibleCards[0];
    if (!card) return;
    setActiveId(card.id);
    setIslandExpanded(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 12) }]}>
      <LinearGradient colors={['#1B1B1A', colors.background, colors.background]} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientOrb} />
      
      {/* Fixed Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.wordmarkRow}>
            <View style={[styles.wordmarkDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.wordmark}>CARDVAULT</Text>
          </View>
          <Text style={styles.subtitle}>Your cards, one tap away</Text>
        </View>
        <View style={styles.headerActions}>
          <GlassButton icon={islandExpanded ? "eye-outline" : "eye-off-outline"} onPress={() => setIslandExpanded((value) => !value)} label="Toggle active card visibility" />
          <GlassButton icon="settings-outline" onPress={() => setSettingsVisible(true)} label="Open settings" />
        </View>
      </View>

      {/* Fixed Dynamic Island Expanded Preview (Drop Target) */}
      {islandExpanded && (
        <View style={{ marginBottom: 12 }}>
          <ActiveIsland
            card={activeCard}
            isDragging={isDragging}
            onDrop={handleDropTarget}
            onPress={() => { if (activeCard) setEditingCard(activeCard); }}
            onClear={() => setActiveId(null)}
          />
        </View>
      )}

      {/* Fixed Collection Hero Heading */}
      <View style={styles.heroHeading}>
        <View><Text style={styles.heroKicker}>YOUR COLLECTION</Text><Text style={styles.heroTitle}>The vault</Text></View>
        <View style={styles.countPill}><Text style={styles.countText}>{String(cards.length).padStart(2, '0')}</Text><Text style={styles.countLabel}>CARDS</Text></View>
      </View>

      {/* Fixed Stack Area */}
      <View style={styles.stackArea}>
        <Animated.View style={styles.stackGroup}>
        {visibleCards.length > 0 ? (
          visibleCards.slice().reverse().map((card, reverseIndex) => {
            const index = visibleCards.length - 1 - reverseIndex;
            return (
              <VaultCardView
                key={card.id}
                card={card}
                index={index}
                selected={activeId === card.id}
                swipeDirection={index === 0 ? swipeDirection : null}
                onPress={() => setActiveId(card.id)}
                onDrop={index === 0 ? handleDrop : () => undefined}
                onHorizontalSwipe={index === 0 ? handleHorizontalSwipe : () => undefined}
                onDropTarget={index === 0 ? handleDropTarget : () => undefined}
                onDragState={index === 0 ? setIsDragging : () => undefined}
                onBarcodePress={setFullscreenBarcode}
                totalCards={cards.length}
              />
            );
          })
        ) : (
          <View style={styles.emptyStack}><MaterialCommunityIcons name="cards-outline" size={34} color={colors.mutedForeground} /><Text style={styles.emptyTitle}>Your vault is waiting</Text><Text style={styles.emptyBody}>Add your first card below.</Text></View>
        )}
        </Animated.View>
      </View>

      {/* Fixed Stack Hint */}
      <View style={styles.stackHint}><Ionicons name="swap-horizontal" size={16} color={colors.mutedForeground} /><Text style={styles.hintText}>Swipe left or right  ·  Tap to flip</Text></View>

      {/* Scrollable Bottom Section */}
      <View style={{ flex: 1 }}>
        <View style={styles.collectionRow}>
          <Text style={styles.collectionLabel}>ALL CARDS</Text>
          <Pressable onPress={() => setAddVisible(true)} style={({ pressed }) => [styles.addSmall, pressed && styles.pressed]}><Ionicons name="add" size={16} color={colors.primary} /><Text style={styles.addSmallText}>New card</Text></Pressable>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 14) + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.miniList}>
            {cards.map((card, index) => (
              <Pressable key={card.id} onPress={() => { setActiveIndex(index); setActiveId(card.id); setEditingCard(card); }} style={({ pressed }) => [styles.miniCard, activeId === card.id && { borderColor: colors.primary }, pressed && styles.pressed]}>
                <View style={[styles.miniIcon, { backgroundColor: card.color === 'green' ? colors.primary : colors.secondary }]}><MaterialCommunityIcons name={categoryIcons[card.category]} size={17} color={card.color === 'green' ? colors.ink : colors.foreground} /></View>
                <View style={{ flex: 1 }}><Text style={styles.miniTitle}>{card.title}</Text><Text style={styles.miniSubtitle}>{card.category} · {card.holder}</Text></View>
                {activeId === card.id ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : <Feather name="chevron-right" size={17} color={colors.mutedForeground} />}
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </View>
      <AddCardSheet visible={addVisible} onClose={() => setAddVisible(false)} />
      <SettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <EditCardSheet card={editingCard} onClose={() => setEditingCard(null)} />

      {/* Fullscreen barcode viewer backdrop */}
      {fullscreenBarcode && (
        <Modal transparent animationType="fade" visible={fullscreenBarcode !== null} onRequestClose={() => setFullscreenBarcode(null)}>
          <Pressable style={styles.fullscreenBarcodeScrim} onPress={() => setFullscreenBarcode(null)}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.fullscreenBarcodeCard}>
              <Text style={styles.fullscreenBarcodeLabel}>SCAN BARCODE</Text>
              <View style={styles.fullscreenBarcodeWrapper}>
                <Barcode 
                  value={fullscreenBarcode} 
                  height={130} 
                  color="#000000" 
                  scale={Math.min(SCREEN_WIDTH * 0.9, 400) > 350 ? 2.1 : 1.6} 
                />
              </View>
              <Text style={styles.fullscreenBarcodeValue}>{fullscreenBarcode}</Text>
              <Text style={styles.fullscreenBarcodeClose}>Tap anywhere to close</Text>
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090B0A' },
  ambientOrb: { position: 'absolute', top: 130, right: -90, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(112, 203, 139, 0.07)' },
  header: { paddingHorizontal: 20, paddingBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmarkDot: { width: 8, height: 8, borderRadius: 4 },
  wordmark: { color: '#F5F7F6', fontSize: 13, letterSpacing: 2.6, fontWeight: '700' },
  subtitle: { color: '#88958D', fontSize: 13, marginTop: 7, letterSpacing: 0.1 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(28, 38, 33, 0.76)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27332D' },
  pressed: { opacity: 0.68 },
  island: { marginHorizontal: 20, minHeight: 76, overflow: 'hidden', borderRadius: 23, borderWidth: 1, borderColor: '#343434', backgroundColor: 'rgba(29, 29, 29, 0.78)', padding: 14 },
  islandCompact: { height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#222222', backgroundColor: '#000000', paddingHorizontal: 12, justifyContent: 'center', alignItems: 'center', maxWidth: 160 },
  islandCompactContent: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  islandCompactRow: { flexDirection: 'row', alignItems: 'center', maxWidth: 110 },
  islandCompactTitle: { color: '#FFFFFF', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  liveDotCompact: { width: 6, height: 6, borderRadius: 3 },
  islandDropActive: { borderColor: '#70CB8B', backgroundColor: 'rgba(112, 203, 139, 0.15)' },
  islandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  islandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  islandEyebrow: { fontSize: 10, letterSpacing: 1.7, color: '#88958D', fontWeight: '700' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#656565' },
  islandCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  islandIcon: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  islandCardName: { color: '#F5F7F6', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  islandCardStatus: { color: '#88958D', fontSize: 11, marginTop: 2 },
  islandEmpty: { paddingTop: 9 },
  islandEmptyTitle: { color: '#D6E3DB', fontSize: 13, fontWeight: '600' },
  islandEmptyBody: { color: '#88958D', fontSize: 11, marginTop: 3 },
  heroHeading: { marginHorizontal: 20, marginTop: 38, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroKicker: { color: '#858581', fontSize: 10, letterSpacing: 2.1, fontWeight: '700' },
  heroTitle: { color: '#F5F7F6', fontSize: 33, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1, marginTop: 6 },
  countPill: { alignItems: 'flex-end', paddingBottom: 2 },
  countText: { color: '#F1F0EC', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  countLabel: { color: '#858581', fontSize: 9, letterSpacing: 1.7, marginTop: 1 },
  stackArea: { height: CARD_HEIGHT + 34, marginTop: 22, alignItems: 'center', justifyContent: 'flex-start' },
  stackGroup: { width: CARD_WIDTH, height: CARD_HEIGHT, alignItems: 'center', justifyContent: 'center' },
  stackCard: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.42, shadowRadius: 24, elevation: 10 },
  peekingCard: { shadowOpacity: 0.2, shadowRadius: 15 },
  cardPressable: { width: '100%', height: '100%' },
  cardLayer: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  cardBackLayer: { backfaceVisibility: 'hidden' },
  selectedRing: { position: 'absolute', inset: -3, borderWidth: 1, borderRadius: 28, opacity: 0.45 },
  cardFace: { flex: 1, borderRadius: 25, padding: 21, overflow: 'hidden' },
  cardGlow: { position: 'absolute', width: 210, height: 210, right: -80, top: -80, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.21)' },
  metalSheen: { position: 'absolute', top: -40, right: -90, width: 280, height: 110, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.18)', transform: [{ rotate: '-22deg' }] },
  metalEdge: { position: 'absolute', inset: 0, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,0.48)' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 31, height: 31, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardMicro: { fontSize: 9, letterSpacing: 1.8, fontWeight: '700' },
  nfcMark: { marginLeft: 'auto', transform: [{ rotate: '90deg' }], opacity: 0.75 },
  cardMiddle: { marginTop: 'auto', marginBottom: 23 },
  cardTitle: { fontSize: 22, fontWeight: '700', letterSpacing: 0.7 },
  institution: { fontSize: 10, marginTop: 5, letterSpacing: 0.2 },
  cardBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  cardLabel: { fontSize: 8, fontWeight: '700', letterSpacing: 1.2, marginBottom: 3 },
  holder: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2 },
  chip: { width: 35, height: 25, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(11,11,11,0.34)', padding: 4, gap: 3, justifyContent: 'center' },
  chipLine: { height: 1, backgroundColor: 'rgba(11,11,11,0.26)' },
  magStripe: { position: 'absolute', top: 48, left: 0, right: 0, height: 42 },
  backContent: { flex: 1, justifyContent: 'flex-end' },
  backTopline: { position: 'absolute', top: 1, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  barcode: { paddingVertical: 10, paddingHorizontal: 12 },
  barcodeBars: { height: 31, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 2 },
  barcodeValue: { fontSize: 10, textAlign: 'center', marginTop: 6, letterSpacing: 2.2, fontWeight: '600' },
  barcodeCompact: { height: 37, marginTop: 10, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: 'rgba(11, 11, 11, 0.1)', borderRadius: 8 },
  bar: { minWidth: 1, borderRadius: 0.5 },
  qr: { width: 34, height: 34, padding: 3, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  qrCell: { width: 2.65, height: 2.65 },
  backBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  backNumber: { fontSize: 14, fontWeight: '700', letterSpacing: 1.4 },
  backDetail: { fontSize: 9, fontWeight: '600' },
  stackHint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 9 },
  hintText: { color: '#858581', fontSize: 11, letterSpacing: 0.2 },
  collectionRow: { marginHorizontal: 20, marginTop: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collectionLabel: { color: '#858581', fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  addSmall: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5 },
  addSmallText: { color: '#F1F0EC', fontSize: 12, fontWeight: '600' },
  miniList: { marginHorizontal: 20, marginTop: 12, gap: 9 },
  miniCard: { minHeight: 62, borderRadius: 17, borderWidth: 1, borderColor: '#2B2B2B', backgroundColor: 'rgba(21, 21, 21, 0.82)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  miniIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  miniTitle: { color: '#E9F1EC', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  miniSubtitle: { color: '#78857D', fontSize: 11, marginTop: 3 },
  dragIndicatorOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', zIndex: 100, backgroundColor: 'rgba(0, 0, 0, 0.25)', borderRadius: 25, overflow: 'hidden' },
  dragIndicatorBlur: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.38)', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  dragIndicatorText: { color: '#000000', fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  islandExpandedCompact: { marginHorizontal: 20, marginTop: 10, padding: 12, borderRadius: 16, backgroundColor: 'rgba(23, 23, 23, 0.92)', borderWidth: 1, borderColor: '#363636', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  islandExpandedLeft: { flex: 1, justifyContent: 'center' },
  islandExpandedRight: { width: 130, justifyContent: 'center' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  liveText: { color: '#88958D', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  islandExpandedTitle: { color: '#F5F7F6', fontSize: 13, fontWeight: '700', letterSpacing: 0.3 },
  islandExpandedCategory: { color: '#88958D', fontSize: 10, marginTop: 2 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { height: '92%', backgroundColor: '#101613', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#293A2F', paddingTop: 11 },
  sheetHandle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: '#4B5A51', marginBottom: 18 },
  sheetHeader: { paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sheetEyebrow: { color: '#6C7A72', fontSize: 9, letterSpacing: 1.9, fontWeight: '700' },
  sheetTitle: { color: '#F5F7F6', fontSize: 24, fontWeight: '700', letterSpacing: -0.6, marginTop: 5 },
  formContent: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 10 },
  previewWrap: { marginBottom: 22 },
  previewCard: { height: 150, marginTop: 10, borderRadius: 19, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  sectionLabel: { color: '#6C7A72', fontSize: 9, letterSpacing: 1.8, fontWeight: '700' },
  field: { marginTop: 14 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldLabel: { color: '#849189', fontSize: 9, letterSpacing: 1.25, fontWeight: '700', marginBottom: 7 },
  input: { height: 46, borderRadius: 13, borderWidth: 1, paddingHorizontal: 13, fontSize: 14 },
  chips: { gap: 8, paddingVertical: 12 },
  categoryChip: { height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#29352E', backgroundColor: '#171F1B', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryChipText: { color: '#B7C4BB', fontSize: 11, fontWeight: '600' },
  saveButton: { marginTop: 17, height: 53, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  saveButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  emptyStack: { height: CARD_HEIGHT, width: CARD_WIDTH, borderRadius: 25, borderWidth: 1, borderColor: '#29352E', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(18,23,21,0.55)' },
  emptyTitle: { color: '#D6E3DB', marginTop: 12, fontWeight: '700', fontSize: 15 },
  emptyBody: { color: '#78857D', marginTop: 4, fontSize: 12 },
  settingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'rgba(21, 21, 21, 0.4)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#2B2B2B', marginHorizontal: 20, marginBottom: 12 },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center' },
  settingsRowTitle: { color: '#E9F1EC', fontSize: 13, fontWeight: '700' },
  settingsRowSub: { color: '#78857D', fontSize: 11, marginTop: 3 },
  statsCard: { flexDirection: 'row', backgroundColor: 'rgba(21, 21, 21, 0.4)', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#2B2B2B', marginHorizontal: 20, marginBottom: 12 },
  statsItem: { flex: 1, alignItems: 'center' },
  statsValue: { color: '#70CB8B', fontSize: 24, fontWeight: '700' },
  statsLabel: { color: '#88958D', fontSize: 11, marginTop: 4 },
  statsDivider: { width: 1, backgroundColor: '#2B2B2B', marginVertical: 4 },
  securityBanner: { flexDirection: 'row', backgroundColor: 'rgba(112, 203, 139, 0.08)', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(112, 203, 139, 0.2)', marginHorizontal: 20, marginBottom: 12 },
  securityTitle: { color: '#70CB8B', fontSize: 13, fontWeight: '700' },
  securityText: { color: '#88958D', fontSize: 11, marginTop: 4, lineHeight: 16 },
  aboutBox: { backgroundColor: 'rgba(21, 21, 21, 0.4)', borderRadius: 16, borderWidth: 1, borderColor: '#2B2B2B', marginHorizontal: 20, marginBottom: 12 },
  aboutRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  aboutLabel: { color: '#78857D', fontSize: 12 },
  aboutVal: { color: '#E9F1EC', fontSize: 12, fontWeight: '600' },
  aboutDivider: { height: 1, backgroundColor: '#2B2B2B' },
  editActionRow: { flexDirection: 'row', gap: 10, marginTop: 17, marginBottom: 10 },
  deleteButton: { flex: 1, height: 53, borderRadius: 17, borderWidth: 1, borderColor: '#FF5A5A', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  deleteButtonText: { color: '#FF5A5A', fontSize: 14, fontWeight: '700' },
  saveChangesButton: { flex: 1.5, height: 53, borderRadius: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  saveChangesButtonText: { fontSize: 14, fontWeight: '700', letterSpacing: 0.2 },
  bankBackContent: { flex: 1, paddingVertical: 14 },
  signatureRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 14, gap: 10 },
  signatureStrip: { flex: 1, height: 32, justifyContent: 'center', paddingHorizontal: 10, borderRadius: 4 },
  signatureStripText: { fontStyle: 'italic', fontSize: 9, color: '#88958D', fontWeight: '600' },
  cvvBox: { width: 50, height: 32, justifyContent: 'center', alignItems: 'center', borderRadius: 4 },
  cvvLabel: { fontSize: 7, color: '#88958D', fontWeight: '700', position: 'absolute', top: 2 },
  cvvText: { fontSize: 11, fontWeight: '700', color: '#F5F7F6', letterSpacing: 0.5, marginTop: 7 },
  bankInfoBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: 20, marginTop: 'auto', marginBottom: 10 },
  bankInfoLeft: { flex: 1 },
  bankNumberLabel: { fontSize: 8, color: '#88958D', fontWeight: '700', letterSpacing: 1 },
  bankNumberText: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5, marginVertical: 4, fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace' },
  bankRow: { flexDirection: 'row', marginTop: 4 },
  bankDetailLabel: { fontSize: 7, color: '#88958D', fontWeight: '700', letterSpacing: 0.5 },
  bankDetailText: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  revealEyeBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#343E38' },
  idBackContent: { flex: 1, padding: 20, justifyContent: 'space-between' },
  idBackHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  idBackDetails: { marginVertical: 14 },
  idDetailRow: { borderBottomWidth: 1, borderBottomColor: '#2B2B2B', paddingBottom: 6 },
  idDetailLabel: { fontSize: 8, color: '#88958D', fontWeight: '700', letterSpacing: 1 },
  idDetailValue: { fontSize: 12, fontWeight: '700', marginTop: 4, letterSpacing: 0.3 },
  idLargeBarcodeWrap: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF', padding: 8, borderRadius: 10, marginTop: 'auto' },
  largeBarcodeBackContent: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 },
  largeBarcodeHeader: { fontSize: 8, letterSpacing: 2, fontWeight: '700', color: '#6C7A72', marginBottom: 6 },
  largeBarcodeWrapper: { padding: 10, backgroundColor: '#FFFFFF', borderRadius: 12, width: '100%', alignItems: 'center', justifyContent: 'center' },
  largeBarcodeFooter: { fontSize: 12, letterSpacing: 1.5, fontWeight: '700', color: '#171F1B', marginTop: 6 },
  errorLabel: {
    color: '#FF5A5A',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
  islandSecureDetails: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  islandSecureHeader: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8C8C8C',
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  islandDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  islandDetailLabel: {
    fontSize: 9,
    color: '#8C8C8C',
    fontWeight: '700',
  },
  islandDetailValue: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  islandDetailNotes: {
    fontSize: 11,
    color: '#D0D0D0',
    lineHeight: 15,
  },
  fullscreenBarcodeScrim: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.88)',
  },
  fullscreenBarcodeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
  fullscreenBarcodeLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8C8C8C',
    letterSpacing: 2,
    marginBottom: 16,
  },
  fullscreenBarcodeWrapper: {
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullscreenBarcodeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 2,
    marginTop: 16,
  },
  fullscreenBarcodeClose: {
    fontSize: 11,
    color: '#8C8C8C',
    fontWeight: '600',
    marginTop: 12,
  },
  colorPickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    marginTop: 8,
    marginBottom: 16,
  },
  colorSwatch: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  colorSwatchActive: {
    borderColor: '#FFFFFF',
    borderWidth: 2.5,
    transform: [{ scale: 1.15 }],
  },
});
