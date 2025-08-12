import React, { useEffect, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Welcome from './src/screens/Welcome';
import HomeScreen from './src/screens/HomeScreen';
import SignInScreen from './src/screens/SignInScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SecondQuestionScreen from './src/screens/SecondQuestionScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import AnsweredQuestions from './src/screens/AnsweredQuestions';
import InstructionScreen from './src/screens/InstructionScreen';
import ActivityScreen from './src/screens/ActivityScreen';
import SecondCategoryScreen from './src/screens/SecondCategoryScreen';
import { QuizContext, QuizProvider } from './src/bibleContext/QuizContext';

const Stack = createStackNavigator();

const App = () => {
  // const { loadStoredData } = useContext(QuizContext);

  // useEffect(() => {
  //   const initializeApp = async () => {
  //     try {
  //       await loadStoredData(); // Load stats, dailyEarnings, etc.
  //     } catch (error) {
  //       console.error('Initialization error:', error);
  //     }
  //   };
  //   initializeApp();
  // }, [loadStoredData]);

  return (
    <QuizProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen
            name="Welcome"
            component={Welcome}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="HomeScreen"
            component={HomeScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignInScreen"
            component={SignInScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="SignUpScreen"
            component={SignUpScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Question"
            component={SecondQuestionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="PaymentScreen"
            component={PaymentScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="AnsweredQuestions"
            component={AnsweredQuestions}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Instruction"
            component={InstructionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ActivityScreen"
            component={ActivityScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Category"
            component={SecondCategoryScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </QuizProvider>
  );
};

export default App;
