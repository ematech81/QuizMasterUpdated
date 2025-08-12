// import React, {
//   useContext,
//   useEffect,
//   useState,
//   useCallback,
//   useRef,
// } from 'react';
// import {
//   View,
//   Text,
//   ActivityIndicator,
//   Button,
//   StyleSheet,
//   SafeAreaView,
//   StatusBar,
//   Alert,
//   BackHandler,
//   Pressable,
//   AppState,
// } from 'react-native';
// import BackArrow from '../customs/backArrow';
// import { QuizContext } from '../bibleContext/QuizContext';
// import {
//   useIsFocused,
//   useNavigation,
//   useRoute,
// } from '@react-navigation/native';
// import { TouchableOpacity } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import NetInfo from '@react-native-community/netinfo';
// import { useFocusEffect } from '@react-navigation/native';
// import { ScrollView } from 'react-native-gesture-handler';
// import { Audio } from 'expo-av';
// // import { Alert, AppState } from 'react-native';

// const QuestionScreen = ({ navigation, route }) => {
//   const [isLoading, setIsLoading] = useState(false);

//   const {
//     fetchQuestions,
//     quizStarted,
//     setQuizStarted,
//     questions,
//     currentQuestionIndex,
//     setCurrentQuestionIndex,
//     selectedOption,
//     setSelectedOption,
//     popupMessage,
//     popupVisible,
//     remainingTime,
//     handleSubmit,
//     // handleStartQuiz,
//     currentCategory,
//     isTimeUp,
//     isSubmitted,
//     stopTimer,
//     startTrackingTime,
//     stopAndSaveTime,
//     setIsFetchingQuestions,
//     isFetchingQuestions,
//     user,
//     stats,
//     setRemainingTime,
//     setIsTimeUp,
//     setPopupMessage,
//     setPopupVisible,
//     setIsSubmitted,
//     startTimer,
//     //  saveCategoryProgress
//   } = useContext(QuizContext);

//   navigation = useNavigation();

//   const { categoryName } = route.params || {};
//   const [startTime, setStartTime] = useState(null); // Track the start time of the question

//   // .....
//   // Initialize startTime when a question is displayed
//   useEffect(() => {
//     const startTime = startTrackingTime();
//     setStartTime(startTime);

//     // Stop timer and save when the screen is exited
//     return () => stopAndSaveTime(startTime);
//   }, []);

//   const isFocused = useIsFocused();

//   useEffect(() => {
//     if (isFocused) {
//       startTimer();
//     } else {
//       stopTimer();
//     }

//     // Cleanup function to ensure the timer is stopped on unmount
//     return () => stopTimer();
//   }, [isFocused]);

//   // Call handleSubmit when the user answers a question (pass whether they were correct or not)
//   const onQuestionAnswered = (isCorrect) => {
//     handleSubmit(isCorrect); // Update correct/failed answers and attempted questions

//     // Stop the timer and save the time spent on this question
//     stopAndSaveTime(startTime);
//   };

//   // Start Quiz function to handle quiz initiation
//   const handleStartQuiz = async () => {
//     try {
//       setIsLoading(true); // Start loading
//       // Fetch questions for the selected category
//       await fetchQuestions(categoryName);

//       // Reset the quiz state and start the quiz timer
//       setQuizStarted(true); // This triggers the quiz UI to appear
//       // setCurrentQuestionIndex(0); // Start from the first question
//       setIsLoading(false); // End loading
//     } catch (error) {
//       console.log('Error starting quiz:', error);
//       setIsLoading(false);
//     }
//   };

//   if (isLoading) {
//     // Show loading indicator while loading
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" color="blue" />
//         <Text style={{ marginTop: 10, color: 'black', fontWeight: 'bold' }}>
//           Loading Question...
//         </Text>
//         <Text>Please wait a seconds...</Text>
//       </View>
//     );
//   }

//   useFocusEffect(
//     useCallback(() => {
//       return () => {
//         // Stop the timer when the screen loses focus
//         stopTimer();
//       };
//     }, [])
//   );

//   const decodeHtmlEntities = (text) => {
//     if (!text) {
//       return ''; // Return an empty string if the input is undefined or null
//     }

