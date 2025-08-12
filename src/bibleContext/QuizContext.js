import React, {
  createContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { doc, collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '../database/FirebaseConfig';
import { AppState } from 'react-native';

const USER_STATS_KEY = '@user_stats';
const STORAGE_KEY_GOTTEN_ANSWERS = '@gottenAnswers';
const STORAGE_KEY_MISSED_ANSWERS = '@missedAnswers';

const defaultStats = {
  rewards: 0,
  earnings: 0,
  totalEarnings: 0,
  correctAnswers: 0,
  wrongAnswers: 0,
  totalAttemptedQuestions: 0,
  timeSpent: 0,
};

export const QuizContext = createContext();

export const QuizProvider = ({ children }) => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [popupMessage, setPopupMessage] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);
  const [remainingTime, setRemainingTime] = useState(15);
  const [isTimeUp, setIsTimeUp] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [stats, setStats] = useState(defaultStats);
  const [dailyEarnings, setDailyEarnings] = useState([]);
  const [yesterdayEarnings, setYesterdayEarnings] = useState(0);
  const [gottenAnswers, setGottenAnswers] = useState([]);
  const [missedAnswers, setMissedAnswers] = useState([]);
  const [error, setError] = useState(null);
  const [categories] = useState([
    { id: '1', name: 'General', icon: 'earth' },
    { id: '2', name: 'Sports', icon: 'soccer' },
    { id: '3', name: 'Science', icon: 'flask' },
    { id: '4', name: 'History', icon: 'book' },
    { id: '5', name: 'Art', icon: 'palette' },
    { id: '6', name: 'Technology', icon: 'laptop' },
  ]);

  const timeoutIdRef = useRef(null);

  // Fetch questions
  const fetchQuestions = useCallback(async (categoryName) => {
    setIsFetchingQuestions(true);
    try {
      if (typeof categoryName !== 'string') {
        throw new Error('categoryName must be a string');
      }
      setCurrentCategory(categoryName);
      const cachedQuestions = await AsyncStorage.getItem(
        `questions_${categoryName}`
      );
      if (cachedQuestions) {
        setQuestions(JSON.parse(cachedQuestions));
        return;
      }
      const categoryDocRef = doc(db, 'questions', categoryName);
      const questionListRef = query(
        collection(categoryDocRef, 'questionList'),
        limit(10)
      );
      const snapshot = await getDocs(questionListRef);
      if (snapshot.empty) {
        throw new Error(`No questions found for category: ${categoryName}`);
      }
      const fetchedQuestions = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      await AsyncStorage.setItem(
        `questions_${categoryName}`,
        JSON.stringify(fetchedQuestions)
      );
      setQuestions(fetchedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsFetchingQuestions(false);
    }
  }, []);

  // Save answers to AsyncStorage
  const saveAnswersToStorage = useCallback(
    async (gottenAnswers, missedAnswers) => {
      try {
        await AsyncStorage.setItem(
          STORAGE_KEY_GOTTEN_ANSWERS,
          JSON.stringify(gottenAnswers)
        );
        await AsyncStorage.setItem(
          STORAGE_KEY_MISSED_ANSWERS,
          JSON.stringify(missedAnswers)
        );
      } catch (error) {
        console.error('Error saving answers to storage:', error);
        setError('Failed to save answers');
      }
    },
    []
  );

  // Fetch gotten answers
  const fetchGottenAnswers = useCallback(async () => {
    try {
      const storedAnswers = await AsyncStorage.getItem(
        STORAGE_KEY_GOTTEN_ANSWERS
      );
      const answers = storedAnswers ? JSON.parse(storedAnswers) : [];
      setGottenAnswers(answers);
      return answers;
    } catch (error) {
      console.error('Error fetching gotten answers:', error);
      setError('Failed to fetch gotten answers');
      return [];
    }
  }, []);

  // Fetch missed answers
  const fetchMissedAnswers = useCallback(async () => {
    try {
      const storedAnswers = await AsyncStorage.getItem(
        STORAGE_KEY_MISSED_ANSWERS
      );
      const answers = storedAnswers ? JSON.parse(storedAnswers) : [];
      setMissedAnswers(answers);
      return answers;
    } catch (error) {
      console.error('Error fetching missed answers:', error);
      setError('Failed to fetch missed answers');
      return [];
    }
  }, []);

  // Handle submit
  const handleSubmit = useCallback(
    async (isCorrect) => {
      try {
        const currentQuestion = questions[currentQuestionIndex];
        const answeredQuestion = {
          question: currentQuestion.questionText,
          correctAnswer: currentQuestion.answer,
          selectedAnswer: selectedOption,
        };

        let updatedStats = {
          ...stats,
          totalAttemptedQuestions: stats.totalAttemptedQuestions + 1,
        };
        let newEarnings = updatedStats.earnings;
        let newRewards = updatedStats.rewards;

        let updatedGottenAnswers = [...gottenAnswers];
        let updatedMissedAnswers = [...missedAnswers];

        if (isCorrect) {
          updatedStats.correctAnswers += 1;
          newEarnings += 0.1;
          setPopupMessage('Correct! You earned $0.1');
          updatedGottenAnswers.push(answeredQuestion);
          if (updatedStats.correctAnswers === 10) {
            newRewards += 0.5;
            setPopupMessage('Bonus! 10 correct answers! You earned $0.5');
          } else if (updatedStats.correctAnswers === 20) {
            newRewards += 1.0;
            setPopupMessage('Amazing! 20 correct answers! You earned $1');
          }
        } else {
          updatedStats.wrongAnswers += 1;
          newEarnings -= 0.01;
          setPopupMessage('Wrong! You lost $0.01');
          updatedMissedAnswers.push(answeredQuestion);
        }

        const newTotalEarnings = parseFloat(
          (newEarnings + newRewards).toFixed(2)
        );
        updatedStats.earnings = parseFloat(newEarnings.toFixed(2));
        updatedStats.rewards = parseFloat(newRewards.toFixed(2));
        updatedStats.totalEarnings = newTotalEarnings;

        // Update daily earnings
        const today = new Date().toISOString().split('T')[0];
        const updatedDailyEarnings = dailyEarnings.filter(
          (entry) => entry.date !== today
        );
        updatedDailyEarnings.push({ date: today, earnings: newTotalEarnings });
        setDailyEarnings(updatedDailyEarnings);
        await AsyncStorage.setItem(
          'dailyEarnings',
          JSON.stringify(updatedDailyEarnings)
        );

        // Save updated stats and answers
        await saveUserStatsAsync(updatedStats);
        await saveAnswersToStorage(updatedGottenAnswers, updatedMissedAnswers);

        setStats(updatedStats);
        setGottenAnswers(updatedGottenAnswers);
        setMissedAnswers(updatedMissedAnswers);
        setIsSubmitted(true);
        setPopupVisible(true);
      } catch (error) {
        console.error('Error handling submit:', error);
        setError('Failed to submit answer');
        throw error;
      }
    },
    [
      questions,
      currentQuestionIndex,
      selectedOption,
      stats,
      dailyEarnings,
      gottenAnswers,
      missedAnswers,
    ]
  );

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stats
        const fetchedStats = await getUserStatsAsync();
        setStats(fetchedStats);

        // Fetch daily earnings
        let earningsData = await AsyncStorage.getItem('dailyEarnings');
        earningsData = earningsData ? JSON.parse(earningsData) : [];
        if (!Array.isArray(earningsData)) {
          earningsData = [];
        }
        setDailyEarnings(earningsData);

        // Fetch yesterday's earnings
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDateString = yesterday.toISOString().split('T')[0];
        const yesterdayEntry = earningsData.find(
          (entry) => entry.date === yesterdayDateString
        );
        setYesterdayEarnings(yesterdayEntry ? yesterdayEntry.earnings : 0);

        // Fetch answers
        await fetchGottenAnswers();
        await fetchMissedAnswers();
      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Failed to load initial data');
      }
    };
    fetchData();
  }, []);

  // Get user stats
  const getUserStatsAsync = useCallback(async () => {
    try {
      const statsString = await AsyncStorage.getItem(USER_STATS_KEY);
      return statsString ? JSON.parse(statsString) : defaultStats;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      setError('Failed to fetch user stats');
      return defaultStats;
    }
  }, []);

  // Save user stats
  const saveUserStatsAsync = useCallback(
    async (newStats) => {
      try {
        const updatedStats = { ...stats, ...newStats };
        await AsyncStorage.setItem(
          USER_STATS_KEY,
          JSON.stringify(updatedStats)
        );
        setStats(updatedStats);
      } catch (error) {
        console.error('Error saving user stats:', error);
        setError('Failed to save user stats');
      }
    },
    [stats]
  );

  // Track and save time
  const startTrackingTime = useCallback(() => {
    return Date.now();
  }, []);

  const stopAndSaveTime = useCallback(
    async (startTime) => {
      try {
        if (startTime) {
          const timeSpent = (Date.now() - startTime) / 1000;
          const updatedStats = {
            ...stats,
            timeSpent: stats.timeSpent + timeSpent,
          };
          await saveUserStatsAsync(updatedStats);
        }
      } catch (error) {
        console.error('Error saving time:', error);
        setError('Failed to save time spent');
      }
    },
    [stats, saveUserStatsAsync]
  );

  // Format time
  const formatTime = useCallback((totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  // Save daily earnings
  const saveDailyEarnings = useCallback(async () => {
    try {
      const currentDate = new Date().toISOString().split('T')[0];
      const todayEarnings = parseFloat(
        (stats.earnings + stats.rewards).toFixed(2)
      );
      const updatedDailyEarnings = dailyEarnings.filter(
        (entry) => entry.date !== currentDate
      );
      updatedDailyEarnings.push({ date: currentDate, earnings: todayEarnings });
      setDailyEarnings(updatedDailyEarnings);
      await AsyncStorage.setItem(
        'dailyEarnings',
        JSON.stringify(updatedDailyEarnings)
      );
    } catch (error) {
      console.error('Error saving daily earnings:', error);
      setError('Failed to save daily earnings');
    }
  }, [stats, dailyEarnings]);

  // Load quiz state
  const loadQuizState = useCallback(async (categoryName) => {
    try {
      if (typeof categoryName !== 'string') {
        throw new Error('categoryName must be a string');
      }
      const state = await AsyncStorage.getItem(`quizState_${categoryName}`);
      return state ? JSON.parse(state) : null;
    } catch (error) {
      console.error('Error loading quiz state:', error);
      setError('Failed to load quiz state');
      return null;
    }
  }, []);

  // Save quiz state
  const saveQuizState = useCallback(
    async (categoryName, questionIndex, timeLeft) => {
      try {
        if (typeof categoryName !== 'string') {
          throw new Error('categoryName must be a string');
        }
        const state = { categoryName, questionIndex, timeLeft };
        await AsyncStorage.setItem(
          `quizState_${categoryName}`,
          JSON.stringify(state)
        );
      } catch (error) {
        console.error('Error saving quiz state:', error);
        setError('Failed to save quiz state');
      }
    },
    []
  );

  // Clear quiz state
  const clearQuizState = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('userStats');
      await AsyncStorage.removeItem('dailyEarnings');
      await AsyncStorage.removeItem(STORAGE_KEY_GOTTEN_ANSWERS);
      await AsyncStorage.removeItem(STORAGE_KEY_MISSED_ANSWERS);
      setStats(defaultStats);
      setDailyEarnings([]);
      setGottenAnswers([]);
      setMissedAnswers([]);
      setQuestions([]);
      setCurrentQuestionIndex(0);
      setQuizStarted(false);
      setCurrentCategory(null);
    } catch (error) {
      console.error('Error clearing quiz state:', error);
      setError('Failed to clear quiz state');
    }
  }, []);

  // Log out
  const logOut = useCallback(() => {
    setUser(null);
    setUsername('');
    clearQuizState();
  }, [clearQuizState]);

  // Handle app state changes
  useEffect(() => {
    const handleAppStateChange = (nextAppState) => {
      console.log('AppState changed to:', nextAppState);
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        if (currentCategory && quizStarted) {
          saveQuizState(currentCategory, currentQuestionIndex, remainingTime);
        }
      } else if (nextAppState === 'active' && quizStarted) {
        setPopupMessage('Quiz resumed!');
        setPopupVisible(true);
        setTimeout(() => setPopupVisible(false), 1000);
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
      subscription.remove();
    };
  }, [
    currentCategory,
    quizStarted,
    currentQuestionIndex,
    remainingTime,
    saveQuizState,
  ]);

  const value = {
    quizStarted,
    setQuizStarted,
    questions,
    setQuestions,
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
    isFetchingQuestions,
    setIsFetchingQuestions,
    currentCategory,
    setCurrentCategory,
    user,
    setUser,
    username,
    setUsername,
    stats,
    setStats,
    dailyEarnings,
    setDailyEarnings,
    yesterdayEarnings,
    setYesterdayEarnings,
    gottenAnswers,
    setGottenAnswers,
    missedAnswers,
    setMissedAnswers,
    error,
    setError,
    categories,
    fetchQuestions,
    handleSubmit,
    startTrackingTime,
    stopAndSaveTime,
    formatTime,
    saveDailyEarnings,
    loadQuizState,
    saveQuizState,
    clearQuizState,
    logOut,
    fetchGottenAnswers,
    fetchMissedAnswers,
  };

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
};

