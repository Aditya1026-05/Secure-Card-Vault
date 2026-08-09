import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Keyboard,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useCardVault, VaultCard, CardCategory } from '@/context/CardVaultContext';
import { useColors } from '@/hooks/useColors';
import { ModernCardFace } from './ModernCardFace';

interface ModernEditCardSheetProps {
  card: VaultCard | null;
  onClose: () => void;
}

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

export function ModernEditCardSheet({ card, onClose }: ModernEditCardSheetProps) {
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

  // Load card details when card changes
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
    color: card.color,
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
            <Pressable
              onPress={closeAndReset}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
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
                <ModernCardFace card={previewCard} back={false} />
              </View>
            </View>

            <Text style={styles.sectionLabel}>CARD DETAILS</Text>
            <ModernField 
              label="CARD TITLE" 
              value={title} 
              onChangeText={(text) => setTitle(text.replace(/[^a-zA-Z0-9\s-_]/g, '').toUpperCase())} 
              placeholder="e.g. UNIVERSITY ID" 
            />
            <ModernField 
              label="CARDHOLDER" 
              value={holder} 
              onChangeText={(text) => setHolder(text.replace(/[^a-zA-Z\s.-]/g, ''))} 
              placeholder="Your name" 
            />
            
            {category === 'Credit Card' || category === 'Debit Card' ? (
              <View>
                <View style={styles.fieldRow}>
                  <View style={{ flex: 1.5 }}>
                    <ModernField 
                      label="CARD NUMBER" 
                      value={number} 
                      onChangeText={handleCardNumberChange} 
                      placeholder="e.g. 4532 7189 0288 3314" 
                      keyboardType="numbers-and-punctuation" 
                    />
                    {hasCardNumberError ? <Text style={styles.errorLabel}>Must be 16 digits</Text> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ModernField 
                      label="VALID THRU" 
                      value={validThru} 
                      onChangeText={handleDateChange} 
                      placeholder="MM/YY" 
                      maxLength={5} 
                    />
                    {dateError ? <Text style={styles.errorLabel}>{dateError}</Text> : null}
                  </View>
                  <View style={{ flex: 0.8 }}>
                    <ModernField 
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
                  <ModernField 
                    label="CARD NUMBER" 
                    value={number} 
                    onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))} 
                    placeholder="e.g. 102306233" 
                    keyboardType="numbers-and-punctuation" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ModernField 
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
                  <ModernField 
                    label="CARD NUMBER" 
                    value={number} 
                    onChangeText={(text) => setNumber(text.replace(/[^0-9]/g, ''))} 
                    placeholder="Optional" 
                    keyboardType="numbers-and-punctuation" 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ModernField 
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
                  <Pressable 
                    key={option} 
                    onPress={() => { void Haptics.selectionAsync(); setCategory(option); }} 
                    style={[styles.categoryChip, active && styles.categoryChipActive]}
                  >
                    <MaterialCommunityIcons 
                      name={categoryIcons[option]} 
                      size={14} 
                      color={active ? '#000000' : '#8C8C8C'} 
                    />
                    <Text style={[styles.categoryChipText, active && styles.categoryChipTextActive]}>
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text style={styles.sectionLabel}>SECURE ACCOUNT DETAILS (HIDDEN FROM CARD FACE)</Text>
            {category === 'Credit Card' || category === 'Debit Card' ? (
              <View style={styles.fieldRow}>
                <View style={{ flex: 1.2 }}>
                  <ModernField 
                    label="IFSC CODE" 
                    value={ifsc} 
                    onChangeText={(text) => setIfsc(text.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 11))} 
                    placeholder="e.g. HDFC0000104" 
                    maxLength={11}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <ModernField 
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
                <ModernField 
                  label="ACCOUNT NUMBER" 
                  value={accountNumber} 
                  onChangeText={(text) => setAccountNumber(text.replace(/[^0-9]/g, ''))} 
                  placeholder="Optional secure account #" 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
              <View style={{ flex: 1 }}>
                <ModernField 
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
                <ModernField 
                  label="CARD PIN" 
                  value={pin} 
                  onChangeText={(text) => setPin(text.replace(/[^0-9]/g, ''))} 
                  placeholder="e.g. 1234" 
                  maxLength={4} 
                  keyboardType="numbers-and-punctuation" 
                />
              </View>
            </View>
            <ModernField 
              label="SECURE NOTES" 
              value={notes} 
              onChangeText={(text) => setNotes(text.slice(0, 200))} 
              placeholder="Enter any extra account details or notes..." 
            />

            <View style={styles.editActionRow}>
              <Pressable 
                onPress={remove} 
                style={({ pressed }) => [styles.deleteButton, pressed && { opacity: 0.7 }]}
                accessibilityRole="button"
              >
                <Ionicons name="trash-outline" size={16} color="#FF5A5A" />
                <Text style={styles.deleteButtonText}>Delete card</Text>
              </Pressable>
              
              <Pressable 
                onPress={save} 
                disabled={!canSave} 
                style={({ pressed }) => [
                  styles.saveChangesButton, 
                  canSave ? styles.saveChangesButtonActive : styles.saveChangesButtonDisabled,
                  pressed && canSave && { opacity: 0.8 }
                ]}
                accessibilityRole="button"
              >
                <Text style={[styles.saveChangesButtonText, { color: canSave ? '#000000' : '#8C8C8C' }]}>
                  Save Changes
                </Text>
                <Ionicons name="checkmark" size={16} color={canSave ? '#000000' : '#8C8C8C'} />
              </Pressable>
            </View>
          </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </View>
    </Modal>
  );
}

function ModernField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  maxLength,
}: {
  label: string;
  value: string;
  onChangeText: (val: string) => void;
  placeholder: string;
  keyboardType?: 'default' | 'numbers-and-punctuation';
  maxLength?: number;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8C8C8C"
        keyboardType={keyboardType}
        maxLength={maxLength}
        style={styles.input}
        autoCapitalize={label === 'CARD TITLE' ? 'characters' : 'words'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.85)',
  },
  sheet: {
    height: '92%',
    backgroundColor: '#000000',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1.2,
    borderBottomWidth: 0,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingTop: 12,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginBottom: 16,
  },
  sheetHeader: {
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetEyebrow: {
    color: '#8C8C8C',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
  },
  sheetTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  formContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  previewWrap: {
    marginBottom: 20,
  },
  previewCard: {
    height: 156,
    marginTop: 10,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  sectionLabel: {
    color: '#8C8C8C',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
  },
  field: {
    marginTop: 14,
  },
  fieldLabel: {
    color: '#8C8C8C',
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#FFFFFF',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chips: {
    gap: 8,
    paddingVertical: 12,
  },
  categoryChip: {
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0A0A0A',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  categoryChipText: {
    color: '#8C8C8C',
    fontSize: 11,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  editActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  deleteButton: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: '#FF5A5A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  deleteButtonText: {
    color: '#FF5A5A',
    fontSize: 14,
    fontWeight: '700',
  },
  saveChangesButton: {
    flex: 1.5,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveChangesButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  saveChangesButtonDisabled: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  saveChangesButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  errorLabel: {
    color: '#FF5A5A',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 4,
    marginLeft: 4,
  },
});
