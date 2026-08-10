import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Pressable,
  Animated,
  PanResponder,
  Dimensions,
  Keyboard,
  Platform,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCardVault, VaultCard, CardCategory } from '@/context/CardVaultContext';
import { useColors } from '@/hooks/useColors';
import { ModernCardFace, ModernBarcode } from './ModernCardFace';
import { ModernAddCardSheet } from './ModernAddCardSheet';
import { ModernEditCardSheet } from './ModernEditCardSheet';
import { ModernSettingsSheet } from './ModernSettingsSheet';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 330);
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

// Frosted glass button
function ModernGlassButton({
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
  return (
    <Pressable
      onPress={() => {
        void Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        styles.iconButton,
        active && { backgroundColor: '#FFFFFF' },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name={icon} size={20} color={active ? '#000000' : '#FFFFFF'} />
    </Pressable>
  );
}

// Active Island Target
function ActiveIsland({
  card,
  onPress,
  isDragging = false,
  onDrop,
  onClear,
}: {
  card: VaultCard | null;
  onPress: () => void;
  isDragging?: boolean;
  onDrop?: () => void;
  onClear?: () => void;
}) {
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
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.islandHeader}>
        <View style={styles.islandTitleRow}>
          <View style={[styles.liveDot, card && { backgroundColor: '#FFFFFF' }]} />
          <Text style={styles.islandEyebrow}>ACTIVE CARD</Text>
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
          <Ionicons name="shield-checkmark" size={14} color="#8C8C8C" />
        )}
      </View>
      {card ? (
        <View>
          <View style={styles.islandCardRow}>
            <View style={styles.islandIcon}>
              <MaterialCommunityIcons name={categoryIcons[card.category]} size={14} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.islandCardName} numberOfLines={1}>{card.title}</Text>
              <Text style={styles.islandCardStatus}>{isDragging ? 'Release to activate' : 'Tap to edit secure details'}</Text>
            </View>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          </View>
          
          {/* Secure details display within Active Island container (Hidden from 3D card graphical faces) */}
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
          <Text style={styles.islandEmptyTitle}>{isDragging ? 'RELEASE TO DEPOSIT' : 'No card active'}</Text>
          <Text style={styles.islandEmptyBody}>Drag a card here from the stack below</Text>
        </View>
      )}
    </Pressable>
  );
}