// import React, {
//   createContext,
//   useState,
//   useEffect,
//   useRef,
//   useCallback,
// } from 'react';
// import {
//   collection,
//   getDoc,
//   getDocs,
//   doc,
//   onSnapshot,
//   query,
//   where,
//   setDoc,
// } from 'firebase/firestore';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// import { Alert, AppState } from 'react-native';
// // import { storeData, getData } from './custom/AsyncStorage';
// import {
//   signInWithEmailAndPassword,
//   signOut,
//   createUserWithEmailAndPassword,
//   onAuthStateChanged,
// } from 'firebase/auth';
// import { auth, db } from '../database/FirebaseConfig';
// // import { useNavigation } from '@react-navigation/native';

// const USER_STATS_KEY = '@user_stats';

// const defaultStats = {
//   rewards: 0,
//   earnings: 0,
//   totalEarnings: 0,
//   correctAnswers: 0,
//   wrongAnswers: 0,
//   totalAttemptedQuestions: 0,
//   timeSpent: 0,
// };

// const QuizContext = createContext();

// const QuizProvider = ({ children }) => {
//   const [quizStarted, setQuizStarted] = useState(false);
//   const [questions, setQuestions] = useState([]);
//   const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
//   const [selectedOption, setSelectedOption] = useState(null);
//   const [wrongAnswers, setWrongAnswers] = useState(0);
//   const [backgroundColor, setBackgroundColor] = useState('');
//   const [popupMessage, setPopupMessage] = useState('');
//   const [popupVisible, setPopupVisible] = useState(false);
//   const [remainingTime, setRemainingTime] = useState(15);
//   const [isTimeUp, setIsTimeUp] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const timerRef = useRef(null);
//   const [currentCategory, setCurrentCategory] = useState(null);
//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
//   const [isLoggedIn, setIsLoggedIn] = useState(false);
//   const [user, setUser] = useState(null);
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [username, setUsername] = useState('');
//   const [stats, setStats] = useState(defaultStats);
//   const [yesterdayEarnings, setYesterdayEarnings] = useState(0);
//   const [gottenAnswers, setGottenAnswers] = useState([]);
//   const [missedAnswers, setMissedAnswers] = useState([]);
//   const [Error, setError] = useState(null);
//   const [dailyEarnings, setDailyEarnings] = useState([]);

