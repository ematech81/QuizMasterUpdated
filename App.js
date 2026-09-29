import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Welcome from './src/screens/Welcome';
import HomeScreen from './src/screens/HomeScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import QuestionScreen from './src/screens/QuestionScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AnsweredQuestions from './src/screens/AnsweredQuestions';
import InstructionScreen from './src/screens/InstructionScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import CategoryScreen from './src/screens/CategoryScreen';
import LeaderboardScreen from './src/screens/LeaderboardScreen';

import { QuizProvider, QuizContext } from './src/Context/QuizContext';
import { AdProvider } from './src/ads/AdProvider';

const Stack = createStackNavigator();

function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Welcome" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={Welcome} />
      <Stack.Screen name="SignInScreen" component={SignInScreen} />
      <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator initialRouteName="HomeScreen" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="Question" component={QuestionScreen} />
      <Stack.Screen name="Results" component={ResultsScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="AnsweredQuestions" component={AnsweredQuestions} />
      <Stack.Screen name="Instruction" component={InstructionScreen} />
      <Stack.Screen name="ActivityScreen" component={ActivityScreen} />
      <Stack.Screen name="Category" component={CategoryScreen} />
      <Stack.Screen name="Leaderboard" component={LeaderboardScreen} />
    </Stack.Navigator>
  );
}

function RootNavigator() {
  const { user, isBootstrapping } = useContext(QuizContext);

  if (isBootstrapping) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#6D5DFB" />
      </View>
    );
  }

  return (
    <NavigationContainer>{user ? <MainStack /> : <AuthStack />}</NavigationContainer>
  );
}

const App = () => {
  return (
    <QuizProvider>
      <AdProvider>
        <RootNavigator />
      </AdProvider>
    </QuizProvider>
  );
};

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0d2331' },
});

export default App;