//     return text
//       .replace(/&quot;/g, '"') // Replace &quot; with "
//       .replace(/&#039;/g, "'"); // Replace &#039; with '
//     text.replace(/&amp;/g, '&'); // Replace &amp; with &
//     text.replace(/&lt;/g, '<'); // Replace &lt; with <
//     text.replace(/&gt;/g, '>'); // Replace &gt; with >
//   };

//   const currentQuestion = questions[currentQuestionIndex] || {};

//   return (
//     <SafeAreaView style={{ flex: 1, backgroundColor: '#0d2331' }}>
//       <View
//         style={{
//           alignSelf: 'flex-start',
//           marginHorizontal: 5,
//           justifyContent: 'center',
//           alignItems: 'center',
//           flexDirection: 'row',
//           marginTop: 30,
//         }}
//       >
//         <BackArrow
//           color="orange"
//           onPress={() => {
//             navigation.goBack(); // Navigate back
//             stopTimer(); // Stop the timer
//           }}
//         />
//         <Text style={styles.headerText}>QuizMaster</Text>
//       </View>

//       {!quizStarted ? (
//         <View
//           style={{
//             justifyContent: 'center',
//             alignItems: 'center',
//             flex: 1,
//             padding: 16,
//           }}
//         >
//           <Text style={{ color: 'white', fontSize: 22, textAlign: 'center' }}>
//             NOTE:
//           </Text>
//           <Text
//             style={{
//               color: 'white',
//               fontSize: 18,
//               textAlign: 'center',
//               lineHeight: 28,
//             }}
//           >
//             The quiz will start immediately after you press the{' '}
//             <Text style={{ color: '#60a5fa', fontWeight: 'bold' }}>
//               Start Quiz Now
//             </Text>
//             . You will have <Text style={{ color: '#9ee86f' }}>15 seconds</Text>{' '}
//             to answer each question.
//           </Text>
//           <TouchableOpacity
//             style={{
//               marginTop: 20,
//               backgroundColor: 'green',
//               padding: 10,
//               borderRadius: 5,
//             }}
//             onPress={handleStartQuiz}
//           >
//             <Text style={{ color: 'white', fontSize: 16 }}>Start Quiz Now</Text>
//           </TouchableOpacity>
//         </View>
//       ) : (
//         currentQuestion && (
//           <ScrollView
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={{ paddingBottom: 50 }}
//           >
//             <View style={styles.statsContainer}>
//               <View>
//                 <Text style={styles.statsText}>
//                   Earnings: ${stats.earnings.toFixed(2)}
//                 </Text>
//                 <Text style={styles.statsText}>
//                   Rewards: ${stats.rewards.toFixed(2)}
//                 </Text>
//               </View>
//               <View style={styles.timeContainer}>
//                 <Text style={styles.timerText}>{remainingTime}s</Text>
//               </View>
//             </View>

//             <View style={styles.questionContainer}>
//               <View
//                 style={{
//                   justifyContent: 'center',
//                   alignItems: 'center',
//                   flexDirection: 'row',
//                   gap: 18,
//                 }}
//               >
//                 <Text style={styles.questionText}>
//                   QUE: {currentQuestionIndex + 1}/{questions.length}
//                 </Text>
//                 <Text style={styles.questionText}>
//                   CATEG:{' '}
//                   <Text style={{ color: '#9ee86f', fontSize: 17 }}>
//                     {currentQuestion.category}
//                   </Text>
//                 </Text>
//               </View>
//               {isFetchingQuestions && (
//                 // Show loading indicator while loading
//                 <View
//                   style={{ justifyContent: 'center', alignItems: 'center' }}
//                 >
//                   <ActivityIndicator size="large" color="white" />
//                   <Text
//                     style={{
//                       marginTop: 10,
//                       color: 'white',
//                       fontWeight: 'bold',
//                     }}
//                   >
//                     Loading Question...
//                   </Text>
//                 </View>
//               )}

//               <Text style={styles.questionTitle}>
//                 {decodeHtmlEntities(currentQuestion.questionText)}
//               </Text>