//   const [categories, setCategories] = useState([
//     { id: '1', name: 'General', icon: 'earth' },
//     { id: '2', name: 'Sports', icon: 'soccer' },
//     { id: '3', name: 'Science', icon: 'flask' },
//     { id: '4', name: 'History', icon: 'book' },
//     { id: '5', name: 'Art', icon: 'palette' },
//     { id: '6', name: 'Technology', icon: 'laptop' },
//   ]);

//   // const navigation = useNavigation();

//   const intervalIdRef = useRef(null);
//   const timeoutIdRef = useRef(null);

//   // function to clear storage
//   useEffect(() => {
//     const clearStorage = async () => {
//       try {
//         await AsyncStorage.clear();
//         console.log('Storage successfully cleared!');
//       } catch (error) {
//         console.error('Failed to clear storage:', error);
//       }
//     };
//     // Call the clearStorage function when the component mounts
//     // clearStorage();
//   }, []);

//   useEffect(() => {
//     console.log('QuestionScreen mounted with category:', categories);
//     fetchQuestions(categories);
//     return () => {
//       console.log('QuestionScreen unmounting');
//       stopTimer();
//       if (timeoutIdRef.current) {
//         clearTimeout(timeoutIdRef.current);
//       }
//     };
//   }, [categories, fetchQuestions, stopTimer]);

