import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BannerAdSlot({ placement = 'default' }) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>ADVERTISEMENT</Text>
      <Text style={styles.placeholder}>Banner ad slot · {placement}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 56,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    paddingVertical: 8,
  },
  label: { fontSize: 9, color: '#9c9ab3', fontWeight: 'bold', letterSpacing: 1 },
  placeholder: { fontSize: 12, color: '#c9bfff', marginTop: 2 },
});