//               {currentQuestion.options?.map((option) => (
//                 <TouchableOpacity
//                   key={option} // Use option text as the key
//                   style={[
//                     styles.optionButton,
//                     selectedOption === option && styles.selectedOption,
//                     isSubmitted &&
//                       selectedOption === option &&
//                       selectedOption === currentQuestion.answer &&
//                       styles.correctOption,
//                     isSubmitted &&
//                       selectedOption === option &&
//                       selectedOption !== currentQuestion.answer &&
//                       styles.wrongOption,
//                   ]}
//                   onPress={() => setSelectedOption(option)}
//                   disabled={isSubmitted || isTimeUp}
//                 >
//                   <Text style={styles.optionText}>{option}</Text>
//                 </TouchableOpacity>
//               ))}

//               {selectedOption && (
//                 <View style={styles.submitButtonContainer}>
//                   <TouchableOpacity
//                     style={styles.submitButton}
//                     onPress={handleSubmit}
//                   >
//                     <Text style={styles.submitText}>
//                       {isTimeUp || isSubmitted ? 'Next Question' : 'Submit'}
//                     </Text>
//                   </TouchableOpacity>
//                 </View>
//               )}

//               {/* pop up messages */}
//               {popupVisible && (
//                 <View style={styles.popupContainer}>
//                   <Text
//                     style={{ fontSize: 16, color: 'black', fontWeight: '900' }}
//                   >
//                     {popupMessage.includes('Correct! You earned $0.1') ? (
//                       <Text style={{ fontSize: 20 }}>
//                         Correct! You earned{' '}
//                         <Text style={{ fontWeight: '900', color: 'green' }}>
//                           $0.1
//                         </Text>
//                       </Text>
//                     ) : popupMessage.includes('Wrong! You lost $0.01') ? (
//                       <Text style={{ fontSize: 20 }}>
//                         Wrong answer! You lose{' '}
//                         <Text style={{ fontWeight: '900', color: 'red' }}>
//                           $0.01
//                         </Text>
//                       </Text>
//                     ) : popupMessage.includes(
//                         'Bonus! 10 correct answers! You earned $0.5'
//                       ) ? (
//                       <Text style={{ fontSize: 18 }}>
//                         Bonus! 10 correct answers You earned{' '}
//                         <Text
//                           style={{
//                             fontWeight: '900',
//                             color: 'green',
//                             fontSize: 25,
//                           }}
//                         >
//                           $0.5
//                         </Text>
//                       </Text>
//                     ) : popupMessage.includes(
//                         'Amazing! 20 correct answers! You earned $1'
//                       ) ? (
//                       <Text style={{ fontSize: 18 }}>
//                         Amazing! 20 correct answers in a row! You earned{' '}
//                         <Text
//                           style={{
//                             fontWeight: '900',
//                             color: 'green',
//                             fontSize: 22,
//                           }}
//                         >
//                           $1
//                         </Text>
//                       </Text>
//                     ) : popupMessage.includes('Time Up! No Earning.') ? (
//                       <Text style={{ fontSize: 18 }}>Time Up! No Earning.</Text>
//                     ) : null}
//                   </Text>
//                 </View>
//               )}
//             </View>
//           </ScrollView>
//         )
//       )}

//       <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
//     </SafeAreaView>
//   );
// };