//   // Fetch questions
//   const fetchQuestions = useCallback(async (categoryName) => {
//     setIsFetchingQuestions(true);
//     try {
//       if (typeof categoryName !== 'string') {
//         throw new Error('categoryName must be a string');
//       }
//       setCurrentCategory(categoryName);
//       const cachedQuestions = await AsyncStorage.getItem(
//         `questions_${categoryName}`
//       );
//       if (cachedQuestions) {
//         setQuestions(JSON.parse(cachedQuestions));
//         return;
//       }
//       const categoryDocRef = doc(db, 'questions', categoryName);
//       const questionListRef = query(
//         collection(categoryDocRef, 'questionList'),
//         limit(10)
//       );
//       const snapshot = await getDocs(questionListRef);
//       if (snapshot.empty) {
//         throw new Error(`No questions found for category: ${categoryName}`);
//       }
//       const fetchedQuestions = snapshot.docs.map((doc) => ({
//         id: doc.id,
//         ...doc.data(),
//       }));
//       await AsyncStorage.setItem(
//         `questions_${categoryName}`,
//         JSON.stringify(fetchedQuestions)
//       );
//       setQuestions(fetchedQuestions);
//     } catch (error) {
//       console.error('Error fetching questions:', error);
//       throw error;
//     } finally {
//       setIsFetchingQuestions(false);
//     }
//   }, []);

