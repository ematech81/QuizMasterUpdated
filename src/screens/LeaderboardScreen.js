import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackArrow from '../customs/backArrow';
import { fetchLeaderboard } from '../api/leaderboard';
// import { formatPoints } from '../utils/formatPoints'; // only used by the disabled points version

export default function LeaderboardScreen({ navigation }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    load().finally(() => setIsLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <Text style={styles.rank}>#{item.rank}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.correct}>{item.correctAnswers} correct answers</Text>
      </View>
      {/* POINTS VERSION (disabled): <Text style={styles.amount}>{formatPoints(item.totalEarnings)} pts</Text> */}
      <Text style={styles.amount}>${item.totalEarnings.toFixed(2)}</Text>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={['#6D5DFB', '#FA56B1']} style={styles.header}>
        <BackArrow color="#fff" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>{'\u{1F3C6}'} Leaderboard</Text>
        <View style={{ width: 40 }} />
      </LinearGradient>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#6D5DFB" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : leaderboard.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No players yet. Be the first!</Text>
        </View>
      ) : (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => String(item.rank)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  headerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { color: '#ef4444', textAlign: 'center', marginBottom: 12 },
  retryBtn: { backgroundColor: '#6D5DFB', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: 'white', fontWeight: 'bold' },
  emptyText: { color: '#6b7280', fontSize: 15 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  rank: { fontSize: 16, fontWeight: 'bold', color: '#6D5DFB', width: 40 },
  username: { fontSize: 16, fontWeight: '600', color: '#111' },
  correct: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  amount: { fontSize: 16, fontWeight: 'bold', color: '#22c55e' },
});
