import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { Modal, View, Text, ActivityIndicator, StyleSheet } from 'react-native';

// Mock ad layer. Every screen talks to ads only through this folder
// (AdProvider, BannerAdSlot, useInterstitialAd, useRewardedAd). To show real
// Google ads later, swap the internals of these files for
// react-native-google-mobile-ads (requires an Expo Dev Client build) -
// no screen code needs to change.

const AdContext = createContext(null);

const AD_DURATION_MS = 2200;

export function AdProvider({ children }) {
  const [adState, setAdState] = useState(null);
  const resolverRef = useRef(null);

  const playAd = useCallback((kind) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setAdState({ kind });
      setTimeout(() => {
        setAdState(null);
        const resolve2 = resolverRef.current;
        resolverRef.current = null;
        resolve2?.(true);
      }, AD_DURATION_MS);
    });
  }, []);

  return (
    <AdContext.Provider value={{ playAd }}>
      {children}
      <Modal visible={!!adState} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.card}>
            <Text style={styles.badge}>AD PLACEHOLDER</Text>
            <ActivityIndicator size="large" color="#fff" style={{ marginVertical: 16 }} />
            <Text style={styles.title}>
              {adState?.kind === 'rewarded' ? 'Playing rewarded ad…' : 'Advertisement'}
            </Text>
            <Text style={styles.subtitle}>
              This is a placeholder slot. Real Google ads render here once the
              app moves to a dev client build.
            </Text>
          </View>
        </View>
      </Modal>
    </AdContext.Provider>
  );
}

export function useAdContext() {
  const ctx = useContext(AdContext);
  if (!ctx) throw new Error('useAdContext must be used within an AdProvider');
  return ctx;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  card: { alignItems: 'center' },
  badge: { color: '#f59e0b', fontWeight: 'bold', letterSpacing: 2, fontSize: 12, marginBottom: 10 },
  title: { color: 'white', fontSize: 20, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', lineHeight: 18 },
});