// Draggable 3D Stack Card Item
function VaultCardView({
  card,
  index,
  selected,
  swipeDirection,
  onPress,
  onDrop,
  onHorizontalSwipe,
  onDropTarget,
  onDragState,
  onBarcodePress,
  totalCards,
}: {
  card: VaultCard;
  index: number;
  selected: boolean;
  swipeDirection: 'left' | 'right' | null;
  onPress: () => void;
  onDrop: () => void;
  onHorizontalSwipe: (direction: 1 | -1) => void;
  onDropTarget: () => void;
  onDragState: (dragging: boolean) => void;
  onBarcodePress?: (value: string) => void;
  totalCards: number;
}) {
  const [flipped, setFlipped] = useState(false);
  const [isAnimatingToBack, setIsAnimatingToBack] = useState(false);
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const [isInDropZone, setIsInDropZone] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  const spacingStep = Math.max(10, Math.min(22, 44 / Math.max(2, totalCards)));
  const fannedScale = useRef(new Animated.Value(1 - Math.min(index, 3) * 0.045)).current;
  const fannedTranslateX = useRef(new Animated.Value(Math.min(index, 3) * spacingStep)).current;
  const fannedTranslateY = useRef(new Animated.Value(Math.min(index, 3) * -spacingStep)).current;

  useEffect(() => {
    const targetScale = 1 - Math.min(index, 3) * 0.045;
    const targetX = Math.min(index, 3) * spacingStep;
    const targetY = Math.min(index, 3) * -spacingStep;

    Animated.parallel([
      Animated.spring(fannedScale, {
        toValue: targetScale,
        damping: 22,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(fannedTranslateX, {
        toValue: targetX,
        damping: 22,
        stiffness: 160,
        mass: 0.8,
        useNativeDriver: true,
      }),
      Animated.spring(fannedTranslateY, {
        toValue: targetY,
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

  // Float animation for front card
  const floatValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (index === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(floatValue, {
            toValue: 1,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(floatValue, {
            toValue: 0,
            duration: 2500,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      floatValue.setValue(0);
    }
  }, [index]);

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
      onMoveShouldSetPanResponder: (_, gesture) =>
        indexRef.current === 0 && (Math.abs(gesture.dx) > 8 || Math.abs(gesture.dy) > 8),
      onPanResponderGrant: () => {
        Animated.spring(scale, {
          toValue: 0.8,
          useNativeDriver: true,
          speed: 22,
          bounciness: 8,
        }).start();
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
            Animated.timing(translateX, { toValue: -SCREEN_WIDTH, duration: 200, useNativeDriver: true }),
            Animated.timing(scale, { toValue: 1.05, duration: 200, useNativeDriver: true }),
          ]).start(() => {
            translateX.setValue(-SCREEN_WIDTH);
            scale.setValue(1.05);
            callbacksRef.current.onHorizontalSwipe(1);

            // 1-frame delay (16ms) to let native animation drivers reset and prevent lockup
            setTimeout(() => {
              Animated.spring(translateX, { toValue: 0, damping: 16, stiffness: 120, useNativeDriver: true }).start();
              Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 120, useNativeDriver: true }).start();
              Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 120, useNativeDriver: true }).start(() => {
                setIsAnimatingToBack(false);
                callbacksRef.current.onDragState(false);
              });
            }, 16);
          });
        } else if (gesture.dx > horizontalThreshold && Math.abs(gesture.dx) > Math.abs(gesture.dy)) {
          setIsAnimatingToBack(true);
          callbacksRef.current.onDragState(true);
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, damping: 16, stiffness: 120, useNativeDriver: true }),
            Animated.spring(scale, { toValue: 1, damping: 16, stiffness: 120, useNativeDriver: true }),
            Animated.spring(translateY, { toValue: 0, damping: 16, stiffness: 120, useNativeDriver: true }),
          ]).start(() => {
            setIsAnimatingToBack(false);
            callbacksRef.current.onDragState(false);
          });
          
          callbacksRef.current.onHorizontalSwipe(-1); // Pull card back to front
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
            Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
          ]).start(() => callbacksRef.current.onDragState(false));
        }
      },
      onPanResponderTerminate: () => {
        setIsLocalDragging(false);
        setInDropZone(false);
        Animated.parallel([
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, speed: 20, bounciness: 6 }),
          Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 6 }),
        ]).start(() => callbacksRef.current.onDragState(false));
      },
    })
  ).current;

  const flip = () => {
    void Haptics.selectionAsync();
    const next = flipped ? 0 : 180;
    Animated.timing(rotateY, { toValue: next, duration: 520, useNativeDriver: true }).start();
    setFlipped((val) => !val);
  };

  const frontOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [1, 0, 0] });
  const backOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [0, 0, 1] });

  const frontRotateY = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['-22deg', '158deg'] });
  const backRotateY = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['158deg', '338deg'] });

  const floatingOffsetY = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  const isVisible = index <= 3 || isAnimatingToBack;
  const opacity = isVisible ? 1 : 0;

  const dragRotateZ = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-10deg', '-4deg', '8deg'],
  });

  const animatedScale = Animated.multiply(fannedScale, scale);

  // Combine translations to prevent native driver transform dropouts on iOS
  const animatedTranslateX = Animated.add(translateX, fannedTranslateX);
  const baseTranslateY = Animated.add(translateY, fannedTranslateY);
  const animatedTranslateY = index === 0 
    ? Animated.add(baseTranslateY, floatingOffsetY)
    : baseTranslateY;

  let zIndex = 30 - index;
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
            { perspective: 1200 },
            { rotateX: '18deg' },
            { rotateZ: index === 0 ? dragRotateZ : '-4deg' },
            { translateX: animatedTranslateX },
            { translateY: animatedTranslateY },
            { scale: animatedScale },
          ],
        },
      ]}
    >
      <Pressable onPress={flip} style={styles.cardPressable} accessibilityRole="button">
        <Animated.View style={[styles.cardLayer, { opacity: frontOpacity, transform: [{ rotateY: frontRotateY }] }]}>
          <ModernCardFace card={card} back={false} onBarcodePress={onBarcodePress} />
        </Animated.View>
        <Animated.View style={[styles.cardLayer, styles.cardBackLayer, { opacity: backOpacity, transform: [{ rotateY: backRotateY }] }]}>
          <ModernCardFace card={card} back onBarcodePress={onBarcodePress} />
        </Animated.View>
      </Pressable>

      {isLocalDragging && (
        <View style={[styles.dragIndicatorOverlay, isInDropZone && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]} pointerEvents="none">
          <BlurView intensity={30} tint="dark" style={[styles.dragIndicatorBlur, isInDropZone && { borderColor: '#FFFFFF' }]}>
            <MaterialCommunityIcons name={isInDropZone ? "check-circle-outline" : "card-bulleted-outline"} size={20} color="#FFFFFF" />
            <Text style={styles.dragIndicatorText}>{isInDropZone ? "RELEASE TO DEPOSIT" : "DRAGGING CARD"}</Text>
          </BlurView>
        </View>
      )}
    </Animated.View>
  );
}

