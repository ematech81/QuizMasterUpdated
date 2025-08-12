// import React, { useContext, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   ScrollView,
//   FlatList,
// } from 'react-native';
// import { LinearGradient } from 'expo-linear-gradient';
// import { QuizContext } from '../bibleContext/QuizContext';
// import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

// export default function CategoryScreen({ route, navigation }) {
//   const {
//     categories,
//     setCurrentCategory,
//     rewards,
//     earnings,
//     totalEarnings,
//     startTimer,
//     stopTimer,
//     clearQuizState,
//     loadStoredData,
//     setQuestions,
//     setCurrentQuestionIndex,
//     setRemainingTime,
//     fetchQuestions,
//     logOut,
//     user,
//     username,
//     stats,
//   } = useContext(QuizContext);

//   const switchCategory = async (categoryName) => {
//     setCurrentCategory(categoryName);
//     setQuestions([]); // Clear previous questions
//     //  setCurrentQuestionIndex(0);
//     setRemainingTime(15); // Reset the timer for the new category

//     await fetchQuestions(categoryName); // Fetch new questions
//   };

//   const handleCategorySelect = (categoryName) => {
//     // if (!user) {
//     //   navigation.navigate('SignInScreen');
//     // } else {
//     setCurrentCategory(categoryName); // Set the selected category in context
//     switchCategory(categoryName);
//     navigation.navigate('QuestionScreen', { categoryName }); // Navigate to the Question screen
//     // }
//   };

//   useEffect(() => {
//     if (route.params?.category) {
//       switchCategory(route.params.category);
//     }
//   }, [route.params?.category]);

//   const palette = [
//     { backgroundColor: '#2e02f6ff' },
//     { backgroundColor: '#08e00fff' },
//     { backgroundColor: '#09a0e0ff' },
//     { backgroundColor: '#d50694ff' },
//     { backgroundColor: '#f8af12ff' },
//     { backgroundColor: '#f7610bff' },
//   ];

//   const renderCategoryItem = ({ item, index }) => {
//     const backgroundStyle = palette[index % palette.length];

//     return (
//       <TouchableOpacity
//         style={[styles.box, backgroundStyle]}
//         onPress={() => handleCategorySelect(item.name)}
//       >
//         <Icon name={item.icon} size={30} color="white" />
//         <Text style={styles.boxText}>{item.name}</Text>
//       </TouchableOpacity>
//     );
//   };

//   return (
//     <LinearGradient colors={['#FFD9A0', '#FA56B1']} style={styles.container}>
//       {/* Back Arrow */}
//       <Text style={styles.backArrow}>←</Text>

//       {/* Instruction Text */}
//       <Text style={styles.title}>
//         Select a category to answer the questions{'\n'}
//         tailord to that category
//       </Text>

//       {/* Categories Grid */}
//       <View style={{}}>
//         <FlatList
//           data={categories}
//           showsHorizontalScrollIndicator={false}
//           renderItem={renderCategoryItem}
//           keyExtractor={(item) => item.id}
//           contentContainerStyle={styles.categoryList}
//           numColumns={2}
//         />
//       </View>
//     </LinearGradient>
//   );
// }

import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { QuizContext } from '../bibleContext/QuizContext';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';

export default function CategoryScreen({ route, navigation }) {
  const { categories, setCurrentCategory, fetchQuestions } =
    useContext(QuizContext);

  const switchCategory = async (categoryName) => {
    try {
      if (typeof categoryName !== 'string') {
        console.error('Invalid categoryName:', categoryName);
        return;
      }
      setCurrentCategory(categoryName);
      await fetchQuestions(categoryName);
      navigation.navigate('QuestionScreen', { categoryName });
    } catch (error) {
      console.error('Error switching category:', error);
    }
  };

  const handleCategorySelect = (categoryName) => {
    if (typeof categoryName !== 'string') {
      console.error('Invalid categoryName:', categoryName);
      return;
    }
    switchCategory(categoryName);
  };

  useEffect(() => {
    const category = route.params?.category;
    if (category && typeof category === 'string') {
      switchCategory(category);
    }
  }, [route.params?.category]);

  const palette = [
    { backgroundColor: '#2e02f6ff' },
    { backgroundColor: '#08e00fff' },
    { backgroundColor: '#09a0e0ff' },
    { backgroundColor: '#d50694ff' },
    { backgroundColor: '#f8af12ff' },
    { backgroundColor: '#f7610bff' },
  ];

  const renderCategoryItem = ({ item, index }) => {
    const backgroundStyle = palette[index % palette.length];

    return (
      <TouchableOpacity
        style={[styles.box, backgroundStyle]}
        onPress={() => handleCategorySelect(item.name)}
      >
        <Icon name={item.icon} size={30} color="white" />
        <Text style={styles.boxText}>{item.name}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={['#FFD9A0', '#FA56B1']} style={styles.container}>
      <Text style={styles.backArrow}>←</Text>
      <Text style={styles.title}>
        Select a category to answer the questions{'\n'}
        tailored to that category
      </Text>
      <View>
        <FlatList
          data={categories}
          showsHorizontalScrollIndicator={false}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoryList}
          numColumns={2}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  backArrow: {
    fontSize: 28,
    color: 'black',
  },
  title: {
    textAlign: 'center',
    fontSize: 20,
    marginVertical: 20,
    fontWeight: '600',
    color: '#111',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  box: {
    width: '48%',
    // aspectRatio: 2.2,
    borderRadius: 16,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    minHeight: 150,
    marginHorizontal: 4,
  },
  icon: {
    fontSize: 24,
  },
  boxText: {
    marginTop: 8,
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});
