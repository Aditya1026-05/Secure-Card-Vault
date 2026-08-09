import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Dimensions,
  Animated,
  PanResponder,
  Easing,
  Pressable,
  Platform,
} from 'react-native';
import Svg, { Ellipse, Defs, RadialGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VaultCard } from '@/context/CardVaultContext';
import { ModernCardFace } from './ModernCardFace';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH - 64, 330);
const CARD_HEIGHT = CARD_WIDTH * 0.64;
const STACK_AREA_HEIGHT = CARD_HEIGHT + 50;

interface ModernCardStackProps {
  cards: VaultCard[];
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  activeIndex: number;
  setActiveIndex: (index: number | ((curr: number) => number)) => void;
  onDrop: () => void;
  onDropTarget: () => void;
  onDragState: (dragging: boolean) => void;
  swipeDirection: 'left' | 'right' | null;
  onHorizontalSwipe: (direction: 1 | -1) => void;
}

export function ModernCardStack({
  cards,
  activeId,
  setActiveId,
  activeIndex,
  setActiveIndex,
  onDrop,
  onDropTarget,
  onDragState,
  swipeDirection,
  onHorizontalSwipe,
}: ModernCardStackProps) {
  const visibleCards = useMemo(() => {
    if (cards.length === 0) return [];
    const list: VaultCard[] = [];
    for (let i = 0; i < cards.length; i++) {
      const idx = (activeIndex + i) % cards.length;
      list.push(cards[idx]);
    }
    return list;
  }, [cards, activeIndex]);

  if (cards.length === 0) {
    return (
      <View style={styles.emptyStackContainer}>
        <View style={styles.emptyStack}>
          <MaterialCommunityIcons name="cards-outline" size={38} color="#8C8C8C" />
          <Text style={styles.emptyTitle}>Vault is empty</Text>
          <Text style={styles.emptyBody}>Tap the + button to secure a card.</Text>
        </View>
      </View>
    );
  }

  const cx = SCREEN_WIDTH / 2;
  const cy = STACK_AREA_HEIGHT / 2 - 10;

  return (
    <View style={styles.stackArea}>
      {/* 3D Platform Base (Behind Stack) */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Svg height={STACK_AREA_HEIGHT} width={SCREEN_WIDTH}>
          <Defs>
            <RadialGradient id="platformGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="rgba(255, 255, 255, 0.12)" />
              <Stop offset="100%" stopColor="rgba(0, 0, 0, 0)" />
            </RadialGradient>
          </Defs>

          {/* Under-pedestal glow */}
          <Ellipse cx={cx} cy={STACK_AREA_HEIGHT - 18} rx={140} ry={15} fill="url(#platformGlow)" />

          {/* Cylindrical Platform Base */}
          <Ellipse cx={cx} cy={STACK_AREA_HEIGHT - 18} rx={120} ry={10} fill="#080808" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1.5" />
          <Ellipse cx={cx} cy={STACK_AREA_HEIGHT - 18} rx={108} ry={8} fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1" />
        </Svg>
      </View>

      {/* Receding Floating Cards Stack */}
      <View style={styles.stackGroup}>
        {visibleCards.slice().reverse().map((card, reverseIndex) => {
          const index = visibleCards.length - 1 - reverseIndex;
          return (
            <ModernStackCardItem
              key={card.id}
              card={card}
              index={index}
              selected={activeId === card.id}
              swipeDirection={index === 0 ? swipeDirection : null}
              onPress={() => setActiveId(card.id)}
              onDrop={index === 0 ? onDrop : () => undefined}
              onHorizontalSwipe={index === 0 ? onHorizontalSwipe : () => undefined}
              onDropTarget={index === 0 ? onDropTarget : () => undefined}
              onDragState={index === 0 ? onDragState : () => undefined}
            />
          );
        })}
      </View>
    </View>
  );
}

interface ModernStackCardItemProps {
  card: VaultCard;
  index: number;
  selected: boolean;
  swipeDirection: 'left' | 'right' | null;
  onPress: () => void;
  onDrop: () => void;
  onHorizontalSwipe: (direction: 1 | -1) => void;
  onDropTarget: () => void;
  onDragState: (dragging: boolean) => void;
}

function ModernStackCardItem({
  card,
  index,
  selected,
  swipeDirection,
  onPress,
  onDrop,
  onHorizontalSwipe,
  onDropTarget,
  onDragState,
}: ModernStackCardItemProps) {
  const [flipped, setFlipped] = useState(false);
  const [isAnimatingToBack, setIsAnimatingToBack] = useState(false);
  const [isLocalDragging, setIsLocalDragging] = useState(false);
  const [isInDropZone, setIsInDropZone] = useState(false);

  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;

  // Gentle float loop for front card (index 0)
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
        
        // Classic drag physics: unresisted upward pull for active island, resisted downward pull
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
          // Dragged into Active Island drop zone!
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
          // Swipe LEFT -> Move card behind
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
                damping: 16,
                stiffness: 120,
                mass: 0.8,
                useNativeDriver: true,
              }),
              Animated.spring(scale, {
                toValue: 1,
                damping: 16,
                stiffness: 120,
                mass: 0.8,
                useNativeDriver: true,
              }),
              Animated.spring(translateY, {
                toValue: 0,
                damping: 16,
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
          // Swipe RIGHT -> Slide current card off-screen and switch
          Animated.parallel([
            Animated.timing(translateX, {
              toValue: SCREEN_WIDTH,
              duration: 200,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(() => {
            translateX.setValue(0);
            scale.setValue(1);
            translateY.setValue(0);
            callbacksRef.current.onHorizontalSwipe(-1);
            callbacksRef.current.onDragState(false);
          });
        } else {
          // Spring back
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

  // Swipe in transition
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

  // Flip trigger
  const flip = () => {
    void Haptics.selectionAsync();
    const next = flipped ? 0 : 180;
    Animated.timing(rotateY, { toValue: next, duration: 520, useNativeDriver: true }).start();
    setFlipped((val) => !val);
    onPress();
  };

  const frontOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [1, 0, 0] });
  const backOpacity = rotateY.interpolate({ inputRange: [0, 90, 180], outputRange: [0, 0, 1] });
  
  // Combine flip Y-rotation with base 3D angle
  const frontRotateY = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['-22deg', '158deg'] });
  const backRotateY = rotateY.interpolate({ inputRange: [0, 180], outputRange: ['158deg', '338deg'] });

  // Floating offset interpolation
  const floatingOffsetY = floatValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-8, 8],
  });

  // Calculate offsets for receding depth stack (shifting right and up)
  const depthScale = 1 - Math.min(index, 3) * 0.045; // 1.0, 0.955, 0.91, 0.865
  const depthTranslateY = Math.min(index, 3) * -16;
  const depthTranslateX = Math.min(index, 3) * 16;
  const depthOpacity = 1 - Math.min(index, 3) * 0.15; // 1.0, 0.85, 0.70, 0.55

  const isVisible = index <= 3 || isAnimatingToBack;
  const opacity = isVisible ? depthOpacity : 0;

  // Organic rotateZ during drag
  const dragRotateZ = translateX.interpolate({
    inputRange: [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
    outputRange: ['-12deg', '0deg', '12deg'],
  });

  const animatedScale = scale.interpolate({
    inputRange: [0.8, 1.1],
    outputRange: [0.8 * depthScale, 1.1 * depthScale],
  });

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
            { rotateZ: '8deg' },
            { translateX: depthTranslateX },
            { translateY: depthTranslateY },
            { translateY: index === 0 ? floatingOffsetY : 0 },
            { translateY },
            { translateX },
            { scale: animatedScale },
            { rotateZ: index === 0 ? dragRotateZ : '0deg' },
          ],
        },
      ]}
    >
      <Pressable onPress={flip} style={styles.cardPressable} accessibilityRole="button">
        {/* Front Face Layer */}
        <Animated.View
          style={[
            styles.cardLayer,
            { opacity: frontOpacity, transform: [{ rotateY: frontRotateY }] },
          ]}
        >
          <ModernCardFace card={card} back={false} />
        </Animated.View>
        {/* Back Face Layer */}
        <Animated.View
          style={[
            styles.cardLayer,
            styles.cardBackLayer,
            { opacity: backOpacity, transform: [{ rotateY: backRotateY }] },
          ]}
        >
          <ModernCardFace card={card} back />
        </Animated.View>
      </Pressable>
      {selected && <View style={styles.activeSilverEdge} pointerEvents="none" />}
      
      {/* Visual Dragging overlay zone status */}
      {isLocalDragging && (
        <View 
          style={[
            styles.dragIndicatorOverlay, 
            isInDropZone && { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
          ]} 
          pointerEvents="none"
        >
          <BlurView intensity={30} tint="dark" style={[styles.dragIndicatorBlur, isInDropZone && { borderColor: '#FFFFFF' }]}>
            <MaterialCommunityIcons 
              name={isInDropZone ? "check-circle-outline" : "card-bulleted-outline"} 
              size={20} 
              color="#FFFFFF" 
            />
            <Text style={styles.dragIndicatorText}>
              {isInDropZone ? "RELEASE TO DEPOSIT" : "DRAGGING CARD"}
            </Text>
          </BlurView>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  stackArea: {
    height: STACK_AREA_HEIGHT,
    marginTop: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stackGroup: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -24, 
    marginTop: -20,
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
    elevation: 12,
  },
  cardPressable: {
    width: '100%',
    height: '100%',
  },
  cardLayer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
  },
  cardBackLayer: {
    backfaceVisibility: 'hidden',
  },
  activeSilverEdge: {
    position: 'absolute',
    inset: -3,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 23,
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
  emptyStackContainer: {
    height: CARD_HEIGHT + 60,
    alignItems: 'center',
    justifyContent: 'center',
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
});
