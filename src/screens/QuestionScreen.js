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
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  AppState,
  Animated,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QuizContext } from '../Context/QuizContext';
import { useInterstitialAd } from '../ads/useInterstitialAd';
import { decodeHtmlEntities } from '../utils/decodeHtmlEntities';
// import { formatPoints } from '../utils/formatPoints'; // only used by the disabled points version

const RULES_SEEN_KEY = '@quiz_has_seen_rules';
const TIMER_DURATION = 15;
const AUTO_ADVANCE_DELAY = 2500;

const QuestionScreen = ({ route }) => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // ==================== CONTEXT ====================
  const {
    quizStarted,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedOption,
    setSelectedOption,
    currentCategory,
    popupMessage,
    setPopupMessage,
    popupVisible,
    setPopupVisible,
    isTimeUp,
    setIsTimeUp,
    isSubmitted,
    setIsSubmitted,
    isFetchingQuestions,
    stats,
    revealedAnswer,
    activeQuizSession,
    startNewQuiz,
    resumeQuiz,
    updateQuizProgress,
    endQuiz,
    submitAnswer: submitAnswerToServer,
  } = useContext(QuizContext);

  const { showInterstitial } = useInterstitialAd();

  // ==================== ROUTE PARAMS ====================
  const { categoryName, isResume } = route.params || {};
  
  // ==================== LOCAL STATE ====================
  const [isLoading, setIsLoading] = useState(false);
  const [showStartScreen, setShowStartScreen] = useState(!isResume);
  const [localError, setLocalError] = useState(null);
  const [isExhausted, setIsExhausted] = useState(false);
  
  // ==================== REFS ====================
  const timerRef = useRef(null);
  const autoAdvanceRef = useRef(null);
  const backgroundTimeRef = useRef(null);
  const hasStartedRef = useRef(false);
  const isMountedRef = useRef(true);
  const moveToNextQuestionRef = useRef(() => {}); // ADD THIS REF
  const handleTimeUpRef = useRef(() => {});

  // Per-session counters - `stats` in context is the user's lifetime total,
  // so Results needs its own tally of what happened in *this* quiz.
  const sessionRef = useRef({ correct: 0, wrong: 0, timeout: 0, startTotalEarnings: 0 });
  const latestTotalEarningsRef = useRef(stats.totalEarnings);
  useEffect(() => {
    latestTotalEarningsRef.current = stats.totalEarnings;
  }, [stats.totalEarnings]);


  // CRITICAL FIX: Use ref for timer value to avoid closure issues
  const remainingTimeRef = useRef(TIMER_DURATION);
  const [timerDisplay, setTimerDisplay] = useState(TIMER_DURATION);

  // ==================== REWARD TOAST ====================
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef(null);

  useEffect(() => {
    if (!popupVisible) {
      toastAnim.setValue(0);
      return undefined;
    }

    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);

    Animated.timing(toastAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();

    toastTimerRef.current = setTimeout(() => {
      Animated.timing(toastAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        if (isMountedRef.current) setPopupVisible(false);
      });
    }, 1500);

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, [popupVisible, popupMessage, toastAnim, setPopupVisible]);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // ==================== DERIVED STATE ====================
  const currentQuestion = questions[currentQuestionIndex] || null;
  const isQuizActive = quizStarted && questions.length > 0 && currentQuestion;
  const canSubmit = selectedOption && !isSubmitted && !isTimeUp;
  const showNextButton = isSubmitted || isTimeUp;


  // ==================== MOUNT/UNMOUNT ====================
  
  useEffect(() => {
    isMountedRef.current = true;
    console.log('📱 QuestionScreen mounted, category:', categoryName);
  
    return () => {
      console.log('📱 QuestionScreen unmounting');
      isMountedRef.current = false;
      clearAllTimers();
    };
  }, []);
  

  // ==================== TIMER FUNCTIONS ====================
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
  }, []);
  
  // CRITICAL: This function replaces all setRemainingTime calls
  const updateTimerValue = useCallback((value) => {
    if (!isMountedRef.current) return;
    console.log('⏱️ Updating timer display to:', value);
    remainingTimeRef.current = value;
    setTimerDisplay(value);
  }, []);
  
  const startTimer = useCallback((duration = TIMER_DURATION) => {
    console.log('⏱️ Starting timer with duration:', duration);
    
    clearAllTimers();
    updateTimerValue(duration);
    
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) {
        clearInterval(timerRef.current);
        return;
      }
      
      const currentValue = remainingTimeRef.current;
      const newValue = currentValue - 1;
      
      console.log('Timer tick:', currentValue, '→', newValue);
      
      if (newValue <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
        updateTimerValue(0);
      } else {
        updateTimerValue(newValue);
      }
    }, 1000);
  }, [clearAllTimers, updateTimerValue]);
  
  const pauseTimer = useCallback(() => {
    console.log('⏸️ Pausing timer');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);


  const handleTimeUp = useCallback(async () => {
    if (!isMountedRef.current) return;
  
    console.log('⏰ Handling time up');
    pauseTimer();
    setIsTimeUp(true);
  
    try {
      await submitAnswerToServer(true);
      sessionRef.current.timeout += 1;
    } catch (error) {
      console.error('❌ Error on timeout:', error);
    }

    autoAdvanceRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        moveToNextQuestionRef.current();
      }
    }, AUTO_ADVANCE_DELAY);
  }, [submitAnswerToServer, pauseTimer, setIsTimeUp]);

  
  useEffect(() => {
    handleTimeUpRef.current = handleTimeUp;
  }, [handleTimeUp]);
  
  

  
  // ==================== TIME UP EFFECT ====================

  useEffect(() => {
    if (
      timerDisplay === 0 &&
      isQuizActive &&
      !isTimeUp &&
      !isSubmitted &&
      hasStartedRef.current
    ) {
      console.log('⏰ Time up detected!');
      handleTimeUpRef.current();
    }
  }, [timerDisplay, isQuizActive, isTimeUp, isSubmitted]);
  
  
  // ==================== MOVE TO NEXT QUESTION ====================
  const moveToNextQuestion = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    console.log('➡️ Moving to next question');
    
    try {
      clearAllTimers();
      setPopupVisible(false);
      setSelectedOption(null);
      setIsTimeUp(false);
      setIsSubmitted(false);
  
      const nextIndex = currentQuestionIndex + 1;
  
      if (nextIndex < questions.length) {
        console.log('Moving to question', nextIndex + 1);
        setCurrentQuestionIndex(nextIndex);
        updateTimerValue(TIMER_DURATION);
        await updateQuizProgress(nextIndex, TIMER_DURATION);
        
        // Start timer after a short delay
        setTimeout(() => {
          if (isMountedRef.current) {
            startTimer(TIMER_DURATION);
          }
        }, 150);
      } else {
        console.log('🏁 Quiz finished!');
        const session = sessionRef.current;
        const moneyEarned = stats.totalEarnings - session.startTotalEarnings;
        await endQuiz();
        await showInterstitial();
        navigation.replace('Results', {
          category: currentCategory,
          totalQuestions: questions.length,
          correct: session.correct,
          wrong: session.wrong,
          timeout: session.timeout,
          moneyEarned,
          lifetimeStats: stats,
        });
      }
    } catch (error) {
      console.error('❌ Error moving to next question:', error);
      setLocalError('Failed to move to next question: ' + error.message);
    }
  }, [
    currentQuestionIndex,
    questions.length,
    navigation,
    stats,
    currentCategory,
    clearAllTimers,
    startTimer,
    updateQuizProgress,
    endQuiz,
    showInterstitial,
    setPopupVisible,
    setSelectedOption,
    setIsTimeUp,
    setIsSubmitted,
    setCurrentQuestionIndex,
    updateTimerValue,
  ]);
  
  // Update the ref whenever moveToNextQuestion changes
  useEffect(() => {
    moveToNextQuestionRef.current = moveToNextQuestion;
  }, [moveToNextQuestion]);
  
  
  // ==================== PULSE ANIMATION ====================
  
  useEffect(() => {
    if (timerDisplay <= 5 && timerDisplay > 0 && !isSubmitted && !isTimeUp) {
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [timerDisplay, isSubmitted, isTimeUp, pulseAnim]);
  
  // ==================== SUBMIT ANSWER ====================
  
  const submitCurrentAnswer = useCallback(async () => {
    if (!selectedOption || isSubmitted || isTimeUp) return;

    console.log('📝 Submitting answer:', selectedOption);

    pauseTimer();

    try {
      const result = await submitAnswerToServer(false);
      if (result.isCorrect) {
        sessionRef.current.correct += 1;
      } else {
        sessionRef.current.wrong += 1;
      }
    } catch (error) {
      console.error('❌ Submit error:', error);
    }

    autoAdvanceRef.current = setTimeout(() => {
      if (isMountedRef.current) {
        moveToNextQuestion();
      }
    }, AUTO_ADVANCE_DELAY);
  }, [
    selectedOption,
    isSubmitted,
    isTimeUp,
    submitAnswerToServer,
    pauseTimer,
    moveToNextQuestion,
  ]);

  const handleButtonPress = useCallback(() => {
    if (showNextButton) {
      clearAllTimers();
      moveToNextQuestion();
    } else if (canSubmit) {
      submitCurrentAnswer();
    }
  }, [showNextButton, canSubmit, clearAllTimers, moveToNextQuestion, submitCurrentAnswer]);

  // ==================== START QUIZ ====================

  const handleStartQuiz = useCallback(async () => {
    console.log('🎮 Starting quiz for category:', categoryName);
    setShowStartScreen(false);
    setIsLoading(true);
    setLocalError(null);
    setIsExhausted(false);

    if (!isResume) {
      AsyncStorage.setItem(RULES_SEEN_KEY, 'true').catch(() => {});
    }

    sessionRef.current = {
      correct: 0,
      wrong: 0,
      timeout: 0,
      startTotalEarnings: latestTotalEarningsRef.current,
    };

    try {
      let initialTime = TIMER_DURATION;

      if (isResume && activeQuizSession) {
        console.log('Resuming quiz...');
        const result = await resumeQuiz();
        initialTime = result?.timeLeft || TIMER_DURATION;
      } else {
        console.log('Starting new quiz...');
        await startNewQuiz(categoryName);
      }

      console.log('Quiz started, initial time:', initialTime);
      updateTimerValue(initialTime);
      hasStartedRef.current = true;

      setTimeout(() => {
        if (isMountedRef.current) {
          console.log('Starting timer after delay');
          startTimer(initialTime);
        }
      }, 300);

    } catch (err) {
      console.error('❌ Start quiz error:', err);
      setLocalError(err.message || 'Failed to start quiz');
      setIsExhausted(!!err.isExhausted);
    } finally {
      setIsLoading(false);
    }
  }, [
    isResume,
    activeQuizSession,
    categoryName,
    resumeQuiz,
    startNewQuiz,
    startTimer,
    updateTimerValue
  ]);

  // ==================== AUTO START (resume, or rules already seen) ====

  const autoStartAttemptedRef = useRef(false);

  useEffect(() => {
    if (autoStartAttemptedRef.current) return undefined;

    if (isResume && activeQuizSession) {
      autoStartAttemptedRef.current = true;
      console.log('Auto-resuming quiz...');
      const timer = setTimeout(() => {
        handleStartQuiz();
      }, 100);
      return () => clearTimeout(timer);
    }

    if (!isResume) {
      autoStartAttemptedRef.current = true;
      (async () => {
        try {
          const seen = await AsyncStorage.getItem(RULES_SEEN_KEY);
          if (seen === 'true' && isMountedRef.current) {
            console.log('Rules already seen, skipping rules screen...');
            handleStartQuiz();
          }
        } catch (e) {
          // Ignore - the rules screen simply shows as a safe fallback.
        }
      })();
    }

    return undefined;
  }, [isResume, activeQuizSession, handleStartQuiz]);

  // ==================== FOCUS HANDLING ====================

  useEffect(() => {
    if (!hasStartedRef.current) return;

    if (isFocused && !isSubmitted && !isTimeUp && remainingTimeRef.current > 0 && !timerRef.current) {
      console.log('Screen focused, resuming timer');
      startTimer(remainingTimeRef.current);
    } else if (!isFocused) {
      console.log('Screen blurred, pausing timer');
      pauseTimer();
      if (currentCategory) {
        updateQuizProgress(currentQuestionIndex, remainingTimeRef.current);
      }
    }
  }, [isFocused, isSubmitted, isTimeUp, currentCategory, currentQuestionIndex, startTimer, pauseTimer, updateQuizProgress]);

  // ==================== APP STATE ====================

  useEffect(() => {
    const handleAppState = (nextState) => {
      if (!hasStartedRef.current || !isMountedRef.current) return;

      console.log('AppState changed to:', nextState);

      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimeRef.current = Date.now();
        pauseTimer();
        if (currentCategory) {
          updateQuizProgress(currentQuestionIndex, remainingTimeRef.current);
        }
      } else if (nextState === 'active' && backgroundTimeRef.current && !isSubmitted && !isTimeUp) {
        const elapsed = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
        const adjusted = Math.max(0, remainingTimeRef.current - elapsed);
        backgroundTimeRef.current = null;
        
        console.log('Resuming after background, adjusted time:', adjusted);
        
        if (adjusted <= 0) {
          updateTimerValue(0);
        } else {
          startTimer(adjusted);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, [isSubmitted, isTimeUp, currentCategory, currentQuestionIndex, startTimer, pauseTimer, updateTimerValue, updateQuizProgress]);

  // ==================== GO BACK ====================

  const handleGoBack = useCallback(() => {
    clearAllTimers();
    if (hasStartedRef.current && currentCategory) {
      updateQuizProgress(currentQuestionIndex, remainingTimeRef.current);
    }
    navigation.goBack();
  }, [clearAllTimers, currentCategory, currentQuestionIndex, navigation, updateQuizProgress]);


  // ==================== RENDER ====================

  if (isLoading || isFetchingQuestions) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#60a5fa" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
      </SafeAreaView>
    );
  }

  if (isExhausted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>🎉</Text>
          <Text style={styles.errorText}>{localError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleGoBack}>
            <Text style={styles.retryText}>Choose Another Category</Text>
          </TouchableOpacity>
        </View>
        <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
      </SafeAreaView>
    );
  }

  if (localError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{localError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => { setLocalError(null); setShowStartScreen(true); }}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.retryBtn, styles.backBtn]} onPress={handleGoBack}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
      </SafeAreaView>
    );
  }

  if (showStartScreen) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerText}>QuizMaster</Text>
        </View>

        <View style={styles.center}>
          <Text style={styles.categoryTitle}>{categoryName}</Text>
          
          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>📋 Quiz Rules</Text>
            <Text style={styles.ruleText}>⏱️ 15 seconds per question</Text>
            {/* POINTS VERSION (disabled):
            <Text style={styles.ruleText}>✅ Correct: <Text style={styles.green}>+5 pts</Text></Text>
            <Text style={styles.ruleText}>❌ Wrong: <Text style={styles.red}>-1 pt</Text></Text>
            <Text style={styles.ruleText}>🎉 10 streak: <Text style={styles.green}>+30 pts</Text></Text>
            <Text style={styles.ruleText}>🏆 20 streak: <Text style={styles.green}>+50 pts</Text></Text>
            */}
            <Text style={styles.ruleText}>✅ Correct: <Text style={styles.green}>+$0.02</Text></Text>
            <Text style={styles.ruleText}>❌ Wrong: <Text style={styles.red}>-$0.01</Text></Text>
            <Text style={styles.ruleText}>🎉 10 streak: <Text style={styles.green}>+$0.03</Text></Text>
            <Text style={styles.ruleText}>🏆 20 streak: <Text style={styles.green}>+$0.04</Text></Text>
          </View>

          <TouchableOpacity style={styles.startBtn} onPress={handleStartQuiz}>
            <Text style={styles.startBtnText}>🚀 Start Quiz</Text>
          </TouchableOpacity>
        </View>
        <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>QuizMaster</Text>
      </View>

      {isQuizActive ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Stats */}
          <View style={styles.statsRow}>
            {/* POINTS VERSION (disabled):
            <View>
              <Text style={styles.statsLabel}>Points</Text>
              <Text style={styles.statsValue}>{formatPoints(stats.earnings)}</Text>
              {stats.rewards > 0 && <Text style={styles.bonus}>+{formatPoints(stats.rewards)}</Text>}
            </View>
            */}
            <View>
              <Text style={styles.statsLabel}>Earnings</Text>
              <Text style={styles.statsValue}>${stats.earnings.toFixed(2)}</Text>
              {stats.rewards > 0 && <Text style={styles.bonus}>+${stats.rewards.toFixed(2)}</Text>}
            </View>
            
            <Animated.View style={[
              styles.timerCircle,
              timerDisplay <= 5 && styles.timerWarning,
              { transform: [{ scale: pulseAnim }] }
            ]}>
              <Text style={[styles.timerNum, timerDisplay <= 5 && styles.timerNumWarn]}>{timerDisplay || 0}</Text>
              <Text style={styles.timerSec}>sec</Text>
            </Animated.View>
          </View>

          {/* Progress */}
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Question {currentQuestionIndex + 1} of {questions.length}</Text>

          {stats.consecutiveCorrect > 0 && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {stats.consecutiveCorrect} streak</Text>
            </View>
          )}

          {/* Question */}
          <View style={styles.questionBox}>
            <Text style={styles.questionText}>{decodeHtmlEntities(currentQuestion?.questionText)}</Text>
          </View>

          {/* Options */}
          {currentQuestion?.options?.map((opt, idx) => {
            const isSelected = selectedOption === opt;
            const isCorrect = opt === revealedAnswer;
            const showGreen = (isSubmitted || isTimeUp) && isCorrect;
            const showRed = (isSubmitted || isTimeUp) && isSelected && !isCorrect;

            return (
              <TouchableOpacity
                key={`${currentQuestionIndex}-${idx}`}
                style={[
                  styles.optionBtn,
                  isSelected && !isSubmitted && !isTimeUp && styles.optionSelected,
                  showGreen && styles.optionCorrect,
                  showRed && styles.optionWrong,
                ]}
                onPress={() => !isSubmitted && !isTimeUp && setSelectedOption(opt)}
                disabled={isSubmitted || isTimeUp}
              >
                <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                <Text style={styles.optionText}>{decodeHtmlEntities(opt)}</Text>
                {showGreen && <Text style={styles.resultIcon}>✓</Text>}
                {showRed && <Text style={styles.resultIcon}>✗</Text>}
              </TouchableOpacity>
            );
          })}

          {/* Button */}
          {(selectedOption || showNextButton) && (
            <TouchableOpacity
              style={[styles.actionBtn, showNextButton && styles.nextBtn]}
              onPress={handleButtonPress}
            >
              <Text style={styles.actionBtnText}>
                {showNextButton 
                  ? (currentQuestionIndex < questions.length - 1 ? 'Next →' : 'Results →')
                  : 'Submit'
                }
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      ) : (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#60a5fa" />
        </View>
      )}

      {popupVisible && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrapper,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-16, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View
            style={[
              styles.toast,
              popupMessage.includes('Wrong')
                ? styles.toastRed
                : popupMessage.includes('Time Up')
                ? styles.toastOrange
                : styles.toastGreen,
            ]}
          >
            <Text
              style={[
                styles.toastText,
                popupMessage.includes('Wrong')
                  ? styles.toastTextRed
                  : popupMessage.includes('Time Up')
                  ? styles.toastTextOrange
                  : styles.toastTextGreen,
              ]}
            >
              {popupMessage}
            </Text>
          </View>
        </Animated.View>
      )}

      <StatusBar backgroundColor="#0d2331" barStyle="light-content" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d2331' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 45, paddingBottom: 15 },
  backArrow: { fontSize: 28, color: '#f59e0b', marginRight: 15 },
  headerText: { color: 'white', fontSize: 22, fontWeight: 'bold' },
  
  loadingText: { color: 'white', marginTop: 15, fontSize: 16 },
  errorIcon: { fontSize: 50, marginBottom: 15 },
  errorText: { color: '#ff6b6b', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  retryBtn: { backgroundColor: '#f59e0b', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 8, marginTop: 10 },
  backBtn: { backgroundColor: '#6b7280' },
  retryText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  categoryTitle: { fontSize: 28, fontWeight: 'bold', color: '#60a5fa', marginBottom: 25 },
  rulesBox: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 16, padding: 20, width: '100%', marginBottom: 25 },
  rulesTitle: { fontSize: 20, fontWeight: 'bold', color: 'white', marginBottom: 15, textAlign: 'center' },
  ruleText: { color: 'white', fontSize: 16, marginBottom: 10 },
  green: { color: '#22c55e', fontWeight: 'bold' },
  red: { color: '#ef4444', fontWeight: 'bold' },
  startBtn: { backgroundColor: '#22c55e', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 12 },
  startBtnText: { color: 'white', fontSize: 20, fontWeight: 'bold' },

  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  statsLabel: { color: '#9ca3af', fontSize: 14 },
  statsValue: { color: '#22c55e', fontSize: 26, fontWeight: 'bold' },
  bonus: { color: '#f59e0b', fontSize: 14 },
  
  timerCircle: { width: 75, height: 75, borderRadius: 40, backgroundColor: '#1e3a5f', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#3b82f6' },
  timerWarning: { backgroundColor: '#dc2626', borderColor: '#ef4444' },
  timerNum: { color: 'white', fontSize: 26, fontWeight: 'bold' },
  timerNumWarn: { color: '#fef08a' },
  timerSec: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },

  progressBar: { height: 5, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 3, marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#22c55e', borderRadius: 3 },
  progressText: { color: '#9ca3af', fontSize: 14, marginBottom: 12 },

  streakBadge: { backgroundColor: '#f59e0b', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 15, marginBottom: 12 },
  streakText: { color: 'white', fontSize: 14, fontWeight: 'bold' },

  questionBox: { backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: 18, marginBottom: 20 },
  questionText: { color: 'white', fontSize: 19, fontWeight: '600', lineHeight: 28 },

  optionBtn: { backgroundColor: '#1e3a5f', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  optionSelected: { borderColor: '#3b82f6', backgroundColor: '#2563eb' },
  optionCorrect: { borderColor: '#22c55e', backgroundColor: '#166534' },
  optionWrong: { borderColor: '#ef4444', backgroundColor: '#991b1b' },
  optionLetter: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.2)', color: 'white', textAlign: 'center', lineHeight: 30, fontWeight: 'bold', marginRight: 12 },
  optionText: { color: 'white', fontSize: 16, flex: 1 },
  resultIcon: { fontSize: 22, marginLeft: 8 },

  actionBtn: { backgroundColor: '#f59e0b', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 15 },
  nextBtn: { backgroundColor: '#22c55e' },
  actionBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  toastWrapper: {
    position: 'absolute',
    top: 95,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 100,
  },
  toast: {
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  toastGreen: { backgroundColor: '#0f2e1d', borderColor: '#22c55e' },
  toastRed: { backgroundColor: '#3a1414', borderColor: '#ef4444' },
  toastOrange: { backgroundColor: '#3a2408', borderColor: '#f59e0b' },
  toastText: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  toastTextGreen: { color: '#22c55e' },
  toastTextRed: { color: '#ef4444' },
  toastTextOrange: { color: '#f59e0b' },
});

export default QuestionScreen;