// export default QuestionScreen;

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  Button,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { QuizContext } from '../bibleContext/QuizContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const QuestionScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const {
    fetchQuestions,
    quizStarted,
    setQuizStarted,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedOption,
    setSelectedOption,
    popupMessage,
    setPopupMessage,
    popupVisible,
    setPopupVisible,
    remainingTime,
    setRemainingTime,
    isTimeUp,
    setIsTimeUp,
    isSubmitted,
    setIsSubmitted,
    startTrackingTime,
    stopAndSaveTime,
    isFetchingQuestions,
    setIsFetchingQuestions,
    stats,
    setStats,
    handleSubmit,
  } = useContext(QuizContext);
  const { categoryName } = route.params || {};
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const intervalIdRef = useRef(null);
  const timeoutIdRef = useRef(null);

  const startTimer = useCallback(
    (duration = 15) => {
      console.log('Starting timer with duration:', duration);
      if (intervalIdRef.current) {
        console.log('Timer already running, skipping:', intervalIdRef.current);
        return;
      }
      setRemainingTime(duration);
      intervalIdRef.current = setInterval(() => {
        setRemainingTime((prevTime) => {
          console.log('Timer tick:', prevTime);
          if (prevTime <= 0) {
            console.log('Time up, clearing interval:', intervalIdRef.current);
            clearInterval(intervalIdRef.current);
            intervalIdRef.current = null;
            handleTimeUp();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    },
    [handleTimeUp, setRemainingTime]
  );

  const stopTimer = useCallback(() => {
    console.log('Stopping timer:', intervalIdRef.current);
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
  }, []);

  const handleTimeUp = useCallback(() => {
    setIsTimeUp(true);
    setPopupMessage('Time Up! No Earning.');
    setPopupVisible(true);
    timeoutIdRef.current = setTimeout(() => {
      setPopupVisible(false);
      moveToNextQuestion();
    }, 3000);
  }, [moveToNextQuestion, setIsTimeUp, setPopupMessage, setPopupVisible]);

  const moveToNextQuestion = useCallback(async () => {
    try {
      if (!categoryName || typeof categoryName !== 'string') {
        throw new Error('Invalid categoryName');
      }
      await AsyncStorage.setItem(
        `quizState_${categoryName}`,
        JSON.stringify({
          categoryName,
          questionIndex: currentQuestionIndex + 1,
          timeLeft: 15,
        })
      );
      setSelectedOption(null);
      setRemainingTime(15);
      setIsTimeUp(false);
      setIsSubmitted(false);

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        startTimer(15);
      } else {
        navigation.navigate('ResultsScreen', { stats });
      }
    } catch (error) {
      console.error('Error moving to next question:', error);
      setError('Failed to move to next question');
    }
  }, [
    categoryName,
    currentQuestionIndex,
    questions,
    navigation,
    startTimer,
    stats,
  ]);

  const onQuestionAnswered = useCallback(
    (isCorrect) => {
      try {
        handleSubmit(isCorrect);
        stopAndSaveTime(startTime);
        stopTimer();
        timeoutIdRef.current = setTimeout(() => {
          setPopupVisible(false);
          setIsSubmitted(false);
          moveToNextQuestion();
        }, 3000);
      } catch (error) {
        console.error('Error handling answer:', error);
        setError('Failed to submit answer');
      }
    },
    [
      handleSubmit,
      stopAndSaveTime,
      startTime,
      stopTimer,
      moveToNextQuestion,
      setPopupVisible,
      setIsSubmitted,
    ]
  );

  const handleStartQuiz = useCallback(async () => {
    if (!categoryName || typeof categoryName !== 'string') {
      setError('Invalid category selected');
      return;
    }
    try {
      setIsLoading(true);
      setIsFetchingQuestions(true);
      await fetchQuestions(categoryName);
      setQuizStarted(true);
      setCurrentQuestionIndex(0);
      const savedState = await AsyncStorage.getItem(
        `quizState_${categoryName}`
      );
      if (savedState) {
        const { questionIndex, timeLeft } = JSON.parse(savedState);
        setCurrentQuestionIndex(questionIndex || 0);
        setRemainingTime(timeLeft || 15);
        startTimer(timeLeft || 15);
      } else {
        setRemainingTime(15);
        startTimer(15);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
      setIsFetchingQuestions(false);
    }
  }, [
    categoryName,
    fetchQuestions,
    setQuizStarted,
    setCurrentQuestionIndex,
    setIsFetchingQuestions,
    startTimer,
  ]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('AppState changed to:', nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (categoryName && quizStarted) {
          AsyncStorage.setItem(
            `quizState_${categoryName}`,
            JSON.stringify({
              categoryName,
              questionIndex: currentQuestionIndex,
              timeLeft: remainingTime,
            })
          ).catch((error) => console.error('Error saving quiz state:', error));
          stopTimer();
          stopAndSaveTime(startTime);
        }
      } else if (nextAppState === 'active' && quizStarted) {
        setPopupMessage('Quiz resumed!');
        setPopupVisible(true);
        setTimeout(() => setPopupVisible(false), 1000);
        if (remainingTime > 0) {
          startTimer(remainingTime);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      stopTimer();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      subscription.remove();
    };
  }, [
    categoryName,
    quizStarted,
    currentQuestionIndex,
    remainingTime,
    stopTimer,
    startTimer,
    stopAndSaveTime,
    startTime,
  ]);

  useEffect(() => {
    if (isFocused && quizStarted && remainingTime > 0) {
      startTimer(remainingTime);
    } else if (!isFocused) {
      stopTimer();
    }
    return () => stopTimer();
  }, [isFocused, quizStarted, remainingTime, startTimer, stopTimer]);

  useEffect(() => {
    console.log('QuestionScreen mounted with category:', categoryName);
    if (categoryName && !quizStarted) {
      handleStartQuiz();
    }
    return () => {
      console.log('QuestionScreen unmounting');
      stopTimer();
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [categoryName, quizStarted, handleStartQuiz, stopTimer]);

  useEffect(() => {
    if (quizStarted) {
      const startTime = startTrackingTime();
      setStartTime(startTime);
      return () => stopAndSaveTime(startTime);
    }
  }, [quizStarted, startTrackingTime, stopAndSaveTime]);

  const decodeHtmlEntities = (text) => {
    if (!text) return '';
    return text
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  };

  const currentQuestion = questions[currentQuestionIndex] || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            navigation.goBack();
            stopTimer();
          }}
        >
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>QuizMaster</Text>
      </View>

      {isLoading || isFetchingQuestions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading Question...</Text>
        </View>
      ) : error ? (
        <Text style={styles.errorText}>Error: {error}</Text>
      ) : !quizStarted ? (
        <View style={styles.startContainer}>
          <Text style={styles.noteText}>NOTE:</Text>
          <Text style={styles.instructionText}>
            The quiz will start immediately after you press the{' '}
            <Text style={styles.highlightText}>Start Quiz Now</Text>. You will
            have <Text style={styles.timeText}>15 seconds</Text> to answer each
            question.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startButtonText}>Start Quiz Now</Text>
          </TouchableOpacity>
        </View>
      ) : questions.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.statsContainer}>
            <View>
              <Text style={styles.statsText}>
                Earnings: ${stats.earnings.toFixed(2)}
              </Text>
              <Text style={styles.statsText}>
                Rewards: ${stats.rewards.toFixed(2)}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              <Text style={styles.timerText}>{remainingTime}s</Text>
            </View>
          </View>

          <View style={styles.questionContainer}>
            <View style={styles.questionHeader}>
              <Text style={styles.questionText}>
                QUE: {currentQuestionIndex + 1}/{questions.length}
              </Text>
              <Text style={styles.questionText}>
                CATEG: <Text style={styles.categoryText}>{categoryName}</Text>
              </Text>
            </View>

            <Text style={styles.questionTitle}>
              {decodeHtmlEntities(currentQuestion.questionText)}
            </Text>

            {currentQuestion.options?.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.optionButton,
                  selectedOption === option && styles.selectedOption,
                  isSubmitted &&
                    selectedOption === option &&
                    selectedOption === currentQuestion.answer &&
                    styles.correctOption,
                  isSubmitted &&
                    selectedOption === option &&
                    selectedOption !== currentQuestion.answer &&
                    styles.wrongOption,
                ]}
                onPress={() => setSelectedOption(option)}
                disabled={isSubmitted || isTimeUp}
              >
                <Text style={styles.optionText}>
                  {decodeHtmlEntities(option)}
                </Text>
              </TouchableOpacity>
            ))}

            {selectedOption && (
              <View style={styles.submitButtonContainer}>
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() =>
                    onQuestionAnswered(
                      selectedOption === currentQuestion.answer
                    )
                  }
                >
                  <Text style={styles.submitText}>
                    {isTimeUp || isSubmitted ? 'Next Question' : 'Submit'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {popupVisible && (
              <View style={styles.popupContainer}>
                <Text style={styles.popupText}>
                  {popupMessage.includes('Correct! You earned $0.1') ? (
                    <Text>
                      Correct! You earned{' '}
                      <Text style={styles.popupHighlightGreen}>$0.1</Text>
                    </Text>
                  ) : popupMessage.includes('Wrong! You lost $0.01') ? (
                    <Text>
                      Wrong answer! You lose{' '}
                      <Text style={styles.popupHighlightRed}>$0.01</Text>
                    </Text>
                  ) : popupMessage.includes(
                      'Bonus! 10 correct answers! You earned $0.5'
                    ) ? (
                    <Text>
                      Bonus! 10 correct answers You earned{' '}
                      <Text style={styles.popupHighlightGreen}>$0.5</Text>
                    </Text>
                  ) : popupMessage.includes(
                      'Amazing! 20 correct answers! You earned $1'
                    ) ? (
                    <Text>
                      Amazing! 20 correct answers in a row! You earned{' '}
                      <Text style={styles.popupHighlightGreen}>$1</Text>
                    </Text>
                  ) : popupMessage.includes('Time Up! No Earning.') ? (
                    <Text>Time Up! No Earning.</Text>
                  ) : null}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      ) : (
        <Text style={styles.noQuestionsText}>No questions available</Text>
      )}

      <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0d2331' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 5,
    marginTop: 30,
  },
  backArrow: { fontSize: 24, color: 'orange' },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, color: 'white', fontWeight: 'bold' },
  startContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  noteText: { color: 'white', fontSize: 22, textAlign: 'center' },
  instructionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  highlightText: { color: '#60a5fa', fontWeight: 'bold' },
  timeText: { color: '#9ee86f' },
  startButton: {
    marginTop: 20,
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
  },
  startButtonText: { color: 'white', fontSize: 16 },
  scrollContent: { paddingBottom: 50 },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statsText: { color: 'white', fontSize: 16 },
  timeContainer: { backgroundColor: '#1e3a8a', padding: 10, borderRadius: 50 },
  timerText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  questionContainer: { padding: 20 },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  questionText: { color: 'white', fontSize: 16 },
  categoryText: { color: '#9ee86f', fontSize: 17 },
  questionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedOption: { backgroundColor: '#3b82f6' },
  correctOption: { backgroundColor: '#22c55e' },
  wrongOption: { backgroundColor: '#ef4444' },
  optionText: { color: 'white', fontSize: 16 },
  submitButtonContainer: { marginTop: 20, alignItems: 'center' },
  submitButton: { backgroundColor: '#f59e0b', padding: 15, borderRadius: 10 },
  submitText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  popupContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  popupText: { fontSize: 18, color: 'black', fontWeight: 'bold' },
  popupHighlightGreen: { fontWeight: '900', color: 'green' },
  popupHighlightRed: { fontWeight: '900', color: 'red' },
  errorText: { color: 'red', fontSize: 16, textAlign: 'center', marginTop: 20 },
  noQuestionsText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default QuestionScreen;

