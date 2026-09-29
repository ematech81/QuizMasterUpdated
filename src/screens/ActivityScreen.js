import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
} from 'react-native';
import React, { useContext, useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { QuizContext } from '../Context/QuizContext';
import BackArrow from '../customs/backArrow';
// import { formatPoints } from '../utils/formatPoints'; // only used by the disabled points version

const ActivityScreen = ({ navigation }) => {
  const { stats, user, refreshWallet } = useContext(QuizContext);

  useFocusEffect(
    useCallback(() => {
      refreshWallet().catch(() => {});
    }, [refreshWallet])
  );

  const canWithdraw = stats.totalEarnings >= 50;

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#e2e8f0',
        position: 'relative',
      }}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 50 }}
      >
        {/* header */}
        <View
          style={{
            justifyContent: 'space-between',
            alignItems: 'center',
            flexDirection: 'row',
          }}
        >
          <BackArrow color="#0d2331" onPress={() => navigation.goBack()} />
          <Text style={styles.title}>QuizMaster</Text>
          <View style={styles.nameContainer}>
            <Text style={styles.name}>
              {user?.username ? user.username.charAt(0).toUpperCase() : ''}
            </Text>
          </View>
        </View>

        {/* POINTS VERSION (disabled):
        <View style={styles.earningBlock}>
          <View style={styles.earning}>
            <Text style={styles.earningText}>Total Points</Text>
            <Text style={styles.earningAmount}>{formatPoints(stats.totalEarnings)} pts</Text>
          </View>

          <TouchableOpacity
            style={styles.touchable}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={{ fontWeight: 'bold', color: 'green' }}>See Ranking</Text>
          </TouchableOpacity>
        </View>
        */}
        <View style={styles.earningBlock}>
          <View style={styles.earning}>
            <Text style={styles.earningText}>Total Earning</Text>
            <Text style={styles.earningAmount}>${stats.totalEarnings.toFixed(2)}</Text>
          </View>

          <TouchableOpacity
            style={styles.touchable}
            onPress={() => navigation.navigate('PaymentScreen')}
            disabled={!canWithdraw}
          >
            <Text style={{ fontWeight: 'bold', color: canWithdraw ? 'green' : '#9ca3af' }}>
              Withdraw
            </Text>
          </TouchableOpacity>

          {!canWithdraw && (
            <Text style={{ color: '#fee2e2', textAlign: 'center', fontSize: 12, marginBottom: 4 }}>
              You need ${(50 - stats.totalEarnings).toFixed(2)} more to withdraw.
            </Text>
          )}

          <Text style={{ color: 'white', textAlign: 'center' }}>
            Minimum withdrawal:
            <Text style={{ fontWeight: '900', color: '#fff' }}> $50</Text>
          </Text>
        </View>

        <View style={styles.ActivityBlock}>
          <Text style={{ fontSize: 20, color: '#f97316', fontWeight: 'bold' }}>Activities</Text>
        </View>

        {/* activities */}
        <View style={styles.historyContainer}>
          <View style={styles.historyContent}>
            <Text style={styles.historyText}>Attempted Questions</Text>
            <Text style={styles.figures}>{stats.totalAttemptedQuestions}</Text>
          </View>
          <View style={styles.historyContent}>
            <Text style={styles.historyText}>Correct Answers</Text>
            <Text style={styles.figures}>{stats.correctAnswers}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnsweredQuestions')}>
              <Text style={styles.viewAnswer}>View Answers</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.historyContainer}>
          <View style={styles.historyContent}>
            <Text style={styles.historyText}>Missed Questions</Text>
            <Text style={styles.figures}>{stats.wrongAnswers}</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AnsweredQuestions')}>
              <Text style={styles.viewAnswer}>View Questions</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.historyContent}>
            <Text style={styles.historyText}>Current Streak</Text>
            <Text style={styles.figures}>{'\u{1F525}'} {stats.consecutiveCorrect}</Text>
          </View>
        </View>

        <View style={styles.historyContent1}>
          <TouchableOpacity
            style={{ alignSelf: 'center' }}
            onPress={() => navigation.navigate('Leaderboard')}
          >
            <Text style={{ fontWeight: 'bold', color: 'white' }}>
              {'\u{1F3C6}'} See how you rank
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <StatusBar backgroundColor="#e2e8f0" barStyle="dark-content" />
    </SafeAreaView>
  );
};

export default ActivityScreen;

const styles = StyleSheet.create({
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0d2331',
  },
  nameContainer: {
    borderRadius: 100,
    borderColor: '#4ca771',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
    borderWidth: 3,
  },
  name: {
    color: '#0d2331',
    fontSize: 14,
    fontWeight: '900',
  },
  container: {
    padding: 16,
    marginTop: 20,
    paddingBottom: 50,
  },
  earningBlock: {
    backgroundColor: 'green',
    elevation: 20,
    borderRadius: 10,
    marginVertical: 20,
    padding: 16,
  },
  earning: {
    justifyContent: 'space-between',
    alignItems: 'center',
    flexDirection: 'row',
  },
  earningText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
  },
  earningAmount: {
    fontWeight: '900',
    fontSize: 16,
    color: 'white',
  },
  touchable: {
    backgroundColor: '#fed7aa',
    alignSelf: 'center',
    width: 150,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
    borderRadius: 10,
  },
  ActivityBlock: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
    padding: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
  },
  historyContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    flexDirection: 'row',
    gap: 10,
  },
  historyContent: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    height: 100,
    backgroundColor: '#cdd5e1',
    padding: 2,
  },
  historyContent1: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    backgroundColor: 'green',
    padding: 2,
    marginTop: 30,
  },
  historyText: {
    color: '#525252',
    fontWeight: 'bold',
    fontSize: 13,
  },
  viewAnswer: {
    color: 'green',
    marginVertical: 7,
    fontSize: 10,
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
  figures: {
    color: '#f97316',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
