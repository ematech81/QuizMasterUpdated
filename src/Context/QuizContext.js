import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { getToken, clearToken } from '../api/client';
import { login as loginApi, signup as signupApi, fetchMe, logout as logoutApi } from '../api/auth';
import { fetchQuestions as fetchQuestionsApi, submitAnswer as submitAnswerApi } from '../api/quiz';
import { fetchWallet as fetchWalletApi } from '../api/wallet';

const SESSION_KEY = '@quiz_active_session';

const DEFAULT_STATS = {
  earnings: 0,
  rewards: 0,
  totalEarnings: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  consecutiveCorrect: 0,
  totalAttemptedQuestions: 0,
  timeSpent: 0,
};

const DEFAULT_DAILY_STREAK = { count: 0, lastClaimedDate: null };
const DEFAULT_AD_REWARDS = { count: 0, date: null };

const CATEGORIES = [
  { id: '1', name: 'General', icon: 'earth' },
  { id: '2', name: 'Sports', icon: 'soccer' },
  { id: '3', name: 'Science', icon: 'flask' },
  { id: '4', name: 'History', icon: 'book' },
  { id: '5', name: 'Art', icon: 'palette' },
  { id: '6', name: 'Technology', icon: 'laptop' },
];

export const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  // ==================== AUTH STATE ====================
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  // ==================== WALLET / STATS STATE ====================
  // Flattened balance + stats into a single object so screens can keep
  // reading stats.earnings / stats.totalEarnings / stats.correctAnswers etc.
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [dailyStreak, setDailyStreak] = useState(DEFAULT_DAILY_STREAK);
  const [adRewards, setAdRewards] = useState(DEFAULT_AD_REWARDS);

  const applyWallet = useCallback((balance, statsPatch) => {
    setStats((prev) => ({ ...prev, ...statsPatch, ...balance }));
  }, []);

  // ==================== QUIZ SESSION STATE ====================
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [revealedAnswer, setRevealedAnswer] = useState(null);

  const [popupMessage, setPopupMessage] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [error, setError] = useState(null);

  const [activeQuizSession, setActiveQuizSession] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  // ==================== SESSION PERSISTENCE (local convenience only -
  // never affects balance, which is entirely server-authoritative) ====

  const saveSession = useCallback(async (session) => {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setActiveQuizSession(session);
    } catch (e) {
      console.error('Error saving quiz session:', e);
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch (e) {
      console.error('Error clearing quiz session:', e);
    }
    setActiveQuizSession(null);
  }, []);

  // ==================== BOOTSTRAP (auth + local session) ====================

  useEffect(() => {
    (async () => {
      try {
        const savedSession = await AsyncStorage.getItem(SESSION_KEY);
        if (savedSession) setActiveQuizSession(JSON.parse(savedSession));
      } catch (e) {
        console.error('Error loading quiz session:', e);
      }

      const token = await getToken();
      if (!token) {
        setIsBootstrapping(false);
        return;
      }

      try {
        const me = await fetchMe();
        setUser(me);
        applyWallet(me.balance, me.stats);
        setDailyStreak(me.dailyStreak);
        setAdRewards(me.adRewards);
      } catch (e) {
        await clearToken();
        setUser(null);
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, [applyWallet]);

  // ==================== AUTH ACTIONS ====================

  const signIn = useCallback(
    async (email, password) => {
      const loggedInUser = await loginApi({ email, password });
      setUser(loggedInUser);
      applyWallet(loggedInUser.balance, loggedInUser.stats);
      setDailyStreak(loggedInUser.dailyStreak);
      setAdRewards(loggedInUser.adRewards);
      return loggedInUser;
    },
    [applyWallet]
  );

  const signUp = useCallback(
    async (username, email, password) => {
      const newUser = await signupApi({ username, email, password });
      setUser(newUser);
      applyWallet(newUser.balance, newUser.stats);
      setDailyStreak(newUser.dailyStreak);
      setAdRewards(newUser.adRewards);
      return newUser;
    },
    [applyWallet]
  );

  const logOut = useCallback(async () => {
    await logoutApi();
    await clearSession();
    setUser(null);
    setStats(DEFAULT_STATS);
    setDailyStreak(DEFAULT_DAILY_STREAK);
    setAdRewards(DEFAULT_AD_REWARDS);
    setQuestions([]);
    setQuizStarted(false);
    setCurrentCategory(null);
    setCurrentQuestionIndex(0);
  }, [clearSession]);

  // ==================== WALLET ====================

  const refreshWallet = useCallback(async () => {
    const data = await fetchWalletApi();
    applyWallet(data.balance, data.stats);
    setDailyStreak(data.dailyStreak);
    setAdRewards(data.adRewards);
    return data;
  }, [applyWallet]);

  // ==================== QUIZ SESSION ACTIONS ====================

  const startNewQuiz = useCallback(async (categoryName) => {
    if (!categoryName || typeof categoryName !== 'string') {
      throw new Error('Invalid category name');
    }

    setIsFetchingQuestions(true);
    setError(null);

    try {
      const { questions: fetchedQuestions, exhausted } = await fetchQuestionsApi(categoryName);

      if (exhausted) {
        const err = new Error(
          `You've answered every question in ${categoryName}! Check back later as we add more, or try a different category for now.`
        );
        err.isExhausted = true;
        throw err;
      }

      setQuestions(fetchedQuestions);
      setCurrentCategory(categoryName);
      setCurrentQuestionIndex(0);
      setSelectedOption(null);
      setRevealedAnswer(null);
      setIsTimeUp(false);
      setIsSubmitted(false);
      setPopupVisible(false);
      setPopupMessage('');
      setQuizStarted(true);

      await saveSession({
        categoryName,
        questions: fetchedQuestions,
        questionIndex: 0,
        timeLeft: 15,
        startedAt: Date.now(),
      });

      return true;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setIsFetchingQuestions(false);
    }
  }, [saveSession]);

  const resumeQuiz = useCallback(async () => {
    if (!activeQuizSession) return false;

    const { categoryName, questions: savedQuestions, questionIndex, timeLeft } = activeQuizSession;

    setQuestions(savedQuestions || []);
    setCurrentCategory(categoryName);
    setCurrentQuestionIndex(questionIndex || 0);
    setSelectedOption(null);
    setRevealedAnswer(null);
    setIsTimeUp(false);
    setIsSubmitted(false);
    setPopupVisible(false);
    setPopupMessage('');
    setQuizStarted(true);

    return { timeLeft: timeLeft || 15 };
  }, [activeQuizSession]);

  const updateQuizProgress = useCallback(
    async (questionIndex, timeLeft) => {
      if (!currentCategory) return;
      await saveSession({
        categoryName: currentCategory,
        questions,
        questionIndex,
        timeLeft,
        updatedAt: Date.now(),
      });
    },
    [currentCategory, questions, saveSession]
  );

  const endQuiz = useCallback(async () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setCurrentCategory(null);
    setSelectedOption(null);
    setRevealedAnswer(null);
    setIsSubmitted(false);
    setIsTimeUp(false);
    await clearSession();
  }, [clearSession]);

  // ==================== SUBMIT ANSWER (server-authoritative scoring) =====

  const submitAnswer = useCallback(
    async (isTimeout = false) => {
      const currentQuestion = questions[currentQuestionIndex];
      if (!currentQuestion) {
        throw new Error('No current question');
      }

      const result = await submitAnswerApi({
        category: currentCategory,
        questionId: currentQuestion.id,
        selectedOption: isTimeout ? null : selectedOption,
        isTimeout,
      });

      applyWallet(result.balance, result.stats);
      setRevealedAnswer(result.correctAnswer);
      setPopupMessage(result.message);
      setPopupVisible(true);
      setIsSubmitted(true);

      return result;
    },
    [questions, currentQuestionIndex, currentCategory, selectedOption, applyWallet]
  );

  // ==================== CONTEXT VALUE ====================

  const value = {
    // Auth
    user,
    isBootstrapping,
    signIn,
    signUp,
    logOut,

    // Wallet / stats
    stats,
    dailyStreak,
    adRewards,
    refreshWallet,
    applyWallet,

    // Quiz session
    quizStarted,
    setQuizStarted,
    questions,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    selectedOption,
    setSelectedOption,
    currentCategory,
    setCurrentCategory,
    revealedAnswer,

    popupMessage,
    setPopupMessage,
    popupVisible,
    setPopupVisible,
    isTimeUp,
    setIsTimeUp,
    isSubmitted,
    setIsSubmitted,
    isFetchingQuestions,
    error,
    setError,
    clearError,

    activeQuizSession,
    hasActiveQuiz: !!activeQuizSession,

    categories: CATEGORIES,

    startNewQuiz,
    resumeQuiz,
    updateQuizProgress,
    endQuiz,
    submitAnswer,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};