//   // AsyncStorage keys
//   const STORAGE_KEY_GOTTEN_ANSWERS = '@gottenAnswers';
//   const STORAGE_KEY_MISSED_ANSWERS = '@missedAnswers';

//   // Function to save answers to AsyncStorage
//   const saveAnswersToStorage = async (gottenAnswers, missedAnswers) => {
//     try {
//       await AsyncStorage.setItem(
//         STORAGE_KEY_GOTTEN_ANSWERS,
//         JSON.stringify(gottenAnswers)
//       );
//       await AsyncStorage.setItem(
//         STORAGE_KEY_MISSED_ANSWERS,
//         JSON.stringify(missedAnswers)
//       );
//     } catch (error) {
//       console.error('Error saving answers to storage:', error);
//     }
//   };

//   // Function to fetch gotten answers from AsyncStorage
//   const fetchGottenAnswers = async () => {
//     try {
//       const storedAnswers = await AsyncStorage.getItem(
//         STORAGE_KEY_GOTTEN_ANSWERS
//       );
//       return storedAnswers ? JSON.parse(storedAnswers) : [];
//     } catch (error) {
//       console.error('Error fetching gotten answers:', error);
//       return [];
//     }
//   };

//   // Function to fetch missed answers from AsyncStorage
//   const fetchMissedAnswers = async () => {
//     try {
//       const storedAnswers = await AsyncStorage.getItem(
//         STORAGE_KEY_MISSED_ANSWERS
//       );
//       return storedAnswers ? JSON.parse(storedAnswers) : [];
//     } catch (error) {
//       console.error('Error fetching missed answers:', error);
//       return [];
//     }
//   };

//   // Memoize handleSubmit
//   const handleSubmit = useCallback(
//     async (isCorrect) => {
//       const currentQuestion = questions[currentQuestionIndex];
//       const answeredQuestion = {
//         question: currentQuestion.questionText,
//         correctAnswer: currentQuestion.answer,
//         selectedAnswer: selectedOption,
//       };

//       let updatedStats = {
//         ...stats,
//         totalAttemptedQuestions: stats.totalAttemptedQuestions + 1,
//       };
//       let newEarnings = updatedStats.earnings;
//       let newRewards = updatedStats.rewards;

//       if (isCorrect) {
//         updatedStats.correctAnswers += 1;
//         newEarnings += 0.1;
//         setPopupMessage('Correct! You earned $0.1');
//         if (updatedStats.correctAnswers === 10) {
//           newRewards += 0.5;
//           setPopupMessage('Bonus! 10 correct answers! You earned $0.5');
//         } else if (updatedStats.correctAnswers === 20) {
//           newRewards += 1.0;
//           setPopupMessage('Amazing! 20 correct answers! You earned $1');
//         }
//       } else {
//         updatedStats.wrongAnswers += 1;
//         newEarnings -= 0.01;
//         setPopupMessage('Wrong! You lost $0.01');
//       }

