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
  AppState,
} from 'react-native';
import {
  useNavigation,
  useIsFocused,
  useRoute,
} from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizContext } from '../bibleContext/QuizContext';
import BackArrow from '../customs/backArrow';

const SecondQuestionScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const { categoryName } = route.params || {};
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
    handleSubmit,
  } = useContext(QuizContext);
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
        <BackArrow
          color="orange"
          onPress={() => {
            stopTimer();
            navigation.goBack();
          }}
        />
        <Text style={styles.headerText}>QuizMaster</Text>
      </View>

      {isLoading || isFetchingQuestions ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="white" />
          <Text style={styles.loadingText}>Loading Question...</Text>
          <Text style={styles.loadingSubText}>
            Please wait a few seconds...
          </Text>
        </View>
      ) : error ? (
        <Text style={styles.error}>Error: {error}</Text>
      ) : !quizStarted ? (
        <View style={styles.startContainer}>
          <Text style={styles.noteText}>NOTE:</Text>
          <Text style={styles.instructionText}>
            The quiz will start immediately after you press the{' '}
            <Text style={styles.highlightText}>Start Quiz Now</Text>. You will
            have <Text style={styles.timeHighlight}>15 seconds</Text> to answer
            each question.
          </Text>
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartQuiz}
          >
            <Text style={styles.startButtonText}>Start Quiz Now</Text>
          </TouchableOpacity>
        </View>
      ) : questions.length > 0 ? (
        <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                CATEG:{' '}
                <Text style={styles.categoryHighlight}>{categoryName}</Text>
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
        <Text style={styles.error}>No questions available</Text>
      )}

      <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0d2331',
  },
  header: {
    alignSelf: 'flex-start',
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 30,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  loadingSubText: {
    color: 'white',
  },
  startContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    padding: 16,
  },
  noteText: {
    color: 'white',
    fontSize: 22,
    textAlign: 'center',
  },
  instructionText: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  highlightText: {
    color: '#60a5fa',
    fontWeight: 'bold',
  },
  timeHighlight: {
    color: '#9ee86f',
  },
  startButton: {
    marginTop: 20,
    backgroundColor: 'green',
    padding: 10,
    borderRadius: 5,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
  },
  scrollContainer: {
    paddingBottom: 50,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
  },
  statsText: {
    color: 'white',
    fontSize: 16,
  },
  timeContainer: {
    alignItems: 'flex-end',
  },
  timerText: {
    color: '#9ee86f',
    fontSize: 18,
    fontWeight: 'bold',
  },
  questionContainer: {
    padding: 20,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  questionText: {
    color: 'white',
    fontSize: 16,
  },
  categoryHighlight: {
    color: '#9ee86f',
    fontSize: 17,
  },
  questionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  optionButton: {
    backgroundColor: '#1e3a8a',
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  selectedOption: {
    backgroundColor: '#3b82f6',
  },
  correctOption: {
    backgroundColor: '#22c55e',
  },
  wrongOption: {
    backgroundColor: '#ef4444',
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
  submitButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  submitButton: {
    backgroundColor: 'green',
    padding: 15,
    borderRadius: 5,
  },
  submitText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
  },
  popupContainer: {
    marginTop: 20,
    backgroundColor: 'white',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  popupText: {
    fontSize: 18,
    color: 'black',
    fontWeight: '900',
  },
  popupHighlightGreen: {
    fontWeight: '900',
    color: 'green',
  },
  popupHighlightRed: {
    fontWeight: '900',
    color: 'red',
  },
  error: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default SecondQuestionScreen;
