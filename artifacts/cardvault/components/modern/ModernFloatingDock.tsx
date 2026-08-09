import React from 'react';
import { StyleSheet, View, Text, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface ModernFloatingDockProps {
  activeTab: 'vault' | 'insights' | 'security' | 'settings';
  onTabSelect: (tab: 'vault' | 'insights' | 'security' | 'settings') => void;
}

export function ModernFloatingDock({ activeTab, onTabSelect }: ModernFloatingDockProps) {
  const tabs = [
    { id: 'vault', label: 'Vault', icon: 'wallet-outline', iconType: 'ionicons' },
    { id: 'insights', label: 'Insights', icon: 'bar-chart-outline', iconType: 'ionicons' },
    { id: 'security', label: 'Security', icon: 'shield-checkmark-outline', iconType: 'ionicons' },
    { id: 'settings', label: 'Settings', icon: 'settings-outline', iconType: 'ionicons' },
  ] as const;

  const handlePress = (tabId: 'vault' | 'insights' | 'security' | 'settings') => {
    void Haptics.selectionAsync();
    onTabSelect(tabId);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={24} tint="dark" style={styles.blurDock}>
        <View style={styles.dockContent}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handlePress(tab.id)}
                style={styles.tabPressable}
                accessibilityRole="button"
                accessibilityLabel={`${tab.label} navigation tab`}
              >
                <View style={[styles.tabContent, isActive && styles.tabContentActive]}>
                  {/* Subtle active glow behind icon */}
                  {isActive && <View style={styles.glowSpot} />}
                  
                  <Ionicons 
                    name={tab.icon as keyof typeof Ionicons.glyphMap} 
                    size={20} 
                    color={isActive ? '#FFFFFF' : '#8C8C8C'} 
                  />
                  
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  blurDock: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(10, 10, 10, 0.72)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  dockContent: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  tabPressable: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    width: '84%',
    position: 'relative',
  },
  tabContentActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  glowSpot: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.8,
    shadowRadius: 10,
    zIndex: -1,
  },
  tabText: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    color: '#8C8C8C',
    marginTop: 4,
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