//       const newTotalEarnings = parseFloat(
//         (newEarnings + newRewards).toFixed(2)
//       );
//       updatedStats.earnings = parseFloat(newEarnings.toFixed(2));
//       updatedStats.rewards = parseFloat(newRewards.toFixed(2));
//       updatedStats.totalEarnings = newTotalEarnings;

//       // Update daily earnings
//       const today = new Date().toISOString().split('T')[0];
//       const updatedDailyEarnings = dailyEarnings.filter(
//         (entry) => entry.date !== today
//       );
//       updatedDailyEarnings.push({ date: today, earnings: newTotalEarnings });
//       setDailyEarnings(updatedDailyEarnings);
//       await AsyncStorage.setItem(
//         'dailyEarnings',
//         JSON.stringify(updatedDailyEarnings)
//       );
//       console.log('Daily earnings saved successfully:', updatedDailyEarnings);

//       await AsyncStorage.setItem('userStats', JSON.stringify(updatedStats));
//       setStats(updatedStats);
//       setIsSubmitted(true);
//       setPopupVisible(true);
//     },
//     [questions, currentQuestionIndex, selectedOption, stats, dailyEarnings]
//   );

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         // Fetch stats from AsyncStorage
//         const fetchedStats = await getUserStatsAsync();
//         setStats(fetchedStats);
//         console.log('Stats fetched successfully:', fetchedStats);

//         // Load yesterday's earnings
//         let earningsData = await AsyncStorage.getItem('dailyEarnings');
//         earningsData = earningsData ? JSON.parse(earningsData) : [];

//         // Verify that earningsData is an array
//         if (!Array.isArray(earningsData)) {
//           console.warn(
//             'Expected earningsData to be an array, received:',
//             typeof earningsData
//           );
//           earningsData = []; // Fallback to empty array if not an array
//         }

//         // Get yesterday's date in YYYY-MM-DD format
//         const yesterday = new Date();
//         yesterday.setDate(yesterday.getDate() - 1);
//         const yesterdayDateString = yesterday.toISOString().split('T')[0];

//         // Find yesterday's entry and set the earnings if it exists
//         const yesterdayEntry = earningsData.find(
//           (entry) => entry.date === yesterdayDateString
//         );
//         setYesterdayEarnings(yesterdayEntry ? yesterdayEntry.earnings : 0);
//       } catch (error) {
//         console.error('Error fetching data:', error);
//       }
//     };

//     fetchData();
//   }, []);

//   // Separate useEffect for saving daily earnings to AsyncStorage based on stats change
//   useEffect(() => {
//     const saveEarnings = async () => {
//       if (stats.earnings !== undefined && stats.rewards !== undefined) {
//         await saveDailyEarnings();
//         console.log('Daily earnings updated based on stats change.');
//       }
//     };

//     saveEarnings();
//   }, [stats]);

//   // Fetch stats from AsyncStorage
//   const getUserStatsAsync = async () => {
//     try {
//       const statsString = await AsyncStorage.getItem(USER_STATS_KEY);
//       return statsString ? JSON.parse(statsString) : defaultStats;
//     } catch (error) {
//       console.error('Error fetching user stats from AsyncStorage:', error);
//       return defaultStats;
//     }
//   };

//   // 1. Function to track and save time spent

//   // Helper function to format time in hh:mm:ss
//   const formatTime = (totalSeconds) => {
//     const hours = Math.floor(totalSeconds / 3600);
//     const minutes = Math.floor((totalSeconds % 3600) / 60);
//     const seconds = Math.floor(totalSeconds % 60);

//     return `${hours.toString().padStart(2, '0')}:${minutes
//       .toString()
//       .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
//   };

//   // Function to track and save time spent
//   const startTrackingTime = () => Date.now(); // Return the start time when the question is displayed

//   const stopAndSaveTime = async (startTime) => {
//     try {
//       const endTime = Date.now();
//       const timeTaken = (endTime - startTime) / 1000; // Time in seconds

//       // Fetch current stats from AsyncStorage
//       const currentStats = await getUserStatsAsync();

