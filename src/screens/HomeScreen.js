import React, { useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { QuizContext } from '../Context/QuizContext';
import BannerAdSlot from '../ads/BannerAdSlot';
import { useRewardedAd } from '../ads/useRewardedAd';
import { watchAdForReward /* , claimDailyStreak */ } from '../api/rewards';
import { fetchLeaderboard } from '../api/leaderboard';
import colors from '../theme/colors';
// import { formatPoints } from '../utils/formatPoints'; // only used by the disabled points version

export default function HomeScreen() {
  const navigation = useNavigation();
  const { stats, dailyStreak, adRewards, user, categories, logOut, refreshWallet } =
    useContext(QuizContext);
  const { showRewardedAd, isPlaying } = useRewardedAd();

  // Daily login bonus disabled ("No daily login rewards") - state/handler kept
  // commented out below, not deleted.
  // const [isClaimingStreak, setIsClaimingStreak] = useState(false);
  const [topPlayers, setTopPlayers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([
      refreshWallet().catch(() => {}),
      fetchLeaderboard()
        .then((data) => setTopPlayers(data.slice(0, 3)))
        .catch(() => {}),
    ]);
  }, [refreshWallet]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  // const today = new Date().toISOString().split('T')[0];
  // const streakClaimedToday = dailyStreak?.lastClaimedDate === today;
  const adsLeftToday = Math.max(0, 5 - (adRewards?.count || 0));

  const handleWatchAd = async () => {
    if (adsLeftToday <= 0) {
      Alert.alert('Limit reached', "You've watched all your rewarded ads for today. Come back tomorrow!");
      return;
    }
    await showRewardedAd();
    try {
      const result = await watchAdForReward();
      await refreshWallet();
      Alert.alert('Reward Earned!', result.message);
    } catch (err) {
      Alert.alert('Unavailable', err.message);
    }
  };

  // Daily login bonus disabled ("No daily login rewards") - kept commented
  // out, not deleted, in case it's re-enabled later.
  // const handleClaimStreak = async () => {
  //   if (streakClaimedToday || isClaimingStreak) return;
  //   setIsClaimingStreak(true);
  //   try {
  //     const result = await claimDailyStreak();
  //     await refreshWallet();
  //     Alert.alert('Daily Bonus!', result.message);
  //   } catch (err) {
  //     Alert.alert('Unavailable', err.message);
  //   } finally {
  //     setIsClaimingStreak(false);
  //   }
  // };

  const handleQuickPlay = () => {
    if (!categories?.length) return;

    // First-time players (never attempted a question in any category) get a
    // familiar, well-known category instead of a random one on their very
    // first tap - random can hand a brand-new user something niche like
    // "Art" or "Technology" before they know what the app even is.
    const isFirstTimePlayer = stats.totalAttemptedQuestions === 0;

    const category = isFirstTimePlayer
      ? categories.find((c) => c.name === 'General') || categories[0]
      : categories[Math.floor(Math.random() * categories.length)];

    navigation.navigate('Question', { categoryName: category.name });
  };

  const handleSignOut = () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logOut() },
    ]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/icon/QuizMaster-2.png')}
            style={styles.headerLogo}
          />
          <View>
            <Text style={styles.headerTitle}>QuizMaster</Text>
            <Text style={styles.headerSubtitle}>Home</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {/* POINTS VERSION (disabled):
          <View style={styles.headerPill}>
            <Icon name="star-four-points" size={16} color={colors.primaryContainer} />
            <Text style={styles.headerPillTextGreen}>{formatPoints(stats.totalEarnings)} pts</Text>
          </View>
          <View style={styles.headerPill}>
            <Icon name="fire" size={16} color={colors.error} />
            <Text style={styles.headerPillText}>{dailyStreak?.count || 0}</Text>
          </View>
          */}
          <View style={styles.headerPill}>
            <Icon name="cash" size={16} color={colors.primaryContainer} />
            <Text style={styles.headerPillTextGreen}>${stats.totalEarnings.toFixed(2)}</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} hitSlop={8} style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.username ? user.username.charAt(0).toUpperCase() : '?'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#fff" />
        }
      >
        {/* Welcome */}
        <View style={styles.welcomeRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>Play & earn real cash</Text>
            <Text style={styles.welcomeText}>
              Welcome back, {user?.username || 'Player'}!
            </Text>
          </View>
          {/* Daily login bonus disabled ("No daily login rewards"), kept
          commented out, not deleted:
          <TouchableOpacity
            style={[styles.streakBadge, !streakClaimedToday && styles.streakBadgeActive]}
            onPress={handleClaimStreak}
            disabled={streakClaimedToday || isClaimingStreak}
          >
            {isClaimingStreak ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <>
                <Icon name="fire" size={18} color={colors.error} />
                <Text style={styles.streakBadgeText}>
                  {streakClaimedToday ? `Day ${dailyStreak?.count || 0}` : 'Claim'}
                </Text>
              </>
            )}
          </TouchableOpacity>
          */}
        </View>

        <BannerAdSlot placement="home" />

        {/* Hero Earnings Card */}
        {/* POINTS VERSION (disabled):
        <View style={styles.heroCard}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderLeft}>
              <View style={styles.heroIconBadge}>
                <Icon name="wallet" size={16} color={colors.primaryContainer} />
              </View>
              <Text style={styles.heroLabel}>Total Points</Text>
            </View>
          </View>

          <View style={styles.heroBalanceRow}>
            <Text style={styles.heroBalance}>{formatPoints(stats.totalEarnings)}</Text>
            <Text style={styles.heroBalanceUnit}>PTS</Text>
          </View>

          <View style={styles.heroBreakdownRow}>
            <View style={styles.heroBreakdownPill}>
              <View style={styles.heroBreakdownIcon}>
                <Icon name="lightning-bolt" size={18} color={colors.tertiary} />
              </View>
              <View>
                <Text style={styles.heroBreakdownLabel}>Quiz Points</Text>
                <Text style={styles.heroBreakdownValue}>{formatPoints(stats.earnings)}</Text>
              </View>
            </View>
            <View style={styles.heroBreakdownPill}>
              <View style={styles.heroBreakdownIcon}>
                <Icon name="gift" size={18} color={colors.secondary} />
              </View>
              <View>
                <Text style={styles.heroBreakdownLabel}>Bonus Points</Text>
                <Text style={styles.heroBreakdownValue}>{formatPoints(stats.rewards)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroCtaBtn}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Icon name="trophy" size={20} color={colors.onPrimaryContainer} />
            <Text style={styles.heroCtaBtnText}>VIEW LEADERBOARD</Text>
          </TouchableOpacity>
          <Text style={styles.heroFootnote}>
            Climb the ranks by answering more questions correctly
          </Text>
        </View>
        */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlowTop} />
          <View style={styles.heroGlowBottom} />
          <View style={styles.heroHeader}>
            <View style={styles.heroHeaderLeft}>
              <View style={styles.heroIconBadge}>
                <Icon name="wallet" size={16} color={colors.primaryContainer} />
              </View>
              <Text style={styles.heroLabel}>Total Available Balance</Text>
            </View>
          </View>

          <View style={styles.heroBalanceRow}>
            <Text style={styles.heroBalance}>${stats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.heroBalanceUnit}>USD</Text>
          </View>

          <View style={styles.heroBreakdownRow}>
            <View style={styles.heroBreakdownPill}>
              <View style={styles.heroBreakdownIcon}>
                <Icon name="lightning-bolt" size={18} color={colors.tertiary} />
              </View>
              <View>
                <Text style={styles.heroBreakdownLabel}>Quiz Earnings</Text>
                <Text style={styles.heroBreakdownValue}>${stats.earnings.toFixed(2)}</Text>
              </View>
            </View>
            <View style={styles.heroBreakdownPill}>
              <View style={styles.heroBreakdownIcon}>
                <Icon name="gift" size={18} color={colors.secondary} />
              </View>
              <View>
                <Text style={styles.heroBreakdownLabel}>Bonus Rewards</Text>
                <Text style={styles.heroBreakdownValue}>${stats.rewards.toFixed(2)}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.heroCtaBtn}
            onPress={() => navigation.navigate('ActivityScreen')}
          >
            <Icon name="cash-fast" size={20} color={colors.onPrimaryContainer} />
            <Text style={styles.heroCtaBtnText}>WITHDRAW EARNINGS</Text>
          </TouchableOpacity>
          <Text style={styles.heroFootnote}>
            Minimum withdrawal $50 · requests are reviewed and paid out by our team
          </Text>
        </View>

        {/* Rewarded Ad Banner */}
        <View style={styles.adBanner}>
          <View style={styles.adBannerTop}>
            <View style={styles.liveDotRow}>
              <View style={styles.liveDot} />
              <Text style={styles.adBannerEyebrow}>Bonus Available</Text>
            </View>
            <View style={styles.adBannerBadge}>
              <Icon name="filmstrip" size={13} color={colors.primaryContainer} />
              <Text style={styles.adBannerBadgeText}>{adsLeftToday} left today</Text>
            </View>
          </View>
          <View style={styles.adBannerBody}>
            <View style={{ flex: 1 }}>
              {/* POINTS VERSION (disabled): <Text style={styles.adBannerTitle}>Watch an Ad, Earn 30 pts</Text> */}
              <Text style={styles.adBannerTitle}>Watch an Ad, Earn $0.02</Text>
              <Text style={styles.adBannerSubtitle}>Quick 2-second video · instant reward</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.adBannerBtn, (isPlaying || adsLeftToday <= 0) && { opacity: 0.6 }]}
            onPress={handleWatchAd}
            disabled={isPlaying || adsLeftToday <= 0}
          >
            {isPlaying ? (
              <ActivityIndicator size="small" color={colors.secondary} />
            ) : (
              <>
                <Icon name="play-circle" size={18} color={colors.secondary} />
                <Text style={styles.adBannerBtnText}>
                  {adsLeftToday <= 0 ? 'Come back tomorrow' : 'Watch Now'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Game Hub */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Game Hub</Text>
          <Text style={styles.sectionSubtitle}>Select Game Mode</Text>
        </View>

        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridCard} onPress={handleQuickPlay}>
            <View style={styles.gridCardTopRow}>
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(0,245,160,0.15)' }]}>
                <Icon name="flash" size={22} color={colors.primaryContainer} />
              </View>
            </View>
            <View>
              <Text style={styles.gridCardTitle}>Quick Play</Text>
              <Text style={styles.gridCardSubtitle}>Jump into a random category</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Category')}>
            <View style={styles.gridCardTopRow}>
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(95,233,255,0.15)' }]}>
                <Icon name="shape" size={22} color={colors.tertiaryContainer} />
              </View>
              <View style={styles.gridBadgePill}>
                <Text style={styles.gridBadgePillText}>{categories?.length || 0} Topics</Text>
              </View>
            </View>
            <View>
              <Text style={styles.gridCardTitle}>Categories</Text>
              <Text style={styles.gridCardSubtitle}>Pick your topic</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('Instruction')}>
            <View style={styles.gridCardTopRow}>
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(201,191,255,0.2)' }]}>
                <Icon name="book-open-variant" size={22} color={colors.secondary} />
              </View>
            </View>
            <View>
              <Text style={styles.gridCardTitle}>How to Play</Text>
              <Text style={styles.gridCardSubtitle}>Rules & scoring guide</Text>
            </View>
          </TouchableOpacity>

          {/* POINTS VERSION (disabled):
          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('ActivityScreen')}>
            <View style={styles.gridCardTopRow}>
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(0,245,160,0.15)' }]}>
                <Icon name="chart-box-outline" size={22} color={colors.primaryContainer} />
              </View>
              <View style={styles.gridBadgePill}>
                <Text style={styles.gridBadgePillText}>{stats.correctAnswers} correct</Text>
              </View>
            </View>
            <View>
              <Text style={styles.gridCardTitle}>My Stats</Text>
              <Text style={styles.gridCardSubtitle}>Activity & history</Text>
            </View>
          </TouchableOpacity>
          */}
          <TouchableOpacity style={styles.gridCard} onPress={() => navigation.navigate('ActivityScreen')}>
            <View style={styles.gridCardTopRow}>
              <View style={[styles.gridIconBadge, { backgroundColor: 'rgba(0,245,160,0.15)' }]}>
                <Icon name="bank" size={22} color={colors.primaryContainer} />
              </View>
              <View style={styles.gridBadgePill}>
                <Text style={styles.gridBadgePillText}>Min $50</Text>
              </View>
            </View>
            <View>
              <Text style={styles.gridCardTitle}>Vault & Cash Out</Text>
              <Text style={styles.gridCardSubtitle}>Withdraw your balance</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Top Players preview (real leaderboard data) */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Icon name="trophy" size={18} color={colors.primaryContainer} />
            <Text style={styles.sectionTitle}>Top Players</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={{ gap: 8 }}>
          {topPlayers.length === 0 ? (
            <Text style={styles.emptyText}>Play a quiz to be the first on the board!</Text>
          ) : (
            topPlayers.map((player) => (
              <View key={player.rank} style={styles.playerRow}>
                <Text style={styles.playerRank}>#{player.rank}</Text>
                <View style={styles.playerAvatar}>
                  <Text style={styles.playerAvatarText}>
                    {player.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.playerName} numberOfLines={1}>
                  {player.username}
                </Text>
                {/* POINTS VERSION (disabled): <Text style={styles.playerAmount}>{formatPoints(player.totalEarnings)} pts</Text> */}
                <Text style={styles.playerAmount}>${player.totalEarnings.toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  headerLogo: { width: 32, height: 32, borderRadius: 8 },
  headerTitle: { color: colors.onSurface, fontSize: 16, fontWeight: '800' },
  headerSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },
  headerPillTextGreen: { color: colors.primaryContainer, fontSize: 11, fontWeight: '700' },
  headerPillText: { color: colors.onSurface, fontSize: 11, fontWeight: '700' },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  avatarText: { color: colors.secondary, fontWeight: '800', fontSize: 13 },

  scrollContent: { paddingHorizontal: 16, paddingBottom: 40, gap: 18 },

  welcomeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  eyebrow: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  welcomeText: { color: colors.onSurface, fontSize: 22, fontWeight: '800' },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surfaceHigh,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 20,
  },
  streakBadgeActive: { borderWidth: 1, borderColor: colors.error },
  streakBadgeText: { color: colors.onSurface, fontSize: 12, fontWeight: '700' },

  heroCard: {
    backgroundColor: colors.surfaceLow,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
  },
  heroGlowTop: {
    position: 'absolute',
    top: -60,
    right: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0,245,160,0.12)',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -60,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(71,32,202,0.2)',
  },
  heroHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,245,160,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroBalanceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 14 },
  heroBalance: { color: colors.primaryContainer, fontSize: 38, fontWeight: '800' },
  heroBalanceUnit: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroBreakdownRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  heroBreakdownPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 14,
    padding: 10,
  },
  heroBreakdownIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBreakdownLabel: { color: colors.onSurfaceVariant, fontSize: 10 },
  heroBreakdownValue: { color: colors.onSurface, fontSize: 14, fontWeight: '800' },
  heroCtaBtn: {
    marginTop: 16,
    backgroundColor: colors.primaryContainer,
    borderRadius: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  heroCtaBtnText: { color: colors.onPrimaryContainer, fontWeight: '800', fontSize: 14, letterSpacing: 0.5 },
  heroFootnote: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 10,
  },

  adBanner: {
    backgroundColor: colors.surfaceHigh,
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  adBannerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveDotRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryContainer },
  adBannerEyebrow: {
    color: colors.secondary,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  adBannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  adBannerBadgeText: { color: colors.primaryContainer, fontSize: 11, fontWeight: '700' },
  adBannerBody: { flexDirection: 'row', alignItems: 'center' },
  adBannerTitle: { color: colors.onSurface, fontSize: 17, fontWeight: '800' },
  adBannerSubtitle: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 2 },
  adBannerBtn: {
    backgroundColor: colors.surfaceHighest,
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  adBannerBtnText: { color: colors.secondary, fontWeight: '700', fontSize: 13 },

  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { color: colors.onSurface, fontSize: 16, fontWeight: '800' },
  sectionSubtitle: { color: colors.onSurfaceVariant, fontSize: 11 },
  sectionLink: { color: colors.primaryContainer, fontSize: 12, fontWeight: '700' },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gridCard: {
    width: '48%',
    backgroundColor: colors.surfaceHigh,
    borderRadius: 16,
    padding: 14,
    minHeight: 120,
    justifyContent: 'space-between',
  },
  gridCardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  gridIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridBadgePill: {
    backgroundColor: colors.surfaceHighest,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  gridBadgePillText: { color: colors.tertiaryContainer, fontSize: 9, fontWeight: '800' },
  gridCardTitle: { color: colors.onSurface, fontSize: 14, fontWeight: '800', marginTop: 8 },
  gridCardSubtitle: { color: colors.onSurfaceVariant, fontSize: 11, marginTop: 2 },

  emptyText: { color: colors.onSurfaceVariant, fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceLow,
    borderRadius: 14,
    padding: 10,
  },
  playerRank: { color: colors.onSurfaceVariant, fontSize: 12, fontWeight: '800', width: 24 },
  playerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerAvatarText: { color: colors.tertiaryContainer, fontSize: 11, fontWeight: '800' },
  playerName: { flex: 1, color: colors.onSurface, fontSize: 13, fontWeight: '600' },
  playerAmount: { color: colors.primaryContainer, fontWeight: '800', fontSize: 13 },
});
