import React, { useContext, useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { QuizContext } from '../Context/QuizContext';
import BackArrow from '../customs/backArrow';
import { fetchHistory } from '../api/wallet';
import { decodeHtmlEntities } from '../utils/decodeHtmlEntities';

const EMPTY_PAGE = { items: [], page: 1, hasMore: false, total: 0 };

const AnsweredQuestions = ({ navigation }) => {
  const { user } = useContext(QuizContext);

  const [activeTab, setActiveTab] = useState('missed'); // 'missed' | 'correct'
  const [gotten, setGotten] = useState(EMPTY_PAGE);
  const [missed, setMissed] = useState(EMPTY_PAGE);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [gottenRes, missedRes] = await Promise.all([
        fetchHistory('correct', 1),
        fetchHistory('missed', 1),
      ]);
      setGotten({ items: gottenRes.attempts, page: 1, hasMore: gottenRes.hasMore, total: gottenRes.total });
      setMissed({ items: missedRes.attempts, page: 1, hasMore: missedRes.hasMore, total: missedRes.total });
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

  const activeData = activeTab === 'correct' ? gotten : missed;
  const setActiveData = activeTab === 'correct' ? setGotten : setMissed;

  const handleLoadMore = async () => {
    if (!activeData.hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const nextPage = activeData.page + 1;
      const res = await fetchHistory(activeTab, nextPage);
      setActiveData((prev) => ({
        items: [...prev.items, ...res.attempts],
        page: nextPage,
        hasMore: res.hasMore,
        total: res.total,
      }));
    } catch (err) {
      Alert.alert('Could not load more', err.message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const data = activeData.items;

  const renderItem = ({ item, index }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.badge, activeTab === 'correct' ? styles.badgeGreen : styles.badgeRed]}>
          <Icon name={activeTab === 'correct' ? 'check' : 'close'} size={13} color="#fff" />
        </View>
        <Text style={styles.cardIndex}>Question {index + 1}</Text>
      </View>

      <Text style={styles.questionText}>{decodeHtmlEntities(item.questionText)}</Text>

      <View style={styles.answerRow}>
        <Text style={styles.answerLabel}>Correct answer</Text>
        <Text style={styles.answerValueGreen}>{decodeHtmlEntities(item.correctAnswer)}</Text>
      </View>

      {activeTab === 'missed' && (
        <View style={styles.answerRow}>
          <Text style={styles.answerLabel}>Your answer</Text>
          <Text style={styles.answerValueRed}>
            {item.isTimeout ? 'No answer (timed out)' : decodeHtmlEntities(item.selectedAnswer)}
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      <View style={styles.header}>
        <BackArrow color="#111827" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username ? user.username.charAt(0).toUpperCase() : ''}
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'missed' && styles.tabActive]}
          onPress={() => setActiveTab('missed')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, activeTab === 'missed' && styles.tabTextActive]}>
            Missed ({missed.total})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'correct' && styles.tabActive]}
          onPress={() => setActiveTab('correct')}
          activeOpacity={0.85}
        >
          <Text style={[styles.tabText, activeTab === 'correct' && styles.tabTextActive]}>
            Correct ({gotten.total})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#22c55e" />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, index) => item._id || String(index)}
          renderItem={renderItem}
          style={{ flex: 1 }}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#22c55e" />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon
                name={activeTab === 'correct' ? 'check-circle-outline' : 'close-circle-outline'}
                size={40}
                color="#9ca3af"
              />
              <Text style={styles.emptyText}>
                {activeTab === 'correct'
                  ? 'Your correct answers will appear here once you start playing.'
                  : "No missed questions - you're on a roll!"}
              </Text>
            </View>
          }
          ListFooterComponent={
            data.length === 0 ? null : activeData.hasMore ? (
              <TouchableOpacity
                style={styles.loadMoreBtn}
                onPress={handleLoadMore}
                disabled={isLoadingMore}
                activeOpacity={0.85}
              >
                {isLoadingMore ? (
                  <ActivityIndicator size="small" color="#22c55e" />
                ) : (
                  <Text style={styles.loadMoreText}>Load More</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.endText}>You've reached the end</Text>
            )
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 50,
    paddingBottom: 14,
  },
  headerTitle: { color: '#111827', fontSize: 18, fontWeight: '800' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#15803d', fontSize: 13, fontWeight: '800' },

  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 9,
    alignItems: 'center',
  },
  tabActive: { backgroundColor: '#22c55e' },
  tabText: { color: '#6b7280', fontSize: 13, fontWeight: '700' },
  tabTextActive: { color: '#ffffff' },

  listContent: { paddingHorizontal: 16, paddingBottom: 40, flexGrow: 1 },

  card: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGreen: { backgroundColor: '#22c55e' },
  badgeRed: { backgroundColor: '#ef4444' },
  cardIndex: { color: '#6b7280', fontSize: 12, fontWeight: '700' },

  questionText: { color: '#111827', fontSize: 15, lineHeight: 21, marginBottom: 12 },

  answerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  answerLabel: { color: '#6b7280', fontSize: 12 },
  answerValueGreen: { color: '#16a34a', fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  answerValueRed: { color: '#dc2626', fontSize: 13, fontWeight: '700', flexShrink: 1, textAlign: 'right' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  errorText: { color: '#dc2626', textAlign: 'center', marginBottom: 12 },
  retryBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: { color: '#ffffff', fontWeight: '800' },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 12 },
  emptyText: {
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 30,
  },

  loadMoreBtn: {
    alignSelf: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 28,
    paddingVertical: 11,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
    minWidth: 120,
    alignItems: 'center',
  },
  loadMoreText: { color: '#16a34a', fontWeight: '800', fontSize: 13 },
  endText: {
    color: '#9ca3af',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
});

export default AnsweredQuestions;
