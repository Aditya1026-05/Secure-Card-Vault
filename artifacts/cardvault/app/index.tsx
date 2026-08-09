import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CardVaultProvider, useCardVault } from '@/context/CardVaultContext';
import { ClassicHomeScreen } from '@/components/classic/ClassicHomeScreen';
import { ModernHomeScreen } from '@/components/modern/ModernHomeScreen';

function AppContent() {
  const { uiMode, hydrated } = useCardVault();

  if (!hydrated) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return uiMode === 'classic' ? <ClassicHomeScreen /> : <ModernHomeScreen />;
}

export default function App() {
  return (
    <CardVaultProvider>
      <AppContent />
    </CardVaultProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});