export function ModernHomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cards, activeId, setActiveId } = useCardVault();

  // Modal sheets visibility
  const [addVisible, setAddVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [editingCard, setEditingCard] = useState<VaultCard | null>(null);

  // Active stack index, island visibility and gesture states
  const [activeIndex, setActiveIndex] = useState(0);
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
    <View style={[styles.screen, { paddingTop: Math.max(insets.top || 0, Platform.OS === 'web' ? 67 : 12) }]}>
      {/* Absolute Dark Background Linear Gradient (Matches Classic UI backdrop format) */}
      <LinearGradient
        colors={['#0F1115', '#050608', '#000000']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Immersive space-blue ambient spotlight glow behind card stack */}
      <View style={styles.ambientSpotlight} pointerEvents="none" />

      {/* Header */}
      <View style={[styles.header, { zIndex: 10 }]}>
        <View>
          <View style={styles.wordmarkRow}>
            <View style={styles.wordmarkDot} />
            <Text style={styles.wordmark}>CARDVAULT</Text>
          </View>
          <Text style={styles.subtitle}>Your cards, one tap away</Text>
        </View>
        <View style={styles.headerActions}>
          <ModernGlassButton
            icon={islandExpanded ? "eye-outline" : "eye-off-outline"}
            onPress={() => setIslandExpanded((val) => !val)}
            label="Toggle active card visibility"
          />
          <ModernGlassButton
            icon="settings-outline"
            onPress={() => setSettingsVisible(true)}
            label="Open settings"
          />
        </View>
      </View>

      {/* Active Card Drop Target */}
      {islandExpanded && (
        <View style={{ marginBottom: 12, zIndex: 10 }}>
          <ActiveIsland
            card={activeCard}
            isDragging={isDragging}
            onDrop={handleDropTarget}
            onPress={() => { if (activeCard) setEditingCard(activeCard); }}
            onClear={() => setActiveId(null)}
          />
        </View>
      )}

      {/* Collection Hero Heading */}
      <View style={[styles.heroHeading, { zIndex: 10 }]}>
        <View>
          <Text style={styles.heroKicker}>YOUR COLLECTION</Text>
          <Text style={styles.heroTitle}>The vault</Text>
        </View>
        <View style={styles.countPill}>
          <Text style={styles.countText}>{String(cards.length).padStart(2, '0')}</Text>
          <Text style={styles.countLabel}>CARDS</Text>
        </View>
      </View>

      {/* Centerpiece 3D Card Stack Area */}
      <View style={[styles.stackArea, { zIndex: 10 }]}>
        <View style={styles.stackGroup}>
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
            <View style={styles.emptyStack}>
              <MaterialCommunityIcons name="cards-outline" size={34} color="#8C8C8C" />
              <Text style={styles.emptyTitle}>Your vault is waiting</Text>
              <Text style={styles.emptyBody}>Add your first card below.</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stack Hint */}
      <View style={styles.stackHint}>
        <Ionicons name="swap-horizontal" size={16} color="#8C8C8C" />
        <Text style={styles.hintText}>Swipe left or right  ·  Tap to flip</Text>
      </View>

      {/* Scrollable Inventory List */}
      <View style={{ flex: 1, zIndex: 10 }}>
        <View style={styles.collectionRow}>
          <Text style={styles.collectionLabel}>ALL CARDS</Text>
          <Pressable
            onPress={() => setAddVisible(true)}
            style={({ pressed }) => [styles.addSmall, pressed && styles.pressed]}
          >
            <Ionicons name="add" size={16} color="#FFFFFF" />
            <Text style={styles.addSmallText}>New card</Text>
          </Pressable>
        </View>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 14) + 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.miniList}>
            {cards.map((card, index) => {
              const isActive = activeId === card.id;
              return (
                <Pressable
                  key={card.id}
                  onPress={() => {
                    void Haptics.selectionAsync();
                    setActiveIndex(index);
                    setActiveId(card.id);
                    setEditingCard(card);
                  }}
                  style={({ pressed }) => [
                    styles.miniCard,
                    isActive && { borderColor: '#FFFFFF' },
                    pressed && styles.pressed
                  ]}
                >
                  <View style={[styles.miniIcon, { backgroundColor: isActive ? '#FFFFFF' : '#0A0A0A' }]}>
                    <MaterialCommunityIcons
                      name={categoryIcons[card.category]}
                      size={17}
                      color={isActive ? '#000000' : '#FFFFFF'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.miniTitle}>{card.title}</Text>
                    <Text style={styles.miniSubtitle}>{card.category} · {card.holder}</Text>
                  </View>
                  {isActive ? (
                    <Ionicons name="checkmark-circle" size={19} color="#FFFFFF" />
                  ) : (
                    <Feather name="chevron-right" size={17} color="#8C8C8C" />
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Sheets Integration */}
      <ModernAddCardSheet visible={addVisible} onClose={() => setAddVisible(false)} />
      <ModernSettingsSheet visible={settingsVisible} onClose={() => setSettingsVisible(false)} />
      <ModernEditCardSheet card={editingCard} onClose={() => setEditingCard(null)} />

      {/* Fullscreen Barcode Modal Overlay */}
      {fullscreenBarcode && (() => {
        const barcodeBaseWidth = (fullscreenBarcode.length + 2) * 13.5;
        const containerMaxWidth = Math.min(SCREEN_WIDTH * 0.9, 400);
        const maxAvailableWidth = containerMaxWidth - 80;
        const computedScale = Math.max(1.0, Math.min(2.2, maxAvailableWidth / barcodeBaseWidth));

        return (
          <View style={[StyleSheet.absoluteFill, { zIndex: 9999 }]}>
            <Pressable 
              style={StyleSheet.absoluteFill} 
              onPress={() => setFullscreenBarcode(null)}
              accessibilityLabel="Close Fullscreen Barcode"
            >
              <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.fullscreenBarcodeOverlay} pointerEvents="none">
                <View style={styles.fullscreenBarcodeContainer}>
                  <Text style={styles.fullscreenBarcodeHeader}>SCAN BARCODE</Text>
                  <View style={styles.fullscreenBarcodeWrapper}>
                    <ModernBarcode value={fullscreenBarcode} height={110} scale={computedScale} />
                  </View>
                  <Text style={styles.fullscreenBarcodeFooter}>ID: {fullscreenBarcode}</Text>
                  <Text style={styles.fullscreenBarcodeTip}>Tap anywhere to dismiss</Text>
                </View>
              </View>
            </Pressable>
          </View>
        );
      })()}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  ambientSpotlight: {
    position: 'absolute',
    top: 80,
    left: (SCREEN_WIDTH - 300) / 2,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(110, 140, 255, 0.12)', // richer color saturation
    // iOS Shadow Glow
    shadowColor: '#6E8CFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22, // stronger shadow intensity
    shadowRadius: 65,    // wider feather bounds
    // Android Elevation
    elevation: 4,
    zIndex: -1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  wordmarkDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  wordmark: {
    color: '#FFFFFF',
    fontSize: 13,
    letterSpacing: 2.6,
    fontWeight: '700'
  },
  subtitle: {
    color: '#8C8C8C',
    fontSize: 13,
    marginTop: 7,
    letterSpacing: 0.1
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  pressed: {
    opacity: 0.68
  },
  island: {
    marginHorizontal: 20,
    height: 76,
    overflow: 'hidden',
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: 'rgba(10, 10, 10, 0.72)',
    padding: 14
  },
  islandDropActive: {
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  islandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  islandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7
  },
  islandEyebrow: {
    fontSize: 9,
    letterSpacing: 1.8,
    color: '#8C8C8C',
    fontWeight: '700'
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333'
  },
  islandCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 10
  },
  islandIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  islandCardName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  islandCardStatus: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 2
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
  islandEmpty: {
    paddingTop: 8
  },
  islandEmptyTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  islandEmptyBody: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 3
  },
  heroHeading: {
    marginHorizontal: 20,
    marginTop: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  heroKicker: {
    color: '#8C8C8C',
    fontSize: 10,
    letterSpacing: 2.1,
    fontWeight: '700'
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 33,
    lineHeight: 39,
    fontWeight: '700',
    letterSpacing: -1.1,
    marginTop: 6
  },
  countPill: {
    alignItems: 'flex-end',
    paddingBottom: 2
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1
  },
  countLabel: {
    color: '#8C8C8C',
    fontSize: 9,
    letterSpacing: 1.7,
    marginTop: 1
  },
  stackArea: {
    height: CARD_HEIGHT + 34,
    marginTop: 22,
    alignItems: 'center',
    justifyContent: 'flex-start'
  },
  stackGroup: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -16,
  },
  stackCard: {
    position: 'absolute',
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.52,
    shadowRadius: 20,
    elevation: 12
  },
  cardPressable: {
    width: '100%',
    height: '100%'
  },
  cardLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    backgroundColor: '#050608', // Solid backing to prevent see-through bleed
    borderRadius: 20,
  },
  cardBackLayer: {
    backfaceVisibility: 'hidden',
    backgroundColor: '#050608', // Solid backing to prevent see-through bleed
    borderRadius: 20,
  },
  dragIndicatorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    overflow: 'hidden',
  },
  dragIndicatorBlur: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  dragIndicatorText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  emptyStack: {
    height: CARD_HEIGHT,
    width: CARD_WIDTH,
    borderRadius: 20,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0A0A0A',
  },
  emptyTitle: {
    color: '#FFFFFF',
    marginTop: 12,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyBody: {
    color: '#8C8C8C',
    marginTop: 4,
    fontSize: 12,
  },
  stackHint: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 10,
  },
  hintText: {
    color: '#8C8C8C',
    fontSize: 11,
    letterSpacing: 0.2
  },
  collectionRow: {
    marginHorizontal: 20,
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  collectionLabel: {
    color: '#8C8C8C',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '700'
  },
  addSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    padding: 5
  },
  addSmallText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  miniList: {
    marginHorizontal: 20,
    marginTop: 12,
    gap: 9
  },
  miniCard: {
    minHeight: 62,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11
  },
  miniIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.1)'
  },
  miniTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4
  },
  miniSubtitle: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 3
  },
  fullscreenBarcodeOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  fullscreenBarcodeContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 35,
    paddingHorizontal: 25,
    alignItems: 'center',
    justifyContent: 'center',
    // Elegant soft shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 25,
    elevation: 24,
  },
  fullscreenBarcodeHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: '#666666',
    letterSpacing: 3,
    marginBottom: 20,
  },
  fullscreenBarcodeWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 15,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 16,
  },
  fullscreenBarcodeFooter: {
    fontSize: 14,
    fontWeight: '700',
    color: '#222222',
    letterSpacing: 2,
    marginTop: 18,
  },
  fullscreenBarcodeTip: {
    fontSize: 10,
    fontWeight: '600',
    color: '#999999',
    letterSpacing: 1,
    marginTop: 25,
  },
});
