import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useLiveActivitySync } from '../hooks/useLiveActivitySync';

export type CardCategory =
  | 'Library'
  | 'Student ID'
  | 'Gym'
  | 'Membership'
  | 'Credit Card'
  | 'Debit Card'
  | 'Insurance'
  | 'Custom';

export type VaultCard = {
  id: string;
  title: string;
  holder: string;
  institution: string;
  number: string;
  barcode: string;
  category: CardCategory;
  color: 'green' | 'lavender' | 'blue' | 'orange' | 'graphite' | 'maroon' | 'brown' | 'black';
  cvv?: string;
  validThru?: string;
  rollNo?: string;
  accountNumber?: string;
  routingNumber?: string;
  pin?: string;
  notes?: string;
  ifsc?: string;
  branch?: string;
};

const STORAGE_KEY = '@cardvault/cards';
const ACTIVE_KEY = '@cardvault/active';

const seedCards: VaultCard[] = [
  {
    id: 'thapar-library',
    title: 'THAPAR LIBRARY',
    holder: 'Aditya Tayal',
    institution: 'Thapar Institute of Engineering & Technology',
    number: '102306233',
    barcode: '102306233',
    category: 'Library',
    color: 'green',
    rollNo: '102306233',
  },
  {
    id: 'cult-fit',
    title: 'CULT.FIT',
    holder: 'Aditya Tayal',
    institution: 'Curefit Healthcare Pvt. Ltd.',
    number: 'CF-4902-1128',
    barcode: '49021128',
    category: 'Gym',
    color: 'lavender',
  },
  {
    id: 'urban-loyalty',
    title: 'URBAN COLLECTIVE',
    holder: 'Aditya Tayal',
    institution: 'Member since 2022',
    number: 'UC-0082-441',
    barcode: '0082441',
    category: 'Membership',
    color: 'blue',
  },
  {
    id: 'hdfc-bank',
    title: 'HDFC BANK VISA',
    holder: 'Aditya Tayal',
    institution: 'HDFC Credit Premium Card',
    number: '4532 7189 0288 3314',
    barcode: '',
    category: 'Credit Card',
    color: 'graphite',
    cvv: '451',
    validThru: '12/29',
  },
];

const FACEID_KEY = '@cardvault/faceid';
const UIMODE_KEY = '@cardvault/uimode';

type CardVaultContextValue = {
  cards: VaultCard[];
  activeId: string | null;
  hydrated: boolean;
  faceIdEnabled: boolean;
  uiMode: 'classic' | 'modern';
  setActiveId: (id: string | null) => void;
  addCard: (card: Omit<VaultCard, 'id'>) => void;
  updateCard: (id: string, updatedFields: Partial<Omit<VaultCard, 'id'>>) => void;
  deleteCard: (id: string) => void;
  setFaceIdEnabled: (val: boolean) => void;
  setUiMode: (mode: 'classic' | 'modern') => void;
};

const CardVaultContext = createContext<CardVaultContextValue | null>(null);

export function CardVaultProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<VaultCard[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [faceIdEnabled, setFaceIdEnabledState] = useState(false);
  const [uiMode, setUiModeState] = useState<'classic' | 'modern'>('modern');

  useEffect(() => {
    let mounted = true;
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY),
      AsyncStorage.getItem(ACTIVE_KEY),
      AsyncStorage.getItem(FACEID_KEY),
      AsyncStorage.getItem(UIMODE_KEY)
    ])
      .then(([storedCards, storedActive, storedFaceId, storedUiMode]) => {
        if (!mounted) return;
        let resolvedCards: VaultCard[] = [];
        if (storedCards) {
          try {
            const parsed = JSON.parse(storedCards) as VaultCard[];
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCards(parsed);
              resolvedCards = parsed;
            }
          } catch {
            // Keep empty list if storage is invalid.
          }
        }
        if (storedActive) {
          const card = resolvedCards.find(c => c.id === storedActive);
          if (card && card.category !== 'Credit Card' && card.category !== 'Debit Card') {
            setActiveIdState(storedActive);
          } else {
            const fallback = resolvedCards.find(c => c.category !== 'Credit Card' && c.category !== 'Debit Card');
            setActiveIdState(fallback?.id ?? null);
          }
        } else {
          const fallback = resolvedCards.find(c => c.category !== 'Credit Card' && c.category !== 'Debit Card');
          setActiveIdState(fallback?.id ?? null);
        }
        if (storedFaceId) setFaceIdEnabledState(storedFaceId === 'true');
        if (storedUiMode) setUiModeState(storedUiMode as 'classic' | 'modern');
        setHydrated(true);
      })
      .catch(() => setHydrated(true));
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (hydrated) void AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
  }, [cards, hydrated]);

  const setActiveId = (id: string | null) => {
    if (id) {
      const card = cards.find((c) => c.id === id);
      if (card && (card.category === 'Credit Card' || card.category === 'Debit Card')) {
        Alert.alert(
          'Security Constraint',
          'For your security, payment cards (Credit/Debit) cannot be set as active or shown in the Dynamic Island.',
          [{ text: 'OK' }]
        );
        return;
      }
    }
    setActiveIdState(id);
    if (hydrated) void AsyncStorage.setItem(ACTIVE_KEY, id ?? '');
  };

  const addCard = (card: Omit<VaultCard, 'id'>) => {
    const newCard: VaultCard = {
      ...card,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    };
    setCards((current) => [newCard, ...current]);
    setActiveId(newCard.id);
  };

  const updateCard = (id: string, updatedFields: Partial<Omit<VaultCard, 'id'>>) => {
    setCards((current) =>
      current.map((card) => (card.id === id ? { ...card, ...updatedFields } : card))
    );
  };

  const deleteCard = (id: string) => {
    setCards((current) => {
      const remaining = current.filter((card) => card.id !== id);
      if (activeId === id) {
        const nextActive = remaining.find((c) => c.category !== 'Credit Card' && c.category !== 'Debit Card');
        setActiveIdState(nextActive?.id ?? null);
        if (hydrated) void AsyncStorage.setItem(ACTIVE_KEY, nextActive?.id ?? '');
      }
      return remaining;
    });
  };

  const setFaceIdEnabled = (val: boolean) => {
    setFaceIdEnabledState(val);
    if (hydrated) void AsyncStorage.setItem(FACEID_KEY, String(val));
  };

  const setUiMode = (mode: 'classic' | 'modern') => {
    setUiModeState(mode);
    if (hydrated) void AsyncStorage.setItem(UIMODE_KEY, mode);
  };

  useLiveActivitySync(activeId, cards, hydrated);

  const value = useMemo(
    () => ({
      cards,
      activeId,
      hydrated,
      faceIdEnabled,
      uiMode,
      setActiveId,
      addCard,
      updateCard,
      deleteCard,
      setFaceIdEnabled,
      setUiMode,
    }),
    [cards, activeId, hydrated, faceIdEnabled, uiMode],
  );

  return <CardVaultContext.Provider value={value}>{children}</CardVaultContext.Provider>;
}

export function useCardVault() {
  const context = useContext(CardVaultContext);
  if (!context) throw new Error('useCardVault must be used inside CardVaultProvider');
  return context;
}