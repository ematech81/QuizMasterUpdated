import React, { useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import StatusBarComponent from '../customs/StatusBar';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { QuizContext } from '../bibleContext/QuizContext';

export default function HomeScreen() {
  const navigation = useNavigation();

  const {
    categories,
    setCurrentCategory,
    rewards,
    earnings,
    totalEarnings,
    startTimer,
    stopTimer,
    clearQuizState,
    loadStoredData,
    setQuestions,
    setCurrentQuestionIndex,
    setRemainingTime,
    fetchQuestions,
    logOut,
    user,
    username,
    stats,
  } = useContext(QuizContext);

  // useFocusEffect(
  //   React.useCallback(() => {
  //     startTimer(); // Start timer when screen is focused

  //     return () => {
  //       stopTimer(); // Stop timer when screen loses focus
  //     };
  //   }, [])
  // );

  const handleSignOut = async () => {
    await logOut();
  };

  return (
    <LinearGradient colors={['#6D5DFB', '#FA56B1']} style={styles.container}>
      <StatusBarComponent />
      {/* Profile Icon */}
      <Text style={styles.title}>QuizMaster</Text>
      {/* Earnings Card */}
      <LinearGradient
        colors={['#002f7f', '#0044cc']}
        style={styles.earningsCard}
      >
        {user ? (
          <>
            <View
            // style={{ alignItems: 'center', justifyContent: 'center', padding: 8 }}
            >
              <Text style={styles.moneyBag}>💰</Text>
              <Text style={styles.totalAmount}>
                {' '}
                ${stats.totalEarnings.toFixed(2)}
              </Text>
            </View>
            <Text style={styles.subText}>
              Earnings:{' '}
              <Text style={styles.amount}> ${stats.earnings.toFixed(2)}</Text>
            </Text>
            <Text style={styles.subText}>
              Rewards:{' '}
              <Text style={styles.amount}>${stats.rewards.toFixed(2)}</Text>
            </Text>
          </>
        ) : (
          <>
            <View
            // style={{ alignItems: 'center', justifyContent: 'center', padding: 8 }}
            >
              <Text style={styles.noEarnings}>Your current Earnings:</Text>
              <Text style={styles.totalAmount}> $0.00</Text>
            </View>
            <Text style={styles.subText}>
              Earnings: <Text style={styles.amount}> $0.00</Text>
            </Text>
            <Text style={styles.subText}>
              Rewards: <Text style={styles.amount}>$0.00</Text>
            </Text>
          </>
        )}
      </LinearGradient>

      {/* Buttons */}
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.buttonWhite}
          onPress={() => navigation.navigate('Question')}
        >
          <Text style={styles.buttonIcon}>❓❓</Text>
          <Text style={styles.buttonText}>Questions</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonWhite}
          onPress={() => navigation.navigate('Category')}
        >
          {/* Placeholder for icon */}
          <Text style={styles.buttonIcon}>🔍</Text>
          <Text style={styles.buttonText}>Categories</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.buttonWhite}
          onPress={() => navigation.navigate('Instruction')}
        >
          {/* Placeholder for icon */}
          <Text style={styles.buttonIcon}>❔</Text>
          <Text style={styles.buttonText}>Instruction</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonGreen}
          onPress={() => navigation.navigate('ActivityScreen')}
        >
          <Text style={styles.moneyBag}>💰</Text>
          <Text style={styles.buttonText}>WITHDRAW</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#A0FFD1',
    alignSelf: 'center',
    marginTop: 30,
  },
  earningsCard: {
    width: '100%',
    backgroundColor: '#003399',
    borderRadius: 20,
    padding: 20,
    marginVertical: 20,
    // alignItems: 'center',
  },
  moneyBag: {
    fontSize: 24,
  },
  noEarnings: {
    fontSize: 18,
    paddingVertical: 10,
    fontWeight: 'bold',
    color: '#fff',
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00FF66',
  },
  subText: {
    fontSize: 16,
    color: 'white',
    textAlign: 'left',
  },
  amount: {
    color: '#00FF66',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  buttonWhite: {
    backgroundColor: 'white',
    width: '48%',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
    minHeight: 150,
    justifyContent: 'center',
  },
  buttonGreen: {
    backgroundColor: '#C1FF72',
    width: '48%',
    paddingVertical: 15,
    borderRadius: 15,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  buttonIcon: {
    fontSize: 20,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginVertical: 20,
    textAlign: 'center',
  },
});
