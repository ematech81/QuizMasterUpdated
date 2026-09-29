import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { formatPoints } from '../utils/formatPoints'; // only used by the disabled points version

export default function ResultsScreen({ route, navigation }) {
  const {
    category,
    totalQuestions = 0,
    correct = 0,
    wrong = 0,
    timeout = 0,
    moneyEarned = 0,
    lifetimeStats,
  } = route.params || {};

  const isPositive = moneyEarned >= 0;
  const accuracy = totalQuestions > 0 ? Math.round((correct / totalQuestions) * 100) : 0;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#5D1A99', '#1A2D85']} style={styles.gradient}>
        <Text style={styles.title}>Quiz Complete!</Text>
        <Text style={styles.category}>{category}</Text>

        {/* POINTS VERSION (disabled):
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>
            {isPositive ? 'You earned' : 'Net change'}
          </Text>
          <Text style={[styles.pointsValue, { color: isPositive ? '#22c55e' : '#ef4444' }]}>
            {isPositive ? '+' : ''}{formatPoints(pointsEarned)} pts
          </Text>
        </View>
        */}
        <View style={styles.pointsCard}>
          <Text style={styles.pointsLabel}>
            {isPositive ? 'You earned' : 'Net change'}
          </Text>
          <Text style={[styles.pointsValue, { color: isPositive ? '#22c55e' : '#ef4444' }]}>
            {isPositive ? '+' : ''}${moneyEarned.toFixed(2)}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{correct}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{wrong}</Text>
            <Text style={styles.statLabel}>Wrong</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{timeout}</Text>
            <Text style={styles.statLabel}>Timed Out</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{accuracy}%</Text>
            <Text style={styles.statLabel}>Accuracy</Text>
          </View>
        </View>

        {lifetimeStats?.consecutiveCorrect > 0 && (
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {'\u{1F525}'} {lifetimeStats.consecutiveCorrect} answer streak
            </Text>
          </View>
        )}

        {/* POINTS VERSION (disabled): <Text style={styles.lifetimeText}>Total points: {formatPoints(lifetimeStats.totalEarnings)}</Text> */}
        {lifetimeStats && (
          <Text style={styles.lifetimeText}>
            Total balance: ${lifetimeStats.totalEarnings.toFixed(2)}
          </Text>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.replace('Category')}
        >
          <Text style={styles.primaryBtnText}>Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => navigation.replace('HomeScreen')}
        >
          <Text style={styles.secondaryBtnText}>Back to Home</Text>
        </TouchableOpacity>
      </LinearGradient>
      <StatusBar barStyle="light-content" backgroundColor="#5D1A99" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#5D1A99' },
  gradient: { flex: 1, alignItems: 'center', padding: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  category: { fontSize: 16, color: 'rgba(255,255,255,0.75)', marginBottom: 24 },
  pointsCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 24,
  },
  pointsLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginBottom: 6 },
  pointsValue: { fontSize: 36, fontWeight: 'bold' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  streakBadge: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  streakText: { color: 'white', fontWeight: 'bold' },
  lifetimeText: { color: '#9ee86f', fontSize: 15, fontWeight: '600', marginBottom: 24 },
  primaryBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 16,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  secondaryBtn: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  secondaryBtnText: { color: 'rgba(255,255,255,0.8)', fontSize: 15, fontWeight: '600' },
});
