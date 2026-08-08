import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { CardCategory, CardVaultProvider, useCardVault, VaultCard } from '@/context/CardVaultContext';

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

function Barcode({ value, compact = false }: { value: string; compact?: boolean }) {
  const colors = useColors();
  const bars = useMemo(() => {
    const source = value || '102306233';
    return Array.from({ length: compact ? 32 : 54 }, (_, index) => {
      const code = source.charCodeAt(index % source.length);
      return 1 + ((code + index * 3) % (compact ? 2 : 3));
    });
  }, [value, compact]);

  return (
    <View style={[styles.barcode, compact && styles.barcodeCompact]}>
      <View style={styles.barcodeBars}>
        {bars.map((bar, index) => (
          <View
            key={`${bar}-${index}`}
            style={[
              styles.bar,
              { width: bar, backgroundColor: compact ? colors.ink : colors.foreground },
              index % 7 === 0 && { marginRight: compact ? 2 : 4 },
            ]}
          />
        ))}
      </View>
      {!compact && <Text style={[styles.barcodeValue, { color: colors.foreground }]}>{value || '102306233'}</Text>}
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

function CardFace({ card, back }: { card: VaultCard; back: boolean }) {
  const colors = useColors();
  const gradient = {
    green: [colors.primary, '#5AB67C'] as const,
    lavender: ['#D8C6F2', '#9386C5'] as const,
    blue: ['#B7DCE2', '#608D99'] as const,
    orange: ['#F1C29B', '#A66D4E'] as const,
    graphite: ['#68756E', '#27332D'] as const,
  }[card.color];

  if (back) {
    return (
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFace}>
        <View style={[styles.magStripe, { backgroundColor: 'rgba(7, 16, 11, 0.62)' }]} />
        <View style={styles.backContent}>
          <View style={styles.backTopline}>
            <Text style={[styles.cardMicro, { color: colors.ink }]}>CARDVAULT / SECURE VIEW</Text>
            <FauxQr value={card.barcode} />
          </View>
          <Barcode value={card.barcode} />
          <View style={styles.backBottom}>
            <Text style={[styles.backNumber, { color: colors.ink }]}>{card.number}</Text>
            <Text style={[styles.backDetail, { color: 'rgba(7, 16, 11, 0.72)' }]}>Tap to return</Text>
          </View>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardFace}>
      <View style={styles.cardGlow} />
      <View style={styles.cardTop}>
        <View style={[styles.brandMark, { backgroundColor: 'rgba(7, 16, 11, 0.15)' }]}>
          <MaterialCommunityIcons name={categoryIcons[card.category]} size={18} color={colors.ink} />
        </View>
        <Text style={[styles.cardMicro, { color: colors.ink }]}>{card.category.toUpperCase()}</Text>
        <View style={styles.nfcMark}><Ionicons name="wifi" size={16} color={colors.ink} /></View>
      </View>
      <View style={styles.cardMiddle}>
        <Text numberOfLines={1} style={[styles.cardTitle, { color: colors.ink }]}>{card.title}</Text>
        <Text numberOfLines={1} style={[styles.institution, { color: 'rgba(7, 16, 11, 0.63)' }]}>{card.institution}</Text>
      </View>
      <View style={styles.cardBottom}>
        <View>
          <Text style={[styles.cardLabel, { color: 'rgba(7, 16, 11, 0.58)' }]}>CARDHOLDER</Text>
          <Text style={[styles.holder, { color: colors.ink }]}>{card.holder}</Text>
        </View>
        <View style={styles.chip}>
          <View style={styles.chipLine} /><View style={styles.chipLine} /><View style={styles.chipLine} />
        </View>
      </View>
    </LinearGradient>
  );
}

function VaultCardView({
  card,
  onPress,
  onDrop,
  index,
  selected,
}: {
  card: VaultCard;
  onPress: () => void;
  onDrop: () => void;
  index: number;
  selected: boolean;
}) {
  const colors = useColors();
  const [flipped, setFlipped] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => index === 0,
      onMoveShouldSetPanResponder: (_, gesture) => index === 0 && Math.abs(gesture.dx) > 8,
      onPanResponderGrant: () => {
        Animated.spring(scale, { toValue: 1.04, useNativeDriver: true, speed: 22, bounciness: 8 }).start();
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderMove: (_, gesture) => translateX.setValue(gesture.dx),
      onPanResponderRelease: (_, gesture) => {
        const threshold = SCREEN_WIDTH * 0.22;
        if (Math.abs(gesture.dx) > threshold) {
          Animated.timing(translateX, { toValue: gesture.dx > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH, duration: 180, useNativeDriver: true }).start(() => {
            onDrop();
            translateX.setValue(0);
            scale.setValue(1);
          });
        } else {
          Animated.parallel([
            Animated.spring(translateX, { toValue: 0, useNativeDriver: true, speed: 18, bounciness: 7 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 7 }),
          ]).start();
        }
      },
    }),
  ).current;

  const flip = () => {
    void Haptics.selectionAsync();
    const next = flipped ? 0 : 180;
    Animated.timing(rotateY, { toValue: next, duration: 520, useNativeDriver: true }).start();
    setFlipped((value) => !value);
    onPress();
  };

  const frontOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [1, 0, 0] });
  const backOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [0, 0, 1] });
  const frontRotate = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['0deg', '180deg'] });
  const backRotate = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['180deg', '360deg'] });

  return (
    <Animated.View
      {...pan.panHandlers}
      style={[
        styles.stackCard,
        { zIndex: 20 - index, transform: [{ translateY: index * 12 }, { translateX }, { scale }] },
        index > 0 && styles.peekingCard,
      ]}
    >
      <Pressable onPress={flip} style={styles.cardPressable} accessibilityRole="button" accessibilityLabel={`${card.title}, tap to flip`}>
        <Animated.View style={[styles.cardLayer, { opacity: frontOpacity, transform: [{ perspective: 1000 }, { rotateY: frontRotate }] }]}>
          <CardFace card={card} back={false} />
        </Animated.View>
        <Animated.View style={[styles.cardLayer, styles.cardBackLayer, { opacity: backOpacity, transform: [{ perspective: 1000 }, { rotateY: backRotate }] }]}>
          <CardFace card={card} back />
        </Animated.View>
      </Pressable>
      {selected && <View style={[styles.selectedRing, { borderColor: colors.primary }]} pointerEvents="none" />}
    </Animated.View>
  );
}