// Sign-up function
const signUp = async (username, email, password) => {
  try {
    const userQuery = query(
      collection(db, 'users'),
      where('username', '==', username)
    );
    const querySnapshot = await getDocs(userQuery);

    if (!querySnapshot.empty) {
      throw new Error('auth/username-already-in-use'); // Custom error
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    await setDoc(doc(db, 'users', email), {
      username,
      email,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    throw error; // Re-throw Firebase error for handling in handleSignUp
  }
};

// Sign-in function

const signIn = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Fetch user data from Firestore using email
    const userDocRef = doc(db, 'users', email);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw { code: 'auth/invalid-credential' }; // Throwing a custom error for user not found
    }

    const userData = userDoc.data();
    console.log('User data:', userData);

    // Store username in state (assuming setUsername is defined)
    setUsername(userData.username || 'Unknown');
  } catch (error) {
    console.error('Error signing in:', error);
    throw error; // Re-throw the error for the calling function to handle
  }
};

// sign out function
const logOut = async () => {
  try {
    await signOut(auth);
    console.log('User logged out');
  } catch (error) {
    console.error('Error logging out:', error);
  }
};

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('User is logged in:', user);
    // User is signed in, you can access user info like user.uid, user.email, etc.
  } else {
    // console.log('No user is logged in');
  }
});

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    if (currentUser) {
      try {
        // Retrieve user document from Firestore based on email
        const userDocRef = doc(db, 'users', currentUser.email);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Set the complete user data to the state, including username
          setUser({
            ...currentUser,
            ...userData,
          });
        } else {
          // Set only the current user data if Firestore data does not exist
          setUser(currentUser);
        }

        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    } else {
      // If user is logged out, reset user state
      setUser(null);
      setIsLoggedIn(false);
    }
  });

  return () => {
    unsubscribe();
    console.log('Cleaned up auth listener');
  };
}, [auth, db]); // Ensure auth and db are dependencies

