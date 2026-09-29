import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  StatusBar,
} from 'react-native';
import { QuizContext } from '../Context/QuizContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import BannerAdSlot from '../ads/BannerAdSlot';
import BackArrow from '../customs/backArrow';
import colors from '../theme/colors';
// import { formatPoints } from '../utils/formatPoints'; // only used by the disabled points version

// Vivid per-category colors read well against the dark background and give
// each topic a distinct identity at a glance.
const PALETTE = [
  '#5b4bff',
  '#12c96f',
  '#12a7e0',
  '#e0369e',
  '#f8af12',
  '#f7610b',
];

export default function CategoryScreen({ navigation }) {
  const { categories, hasActiveQuiz, activeQuizSession, isFetchingQuestions, stats } =
    useContext(QuizContext);

  const [selectedCategory, setSelectedCategory] = useState(null);

  useFocusEffect(
    useCallback(() => {
      setSelectedCategory(null);
    }, [])
  );

  const navigateToQuiz = (categoryName, isResume) => {
    setSelectedCategory(null);
    navigation.navigate('Question', { categoryName, isResume });
  };

  const handleCategorySelect = (categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') return;

    setSelectedCategory(categoryName);

    if (hasActiveQuiz && activeQuizSession?.categoryName !== categoryName) {
      Alert.alert(
        'Switch Category?',
        `You have an ongoing quiz in "${activeQuizSession.categoryName}". Do you want to switch to "${categoryName}" instead?\n\nYour earnings and progress are always saved - you can pick up where you left off in ${activeQuizSession.categoryName} any time, and you'll never be asked the same question twice.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSelectedCategory(null) },
          {
            text: `Resume ${activeQuizSession.categoryName}`,
            onPress: () => navigateToQuiz(activeQuizSession.categoryName, true),
          },
          {
            text: `Switch to ${categoryName}`,
            onPress: () => navigateToQuiz(categoryName, false),
          },
        ]
      );
    } else {
      navigateToQuiz(categoryName, false);
    }
  };

  const handleResumeQuiz = () => {
    if (hasActiveQuiz && activeQuizSession) {
      navigateToQuiz(activeQuizSession.categoryName, true);
    }
  };

  const renderCategoryItem = ({ item, index }) => {
    const tileColor = PALETTE[index % PALETTE.length];
    const isActive = activeQuizSession?.categoryName === item.name;
    const isLoading = isFetchingQuestions && selectedCategory === item.name;

    return (
      <TouchableOpacity
        style={[styles.box, { backgroundColor: tileColor }, isActive && styles.activeBox]}
        onPress={() => handleCategorySelect(item.name)}
        disabled={isFetchingQuestions}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="large" color="white" />
        ) : (
          <>
            <View style={styles.iconContainer}>
              <Icon name={item.icon} size={32} color="white" />
            </View>
            <Text style={styles.boxText}>{item.name}</Text>
            {isActive && (
              <View style={styles.activeIndicator}>
                <Text style={styles.activeIndicatorText}>
                  Q{(activeQuizSession.questionIndex || 0) + 1}
                </Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <BackArrow color="#fff" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Categories</Text>
        <View style={{ width: 30 }} />
      </View>
      <Text style={styles.subtitle}>Pick a topic to start earning</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Icon name="wallet" size={16} color={colors.primaryContainer} />
          {/* POINTS VERSION (disabled): <Text style={styles.statValue}>{formatPoints(stats.totalEarnings)}</Text> */}
          <Text style={styles.statValue}>${stats.totalEarnings.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Earnings</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="check-circle" size={16} color="#22c55e" />
          <Text style={styles.statValue}>{stats.correctAnswers}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="fire" size={16} color={colors.error} />
          <Text style={styles.statValue}>{stats.consecutiveCorrect || 0}</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      {hasActiveQuiz && activeQuizSession && (
        <TouchableOpacity style={styles.resumeCard} onPress={handleResumeQuiz} activeOpacity={0.9}>
          <View style={styles.resumeIconContainer}>
            <Icon name="play-circle" size={36} color="#22c55e" />
          </View>
          <View style={styles.resumeTextContainer}>
            <Text style={styles.resumeTitle}>Continue Quiz</Text>
            <Text style={styles.resumeSubtitle}>
              {activeQuizSession.categoryName} · Question{' '}
              {(activeQuizSession.questionIndex || 0) + 1}
            </Text>
            <Text style={styles.resumeTime}>
              {'⏱️'} {activeQuizSession.timeLeft || 15}s remaining
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
      )}

      <BannerAdSlot placement="category" />

      <Text style={styles.sectionTitle}>Choose a Category</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={renderHeader}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContainer: { paddingHorizontal: 16, paddingBottom: 30 },

  headerContainer: { paddingTop: 50, paddingBottom: 10 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { color: colors.onSurface, fontSize: 18, fontWeight: '800' },
  subtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 16,
  },

  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceHigh,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    gap: 2,
  },
  statValue: { color: colors.onSurface, fontSize: 15, fontWeight: '800', marginTop: 2 },
  statLabel: { color: colors.onSurfaceVariant, fontSize: 10 },

  resumeCard: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#22c55e',
  },
  resumeIconContainer: { marginRight: 12 },
  resumeTextContainer: { flex: 1 },
  resumeTitle: { fontSize: 16, fontWeight: 'bold', color: colors.onSurface, marginBottom: 2 },
  resumeSubtitle: { fontSize: 13, color: colors.onSurfaceVariant, marginBottom: 2 },
  resumeTime: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: 12,
    marginTop: 4,
  },

  row: { justifyContent: 'space-between' },
  box: {
    width: '48%',
    borderRadius: 18,
    marginBottom: 14,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
    minHeight: 130,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  activeBox: { borderWidth: 3, borderColor: '#fef08a' },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  boxText: { fontSize: 15, fontWeight: 'bold', color: 'white', textAlign: 'center' },
  activeIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#fef08a',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeIndicatorText: { fontSize: 12, fontWeight: 'bold', color: '#92400e' },
});