function ActiveIsland({ card, onPress }: { card: VaultCard | null; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.island, pressed && styles.pressed]} accessibilityRole="button" accessibilityLabel="Active Island Card">
      <BlurView intensity={42} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.islandHeader}>
        <View style={styles.islandTitleRow}>
          <View style={[styles.liveDot, card && { backgroundColor: colors.primary }]} />
          <Text style={styles.islandEyebrow}>ACTIVE ISLAND</Text>
        </View>
        <Ionicons name="arrow-up-right-box" size={16} color={colors.mutedForeground} />
      </View>
      {card ? (
        <View style={styles.islandCardRow}>
          <View style={[styles.islandIcon, { backgroundColor: colors.primary }]}>
            <MaterialCommunityIcons name={categoryIcons[card.category]} size={15} color={colors.ink} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.islandCardName} numberOfLines={1}>{card.title}</Text>
            <Text style={styles.islandCardStatus}>Ready to reveal</Text>
          </View>
          <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
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

  const canSave = title.trim().length > 1 && holder.trim().length > 1;
  const previewCard: VaultCard = {
    id: 'preview',
    title: title.toUpperCase() || 'YOUR CARD',
    holder: holder || 'Your name',
    institution: 'A new card in your vault',
    number: number || '0000 0000',
    barcode: barcode || '102306233',
    category,
    color: 'green',
  };

  const closeAndReset = () => {
    Keyboard.dismiss();
    setTitle('');
    setHolder('');
    setNumber('');
    setBarcode('');
    setCategory('Membership');
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
    });
    closeAndReset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={closeAndReset}>
      <View style={styles.modalRoot}>
        <Pressable style={styles.modalScrim} onPress={closeAndReset} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetEyebrow}>NEW ENTRY</Text>
              <Text style={styles.sheetTitle}>Add to your vault</Text>
            </View>
            <GlassButton icon="close" onPress={closeAndReset} label="Close add card" />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
            <View style={styles.previewWrap}>
              <Text style={styles.sectionLabel}>LIVE PREVIEW</Text>
              <View pointerEvents="none" style={styles.previewCard}>
                <CardFace card={previewCard} back={false} />
              </View>
            </View>
            <Text style={styles.sectionLabel}>CARD DETAILS</Text>
            <Field label="CARD TITLE" value={title} onChangeText={setTitle} placeholder="e.g. THAPAR LIBRARY" />
            <Field label="CARDHOLDER" value={holder} onChangeText={setHolder} placeholder="Your name" />
            <View style={styles.fieldRow}>
              <View style={{ flex: 1 }}><Field label="CARD NUMBER" value={number} onChangeText={setNumber} placeholder="Optional" keyboardType="numbers-and-punctuation" /></View>
              <View style={{ flex: 1 }}><Field label="BARCODE VALUE" value={barcode} onChangeText={setBarcode} placeholder="Optional" keyboardType="numbers-and-punctuation" /></View>
            </View>
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
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, value, onChangeText, placeholder, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numbers-and-punctuation' }) {
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
        style={[styles.input, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.input }]}
        autoCapitalize={label === 'CARD TITLE' ? 'characters' : 'words'}
      />
    </View>
  );
}

