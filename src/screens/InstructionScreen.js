import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import BackArrow from '../customs/backArrow';

const Section = ({ icon, iconColor, title, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionIcon, { backgroundColor: `${iconColor}26` }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
    <View style={styles.sectionCard}>{children}</View>
  </View>
);

const Row = ({ label, value, valueColor = '#9ee86f', last = false }) => (
  <View style={[styles.row, !last && styles.rowDivider]}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, { color: valueColor }]}>{value}</Text>
  </View>
);

const InstructionScreen = () => {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#5D1A99', '#1A2D85']} style={styles.gradient}>
        <View style={styles.header}>
          <BackArrow color="#fff" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>How to Play</Text>
          <View style={{ width: 30 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* POINTS VERSION (disabled):
          <Text style={styles.intro}>
            Answer trivia questions correctly to earn points, build streaks,
            and climb the leaderboard. Here's exactly how scoring works.
          </Text>

          <Section icon="lightning-bolt" iconColor="#60a5fa" title="Playing a Quiz">
            <Row label="Time per question" value="15 sec" valueColor="#fff" last />
          </Section>

          <Section icon="star-four-points" iconColor="#22c55e" title="Scoring">
            <Row label="Correct answer" value="+5 pts" />
            <Row label="Wrong answer" value="-1 pt" valueColor="#ff6b6b" />
            <Row
              label="Time runs out"
              value="No change"
              valueColor="#d1d5db"
              last
            />
          </Section>

          <Section icon="fire" iconColor="#f59e0b" title="Streak Bonuses">
            <Row label="10 correct in a row" value="+30 pts" />
            <Row label="20 correct in a row" value="+50 pts" />
            <Row label="Every 10 more after that" value="+50 pts" last />
          </Section>

          <Section icon="gift" iconColor="#c084fc" title="Daily Bonuses">
            <Row label="Daily login bonus (once a day)" value="+2 pts" />
            <Row
              label="Watch a rewarded ad (up to 5/day)"
              value="+30 pts"
              last
            />
          </Section>

          <Section icon="trophy" iconColor="#9ee86f" title="Leaderboard">
            <Row label="Ranked by" value="Total points" valueColor="#fff" last />
          </Section>
          */}

          <Text style={styles.intro}>
            Answer trivia questions correctly to build up a real cash balance.
            Here's exactly how earning and cashing out works.
          </Text>

          <Section icon="lightning-bolt" iconColor="#60a5fa" title="Playing a Quiz">
            <Row label="Time per question" value="15 sec" valueColor="#fff" last />
          </Section>

          <Section icon="cash-multiple" iconColor="#22c55e" title="Scoring">
            <Row label="Correct answer" value="+$0.02" />
            <Row label="Wrong answer" value="-$0.01" valueColor="#ff6b6b" />
            <Row
              label="Time runs out"
              value="No change"
              valueColor="#d1d5db"
              last
            />
          </Section>

          <Section icon="fire" iconColor="#f59e0b" title="Streak Bonuses">
            <Row label="10 correct in a row" value="+$0.03" />
            <Row label="20 correct in a row" value="+$0.04" />
            <Row label="Every 10 more after that" value="+$0.04" last />
          </Section>

          <Section icon="gift" iconColor="#c084fc" title="Bonuses">
            {/* No daily login bonus - see comment above ("No daily login rewards"). */}
            <Row
              label="Watch a rewarded ad (up to 5/day)"
              value="+$0.02"
              last
            />
          </Section>

          <Section icon="bank" iconColor="#9ee86f" title="Cashing Out">
            <Row label="Minimum withdrawal" value="$50.00" />
            <Row label="Methods" value="Bank Transfer / PayPal" valueColor="#fff" last />
          </Section>

          <View style={styles.noteBox}>
            <Icon name="information-outline" size={16} color="#fbbf24" />
            <Text style={styles.noteText}>
              Withdrawal requests are reviewed and paid out by our team - they
              don't process instantly. You'll see the status update once it's
              approved.
            </Text>
          </View>
        </ScrollView>
      </LinearGradient>

      <StatusBar barStyle="light-content" backgroundColor="#5D1A99" />
    </View>
  );
};

export default InstructionScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 45,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 50 },
  intro: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 10 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sectionCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 16,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  rowLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 14, flex: 1, paddingRight: 10 },
  rowValue: { fontSize: 15, fontWeight: '800' },

  noteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(251,191,36,0.12)',
    borderRadius: 12,
    padding: 14,
    marginTop: 4,
  },
  noteText: {
    flex: 1,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    lineHeight: 18,
  },
});
