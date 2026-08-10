import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import { useCardVault } from '@/context/CardVaultContext';
import { useColors } from '@/hooks/useColors';

interface ModernSettingsSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function ModernSettingsSheet({ visible, onClose }: ModernSettingsSheetProps) {
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
            <Pressable
              onPress={closeAndReset}
              style={({ pressed }) => [styles.closeBtn, pressed && { opacity: 0.6 }]}
            >
              <Ionicons name="close" size={20} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContent}>
            
            <Text style={styles.sectionLabel}>APPEARANCE</Text>
            {/* UI Theme Toggle */}
            <Pressable 
              onPress={() => {
                void Haptics.selectionAsync();
                setUiMode(uiMode === 'classic' ? 'modern' : 'classic');
              }}
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="color-palette-outline" size={20} color="#FFFFFF" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>UI Theme Mode</Text>
                  <Text style={styles.settingsRowSub}>Currently: {uiMode.toUpperCase()} UI</Text>
                </View>
              </View>
              <Ionicons 
                name={uiMode === 'modern' ? "toggle" : "toggle-outline"} 
                size={34} 
                color={uiMode === 'modern' ? '#FFFFFF' : '#8C8C8C'} 
              />
            </Pressable>

            <Text style={[styles.sectionLabel, { marginTop: 14 }]}>APP PREFERENCES</Text>
            
            {/* Haptics Switch */}
            <Pressable 
              onPress={() => {
                void Haptics.selectionAsync();
                setHapticsEnabled(!hapticsEnabled);
              }}
              style={({ pressed }) => [
                styles.settingsRow,
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Haptic Feedback</Text>
                  <Text style={styles.settingsRowSub}>Tactile feedback on actions</Text>
                </View>
              </View>
              <Ionicons 
                name={hapticsEnabled ? "toggle" : "toggle-outline"} 
                size={34} 
                color={hapticsEnabled ? '#FFFFFF' : '#8C8C8C'} 
              />
            </Pressable>

            {/* Biometric Switch */}
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
                pressed && { opacity: 0.8 }
              ]}
            >
              <View style={styles.settingsRowLeft}>
                <Ionicons name="finger-print-outline" size={20} color="#FFFFFF" />
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.settingsRowTitle}>Biometric Decryption</Text>
                  <Text style={styles.settingsRowSub}>Require Face ID to decrypt details</Text>
                </View>
              </View>
              <Ionicons 
                name={faceIdEnabled ? "toggle" : "toggle-outline"} 
                size={34} 
                color={faceIdEnabled ? '#FFFFFF' : '#8C8C8C'} 
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
                <Text style={styles.statsLabel}>Categories</Text>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 18 }]}>SECURITY INFO</Text>
            <View style={styles.securityBanner}>
              <Ionicons name="shield-checkmark-outline" size={22} color="#FFFFFF" />
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
                <Text style={styles.aboutVal}>v1.1.0 (Modern Mode)</Text>
              </View>
              <View style={styles.aboutDivider} />
              <View style={styles.aboutRow}>
                <Text style={styles.aboutLabel}>Developer</Text>
                <Text style={styles.aboutVal}>Aditya Tayal</Text>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
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
    maxHeight: '90%',
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
  sectionLabel: {
    color: '#8C8C8C',
    fontSize: 9,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 8,
  },
  settingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingsRowTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  settingsRowSub: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 2,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
  },
  statsValue: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  statsLabel: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 4,
  },
  statsDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 4,
  },
  securityBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  securityTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  securityText: {
    color: '#8C8C8C',
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
  aboutBox: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  aboutLabel: {
    color: '#8C8C8C',
    fontSize: 12,
  },
  aboutVal: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  aboutDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