// const styles = StyleSheet.create({
//   headerText: {
//     color: '#9ee86f',
//     fontSize: 24,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginLeft: 50,
//     color: 'white',
//   },
//   scoreContainer: {
//     marginTop: 10,
//     padding: 16,
//   },
//   scoreLabel: {
//     color: '#9ee86f',
//     fontWeight: 'bold',
//     fontSize: 18,
//   },
//   scoreValue: {
//     color: 'green',
//     fontWeight: '900',
//     fontSize: 18,
//   },
//   levelLabel: {
//     color: '#cccccc',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   levelValue: {
//     color: 'white',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
//   questionContainer: {
//     marginVertical: 10,
//     paddingHorizontal: 16,
//   },
//   questionText: {
//     textAlign: 'center',
//     marginVertical: 10,
//     color: '#ccc',
//     fontWeight: 'bold',
//     fontSize: 14,
//   },
//   questionTitle: {
//     color: 'orange',
//     textAlign: 'center',
//     fontSize: 20,
//     marginVertical: 6,
//   },
//   optionButton: {
//     borderWidth: 1,
//     padding: 10,
//     width: '100%',
//     marginVertical: 8,
//     borderRadius: 5,
//     borderColor: '#ccc',
//   },
//   selectedOption: {
//     backgroundColor: '#9ee8',
//   },
//   optionText: {
//     color: 'white',
//     fontWeight: '700',
//     textTransform: 'uppercase',
//     paddingLeft: 10,
//     fontSize: 17,
//   },
//   submitButtonContainer: {
//     justifyContent: 'center',
//     alignItems: 'center',
//     width: '100%',
//     paddingTop: 10, // Ensure the container has full width
//   },
//   submitButton: {
//     width: '80%', // You can also try a percentage width for responsiveness
//     backgroundColor: 'blue', // Correct the background color
//     padding: 10, // Increase padding for a larger button
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 5,
//   },
//   submitButtonText: {
//     color: 'white',
//     fontWeight: 'bold',
//   },
//   submitText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 17,
//   },
//   popupContainer: {
//     position: 'absolute',
//     top: '0%',
//     left: '10%',
//     right: '10%',
//     backgroundColor: 'white',
//     padding: 16,
//     borderRadius: 10,
//     alignItems: 'center',
//     justifyContent: 'center',
//     //
//     height: 100,
//   },
//   popupText: {
//     color: '#000',
//     fontSize: 18,
//     fontWeight: 'bold',
//   },
//   statsContainer: {
//     marginTop: 10,
//     padding: 16,
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     flexDirection: 'row',
//   },
//   statsText: {
//     color: '#9ee86f',
//     fontSize: 18,
//     textAlign: 'start',
//     marginTop: 10,
//   },
//   timerText: {
//     fontSize: 22,
//     fontWeight: '900',
//     color: 'red',
//   },
//   timeContainer: {
//     borderRadius: 50,
//     backgroundColor: 'white',
//     padding: 10,
//     marginRight: 20,
//     height: 100,
//     width: 100,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   //  selectedOption: {
//   // backgroundColor: '#d3d3d3',  // Highlight for selected option
//   correctOption: {
//     backgroundColor: 'green', // Correct answer background after submission
//   },
//   wrongOption: {
//     backgroundColor: 'red', // Wrong answer background after submission
//   },
// });