function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { cards, activeId, setActiveId } = useCardVault();
  const [activeIndex, setActiveIndex] = useState(0);
  const [addVisible, setAddVisible] = useState(false);
  const [islandExpanded, setIslandExpanded] = useState(false);

  const activeCard = cards.find((card) => card.id === activeId) ?? null;
  const visibleCards = cards.slice(activeIndex, activeIndex + 3);

  const shiftCard = (direction: number) => {
    if (cards.length < 2) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveIndex((current) => (current + direction + cards.length) % cards.length);
  };

  const handleDrop = () => {
    const card = visibleCards[0];
    if (!card) return;
    setActiveId(card.id);
    setIslandExpanded(true);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <View style={[styles.screen, { paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 67 : 12) }]}>
      <LinearGradient colors={['#111A15', colors.background, colors.background]} locations={[0, 0.48, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.ambientOrb} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 18) + 118 }}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.header}>
          <View>
            <View style={styles.wordmarkRow}><View style={[styles.wordmarkDot, { backgroundColor: colors.primary }]} /><Text style={styles.wordmark}>CARDVAULT</Text></View>
            <Text style={styles.subtitle}>Your cards, one tap away</Text>
          </View>
          <GlassButton icon="settings-outline" onPress={() => setIslandExpanded((value) => !value)} label="Toggle active island detail" />
        </View>
        <ActiveIsland card={activeCard} onPress={() => setIslandExpanded((value) => !value)} />
        {islandExpanded && activeCard && (
          <View style={styles.islandExpanded}>
            <View style={styles.expandedTop}>
              <View><Text style={styles.expandedEyebrow}>DYNAMIC ISLAND PREVIEW</Text><Text style={styles.expandedTitle}>Ready when you are.</Text></View>
              <View style={styles.expandedSignal}><View style={[styles.liveDot, { backgroundColor: colors.primary }]} /><Text style={styles.expandedSignalText}>LIVE</Text></View>
            </View>
            <View style={styles.expandedIslandPill}>
              <MaterialCommunityIcons name={categoryIcons[activeCard.category]} size={15} color={colors.ink} />
              <Text style={styles.expandedIslandText}>{activeCard.title}</Text>
              <Ionicons name="chevron-down" size={14} color={colors.ink} />
            </View>
            <Barcode value={activeCard.barcode} compact />
          </View>
        )}
        <View style={styles.heroHeading}>
          <View><Text style={styles.heroKicker}>YOUR COLLECTION</Text><Text style={styles.heroTitle}>The vault</Text></View>
          <View style={styles.countPill}><Text style={styles.countText}>{String(cards.length).padStart(2, '0')}</Text><Text style={styles.countLabel}>CARDS</Text></View>
        </View>
        <View style={styles.stackArea}>
          {visibleCards.length > 0 ? (
            visibleCards.slice().reverse().map((card, reverseIndex) => {
              const index = visibleCards.length - 1 - reverseIndex;
              return (
                <VaultCardView
                  key={card.id}
                  card={card}
                  index={index}
                  selected={activeId === card.id}
                  onPress={() => setActiveId(card.id)}
                  onDrop={index === 0 ? handleDrop : () => undefined}
                />
              );
            })
          ) : (
            <View style={styles.emptyStack}><MaterialCommunityIcons name="cards-outline" size={34} color={colors.mutedForeground} /><Text style={styles.emptyTitle}>Your vault is waiting</Text><Text style={styles.emptyBody}>Add your first card below.</Text></View>
          )}
        </View>
        <View style={styles.stackHint}><Ionicons name="swap-horizontal" size={16} color={colors.mutedForeground} /><Text style={styles.hintText}>Swipe to browse  ·  Tap to flip</Text></View>
        <View style={styles.collectionRow}>
          <Text style={styles.collectionLabel}>ALL CARDS</Text>
          <Pressable onPress={() => setAddVisible(true)} style={({ pressed }) => [styles.addSmall, pressed && styles.pressed]}><Ionicons name="add" size={16} color={colors.primary} /><Text style={styles.addSmallText}>New card</Text></Pressable>
        </View>
        <View style={styles.miniList}>
          {cards.map((card, index) => (
            <Pressable key={card.id} onPress={() => { setActiveIndex(index); setActiveId(card.id); }} style={({ pressed }) => [styles.miniCard, activeId === card.id && { borderColor: colors.primary }, pressed && styles.pressed]}>
              <View style={[styles.miniIcon, { backgroundColor: card.color === 'green' ? colors.primary : colors.secondary }]}><MaterialCommunityIcons name={categoryIcons[card.category]} size={17} color={card.color === 'green' ? colors.ink : colors.foreground} /></View>
              <View style={{ flex: 1 }}><Text style={styles.miniTitle}>{card.title}</Text><Text style={styles.miniSubtitle}>{card.category} · {card.holder}</Text></View>
              {activeId === card.id ? <Ionicons name="checkmark-circle" size={19} color={colors.primary} /> : <Feather name="chevron-right" size={17} color={colors.mutedForeground} />}
            </Pressable>
          ))}
        </View>
      </ScrollView>
      <View style={[styles.fabDock, { bottom: Math.max(insets.bottom, Platform.OS === 'web' ? 34 : 14) + 18 }]}>
        <BlurView intensity={36} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable onPress={() => setAddVisible(true)} style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]} accessibilityRole="button" accessibilityLabel="Add card">
          <Ionicons name="add" size={28} color={colors.ink} />
        </Pressable>
      </View>
      <AddCardSheet visible={addVisible} onClose={() => setAddVisible(false)} />
    </View>
  );
}

