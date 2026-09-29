import { apiClient } from './client';

export async function fetchCategories() {
  const data = await apiClient.get('/quiz/categories');
  return data.categories;
}

export async function fetchQuestions(categoryName) {
  const data = await apiClient.get(`/quiz/questions/${encodeURIComponent(categoryName)}`);
  return { questions: data.questions, exhausted: !!data.exhausted };
}

export async function submitAnswer({ category, questionId, selectedOption, isTimeout }) {
  return apiClient.post('/quiz/submit-answer', {
    category,
    questionId,
    selectedOption,
    isTimeout,
  });
}

export async function completeQuiz() {
  return apiClient.post('/quiz/complete');
}
