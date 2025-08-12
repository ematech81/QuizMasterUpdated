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

export default function SecondCategoryScreen({ route, navigation }) {
  const { categories, setCurrentCategory, fetchQuestions } =
    useContext(QuizContext);

  const handleCategorySelect = async (categoryName) => {
    try {
      if (typeof categoryName !== 'string') {
        console.error('Invalid categoryName:', categoryName);
        return;
      }
      setCurrentCategory(categoryName);
      await fetchQuestions(categoryName);
      navigation.navigate('Question', { categoryName });
    } catch (error) {
      console.error('Error selecting category:', error);
    }
  };

  useEffect(() => {
    const category = route.params?.category;
    if (category && typeof category === 'string') {
      handleCategorySelect(category);
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
    padding: 20,
  },
  backArrow: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  categoryList: {
    paddingBottom: 20,
  },
  box: {
    flex: 1,
    margin: 10,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
  },
});