export default function App() {
  return (
    <CardVaultProvider>
      <HomeScreen />
    </CardVaultProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#090B0A' },
  ambientOrb: { position: 'absolute', top: 130, right: -90, width: 210, height: 210, borderRadius: 105, backgroundColor: 'rgba(112, 203, 139, 0.07)' },
  header: { paddingHorizontal: 20, paddingBottom: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  wordmarkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmarkDot: { width: 8, height: 8, borderRadius: 4 },
  wordmark: { color: '#F5F7F6', fontSize: 13, letterSpacing: 2.6, fontWeight: '700' },
  subtitle: { color: '#88958D', fontSize: 13, marginTop: 7, letterSpacing: 0.1 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(28, 38, 33, 0.76)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#27332D' },
  pressed: { opacity: 0.68 },
  island: { marginHorizontal: 20, minHeight: 76, overflow: 'hidden', borderRadius: 23, borderWidth: 1, borderColor: '#27332D', backgroundColor: 'rgba(28, 38, 33, 0.76)', padding: 14 },
  islandHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  islandTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  islandEyebrow: { fontSize: 10, letterSpacing: 1.7, color: '#88958D', fontWeight: '700' },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#53615A' },
  islandCardRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 },
  islandIcon: { width: 28, height: 28, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  islandCardName: { color: '#F5F7F6', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  islandCardStatus: { color: '#88958D', fontSize: 11, marginTop: 2 },
  islandEmpty: { paddingTop: 9 },
  islandEmptyTitle: { color: '#D6E3DB', fontSize: 13, fontWeight: '600' },
  islandEmptyBody: { color: '#88958D', fontSize: 11, marginTop: 3 },
  heroHeading: { marginHorizontal: 20, marginTop: 38, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  heroKicker: { color: '#6C7A72', fontSize: 10, letterSpacing: 2.1, fontWeight: '700' },
  heroTitle: { color: '#F5F7F6', fontSize: 33, lineHeight: 39, fontWeight: '700', letterSpacing: -1.1, marginTop: 6 },
  countPill: { alignItems: 'flex-end', paddingBottom: 2 },
  countText: { color: '#B9F2CB', fontSize: 18, fontWeight: '700', letterSpacing: 1 },
  countLabel: { color: '#6C7A72', fontSize: 9, letterSpacing: 1.7, marginTop: 1 },
  stackArea: { height: CARD_HEIGHT + 34, marginTop: 22, alignItems: 'center', justifyContent: 'flex-start' },
  stackCard: { position: 'absolute', width: CARD_WIDTH, height: CARD_HEIGHT, borderRadius: 25, shadowColor: '#000', shadowOffset: { width: 0, height: 18 }, shadowOpacity: 0.42, shadowRadius: 24, elevation: 10 },
  peekingCard: { shadowOpacity: 0.2, shadowRadius: 15 },
  cardPressable: { width: '100%', height: '100%' },
  cardLayer: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden' },
  cardBackLayer: { backfaceVisibility: 'hidden' },
  selectedRing: { position: 'absolute', inset: -3, borderWidth: 1, borderRadius: 28, opacity: 0.45 },
  cardFace: { flex: 1, borderRadius: 25, padding: 21, overflow: 'hidden' },
  cardGlow: { position: 'absolute', width: 210, height: 210, right: -80, top: -80, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.17)' },
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
  chip: { width: 35, height: 25, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(7,16,11,0.34)', padding: 4, gap: 3, justifyContent: 'center' },
  chipLine: { height: 1, backgroundColor: 'rgba(7,16,11,0.26)' },
  magStripe: { position: 'absolute', top: 48, left: 0, right: 0, height: 42 },
  backContent: { flex: 1, justifyContent: 'flex-end' },
  backTopline: { position: 'absolute', top: 1, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  barcode: { paddingVertical: 10, paddingHorizontal: 12 },
  barcodeBars: { height: 31, flexDirection: 'row', alignItems: 'stretch', justifyContent: 'center', gap: 2 },
  barcodeValue: { fontSize: 10, textAlign: 'center', marginTop: 6, letterSpacing: 2.2, fontWeight: '600' },
  barcodeCompact: { height: 37, marginTop: 10, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: 'rgba(7, 16, 11, 0.1)', borderRadius: 8 },
  bar: { minWidth: 1, borderRadius: 0.5 },
  qr: { width: 34, height: 34, padding: 3, display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 1 },
  qrCell: { width: 2.65, height: 2.65 },
  backBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  backNumber: { fontSize: 14, fontWeight: '700', letterSpacing: 1.4 },
  backDetail: { fontSize: 9, fontWeight: '600' },
  stackHint: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 9 },
  hintText: { color: '#6C7A72', fontSize: 11, letterSpacing: 0.2 },
  collectionRow: { marginHorizontal: 20, marginTop: 42, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  collectionLabel: { color: '#6C7A72', fontSize: 10, letterSpacing: 2, fontWeight: '700' },
  addSmall: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5 },
  addSmallText: { color: '#9AE5B4', fontSize: 12, fontWeight: '600' },
  miniList: { marginHorizontal: 20, marginTop: 12, gap: 9 },
  miniCard: { minHeight: 62, borderRadius: 17, borderWidth: 1, borderColor: '#1D2721', backgroundColor: 'rgba(18, 23, 21, 0.82)', paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 11 },
  miniIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  miniTitle: { color: '#E9F1EC', fontSize: 12, fontWeight: '700', letterSpacing: 0.4 },
  miniSubtitle: { color: '#78857D', fontSize: 11, marginTop: 3 },
  fabDock: { position: 'absolute', alignSelf: 'center', width: 74, height: 74, borderRadius: 25, padding: 7, overflow: 'hidden', borderWidth: 1, borderColor: '#304238', backgroundColor: 'rgba(28, 38, 33, 0.76)', shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 12 },
  fab: { flex: 1, borderRadius: 19, backgroundColor: '#9AE5B4', justifyContent: 'center', alignItems: 'center' },
  fabPressed: { transform: [{ scale: 0.94 }], opacity: 0.9 },
  islandExpanded: { marginHorizontal: 20, marginTop: 10, padding: 16, borderRadius: 20, backgroundColor: 'rgba(19, 29, 23, 0.92)', borderWidth: 1, borderColor: '#2A3B30' },
  expandedTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  expandedEyebrow: { color: '#6C7A72', fontSize: 9, letterSpacing: 1.7, fontWeight: '700' },
  expandedTitle: { color: '#DDEBE1', fontSize: 14, fontWeight: '600', marginTop: 4 },
  expandedSignal: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  expandedSignalText: { color: '#9AE5B4', fontSize: 9, fontWeight: '700', letterSpacing: 1.2 },
  expandedIslandPill: { alignSelf: 'center', marginTop: 15, minWidth: 150, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#9AE5B4', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  expandedIslandText: { color: '#07100B', fontSize: 11, fontWeight: '700', letterSpacing: 0.7 },
  modalRoot: { flex: 1, justifyContent: 'flex-end' },
  modalScrim: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.68)' },
  sheet: { maxHeight: '92%', backgroundColor: '#101613', borderTopLeftRadius: 30, borderTopRightRadius: 30, borderWidth: 1, borderBottomWidth: 0, borderColor: '#293A2F', paddingTop: 11 },
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
});