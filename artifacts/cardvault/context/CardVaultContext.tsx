import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

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
  color: 'green' | 'lavender' | 'blue' | 'orange' | 'graphite';
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
];

type CardVaultContextValue = {
  cards: VaultCard[];
  activeId: string | null;
  hydrated: boolean;
  setActiveId: (id: string | null) => void;
  addCard: (card: Omit<VaultCard, 'id' | 'color'>) => void;
};

const CardVaultContext = createContext<CardVaultContextValue | null>(null);

export function CardVaultProvider({ children }: { children: React.ReactNode }) {
  const [cards, setCards] = useState<VaultCard[]>(seedCards);
  const [activeId, setActiveIdState] = useState<string | null>(seedCards[0]?.id ?? null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(ACTIVE_KEY)])
      .then(([storedCards, storedActive]) => {
        if (!mounted) return;
        if (storedCards) {
          try {
            const parsed = JSON.parse(storedCards) as VaultCard[];
            if (Array.isArray(parsed) && parsed.length > 0) setCards(parsed);
          } catch {
            // Keep the carefully chosen local starter cards if storage is invalid.
          }
        }
        if (storedActive) setActiveIdState(storedActive);
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
    setActiveIdState(id);
    if (hydrated) void AsyncStorage.setItem(ACTIVE_KEY, id ?? '');
  };

  const addCard = (card: Omit<VaultCard, 'id' | 'color'>) => {
    const newCard: VaultCard = {
      ...card,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      color: ['green', 'lavender', 'blue', 'orange', 'graphite'][cards.length % 5] as VaultCard['color'],
    };
    setCards((current) => [newCard, ...current]);
    setActiveId(newCard.id);
  };

  const value = useMemo(
    () => ({ cards, activeId, hydrated, setActiveId, addCard }),
    [cards, activeId, hydrated],
  );

  return <CardVaultContext.Provider value={value}>{children}</CardVaultContext.Provider>;
}

export function useCardVault() {
  const context = useContext(CardVaultContext);
  if (!context) throw new Error('useCardVault must be used inside CardVaultProvider');
  return context;
}