//       // Update timeSpent in stats
//       const updatedTimeSpent = (currentStats.timeSpent || 0) + timeTaken;
//       const updatedStats = { ...currentStats, timeSpent: updatedTimeSpent };

//       // Save updated stats to AsyncStorage
//       await saveUserStatsAsync(updatedStats);

//       // Log the formatted time
//       // console.log(
//       //   'Time spent in hh:mm:ss format:',
//       //   formatTime(updatedTimeSpent)
//       // );
//       console.log('Updated stats with timeSpent:', updatedStats);
//     } catch (error) {
//       console.error('Error updating timeSpent:', error);
//     }
//   };

//   // Function to save daily earnings

//   const saveDailyEarnings = async () => {
//     try {
//       const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
//       let earningsData = await AsyncStorage.getItem('dailyEarnings');
//       earningsData = earningsData ? JSON.parse(earningsData) : [];

//       // Check if today's entry already exists
//       const todayIndex = earningsData.findIndex(
//         (entry) => entry.date === currentDate
//       );

//       // Calculate today's earnings (stats.earnings + stats.rewards)
//       const todayEarnings = parseFloat(stats.earnings + stats.rewards);

//       if (todayIndex >= 0) {
//         // Update today's earnings without adding previous values
//         earningsData[todayIndex].earnings = todayEarnings;
//       } else {
//         // Create a new entry for today
//         earningsData.push({ date: currentDate, earnings: todayEarnings });
//       }

//       // Save the updated earnings data
//       await AsyncStorage.setItem('dailyEarnings', JSON.stringify(earningsData));
//       console.log('Daily earnings saved successfully:', earningsData);
//     } catch (error) {
//       console.error('Error saving daily earnings:', error);
//     }
//   };

//   // Memoize handleTimeUp
//   const handleTimeUp = useCallback(() => {
//     setIsTimeUp(true);
//     setPopupMessage('Time Up! No Earning.');
//     setPopupVisible(true);
//     timeoutIdRef.current = setTimeout(() => {
//       setPopupVisible(false);
//       moveToNextQuestion();
//     }, 3000);
//   }, [moveToNextQuestion]);

//   // Memoize startTimer

//   const startTimer = useCallback(
//     (duration = 15) => {
//       console.log('Starting timer with duration:', duration);
//       if (intervalIdRef.current) {
//         console.log('Clearing existing interval:', intervalIdRef.current);
//         clearInterval(intervalIdRef.current);
//       }
//       setRemainingTime(duration);
//       intervalIdRef.current = setInterval(() => {
//         setRemainingTime((prevTime) => {
//           console.log('Timer tick:', prevTime);
//           if (prevTime > 0) {
//             return prevTime - 1;
//           } else {
//             console.log('Time up, clearing interval:', intervalIdRef.current);
//             clearInterval(intervalIdRef.current);
//             intervalIdRef.current = null;
//             handleTimeUp();
//             return 0;
//           }
//         });
//       }, 1000);
//     },
//     [handleTimeUp]
//   );

//   // Memoize moveToNextQuestion
//   const moveToNextQuestion = useCallback(async () => {
//     try {
//       await saveQuizState(categories, currentQuestionIndex + 1, 15);
//       setSelectedOption(null);
//       setRemainingTime(15);
//       setIsTimeUp(false);
//       setIsSubmitted(false);

//       if (currentQuestionIndex < questions.length - 1) {
//         setCurrentQuestionIndex((prev) => prev + 1);
//         startTimer(15);
//       } else {
//         // navigation.navigate('Results'); // Navigate to results screen
//       }
//     } catch (error) {
//       console.error('Error moving to next question:', error);
//       setError('Failed to move to next question');
//     }
//   }, [categories, currentQuestionIndex, questions.length, startTimer]);

//   // Memoize stopTimer
//   const stopTimer = useCallback(() => {
//     console.log('Stopping timer:', intervalIdRef.current);
//     if (intervalIdRef.current) {
//       clearInterval(intervalIdRef.current);
//       intervalIdRef.current = null;
//     }
//   }, []);

//   // Memoize pauseTimer
//   const pauseTimer = useCallback(() => {
//     console.log('Pausing timer:', intervalIdRef.current);
//     stopTimer();
//   }, [stopTimer]);

//   // Memoize resumeTimer
//   const resumeTimer = useCallback(() => {
//     console.log('Resuming timer with:', remainingTime);
//     if (remainingTime > 0) {
//       startTimer(remainingTime);
//     }
//   }, [startTimer, remainingTime]);

//   // Handle app state changes
//   useEffect(() => {
//     const handleAppStateChange = (nextAppState) => {
//       if (nextAppState === 'background' || nextAppState === 'inactive') {
//         saveQuizState(category, currentQuestionIndex, remainingTime);
//         pauseTimer();
//       } else if (nextAppState === 'active') {
//         resumeTimer();
//       }
//     };

//     const subscription = AppState.addEventListener(
//       'change',
//       handleAppStateChange
//     );

//     return () => {
//       stopTimer();
//       if (timeoutIdRef.current) {
//         clearTimeout(timeoutIdRef.current);
//       }
//       subscription.remove();
//     };
//   }, [
//     categories,
//     currentQuestionIndex,
//     remainingTime,
//     pauseTimer,
//     resumeTimer,
//     stopTimer,
//   ]);

//   // Save quiz state to AsyncStorage
//   const saveQuizState = async (categoryName, questionIndex, timeLeft) => {
//     try {
//       if (typeof categoryName !== 'string') {
//         console.error('Invalid categoryName:', categoryName);
//         throw new Error('categoryName must be a string');
//       }
//       const state = { categoryName, questionIndex, timeLeft };
//       await AsyncStorage.setItem(
//         `quizState_${categoryName}`,
//         JSON.stringify(state)
//       );
//     } catch (error) {
//       console.error('Error saving quiz state:', error);
//     }
//   };

//   // Load quiz state from AsyncStorage
//   const loadQuizState = useCallback(async (categoryName) => {
//     try {
//       const state = await AsyncStorage.getItem(`quizState_${categoryName}`);
//       return state ? JSON.parse(state) : null;
//     } catch (error) {
//       console.error('Error loading quiz state:', error);
//       return null;
//     }
//   }, []);

//   // Save updated stats to AsyncStorage and state
//   const saveUserStatsAsync = async (newStats) => {
//     try {
//       const updatedStats = { ...stats, ...newStats };
//       await AsyncStorage.setItem(USER_STATS_KEY, JSON.stringify(updatedStats));
//       setStats(updatedStats); // Update context state
//       console.log('User stats saved to AsyncStorage:', updatedStats);
//     } catch (error) {
//       console.error('Error saving user stats to AsyncStorage:', error);
//     }
//   };

//   return (
//     <QuizContext.Provider
//       value={{
//         quizStarted,
//         setQuizStarted,
//         questions,
//         setQuestions,
//         currentQuestionIndex,
//         setCurrentQuestionIndex,
//         selectedOption,
//         setSelectedOption,
//         backgroundColor,
//         setBackgroundColor,
//         popupMessage,
//         setPopupMessage,
//         popupVisible,
//         setPopupVisible,
//         remainingTime,
//         setRemainingTime,
//         isTimeUp,
//         setIsTimeUp,
//         isLoading,
//         setIsLoading,
//         currentCategory,
//         setCurrentCategory,
//         isSubmitted,
//         setIsSubmitted,
//         categories,
//         setCategories,
//         fetchQuestions,
//         startTimer,
//         pauseTimer, // Pause timer added to context
//         saveQuizState,
//         handleSubmit,
//         moveToNextQuestion,
//         stopTimer,
//         startTrackingTime,
//         stopAndSaveTime,
//         handleSubmit,
//         isLoading,
//         setIsLoading,
//         setIsFetchingQuestions,
//         isFetchingQuestions,
//         fetchQuestions,
//         user,
//         signUp,
//         signIn,
//         logOut,
//         email,
//         setEmail,
//         password,
//         setPassword,
//         username,
//         setUsername,
//         confirmPassword,
//         setConfirmPassword,
//         stats,
//         yesterdayEarnings,
//         gottenAnswers,
//         missedAnswers,
//         fetchGottenAnswers,
//         fetchMissedAnswers,
//         formatTime,
//       }}
//     >
//       {children}
//     </QuizContext.Provider>
//   );
// };

// export { QuizContext, QuizProvider };
