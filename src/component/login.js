import React, { useState, useContext } from 'react';
import { QuizContext } from '../Context/QuizContext';
import {
  KeyboardAvoidingView,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const navigation = useNavigation();
  const { signIn } = useContext(QuizContext);

  const handleSignIn = async () => {
    setFormError('');

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      setFormError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      // Root navigator switches to the main app automatically once
      // the context's `user` becomes non-null - no manual navigate needed.
    } catch (error) {
      setFormError(error.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
      <View style={styles.container}>
        <Text style={styles.welcomeText}>Welcome Back</Text>
        <View style={styles.formWrapper}>
          <Text style={styles.headerText}>Sign In</Text>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Email:</Text>
            <TextInput
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.label}>Password:</Text>
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
          </View>

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <TouchableOpacity
            style={[styles.submitButton, loading && { opacity: 0.6 }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.submitButtonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.prompt}>
            <Text style={styles.promptText1}>Don't have an account?</Text>
            <Pressable onPress={() => navigation.navigate('SignUpScreen')}>
              <Text style={styles.promptText}> Sign Up here</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export default Login;

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginTop: 40,
    flex: 1,
    alignItems: 'center',
  },
  welcomeText: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 24,
    marginBottom: 20,
  },
  formWrapper: {
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 10,
    width: '90%',
    alignItems: 'center',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 20,
  },
  inputWrapper: {
    width: '90%',
    marginVertical: 10,
  },
  input: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    width: '100%',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#525252',
    marginBottom: 5,
  },
  errorText: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
    width: '90%',
  },
  submitButton: {
    backgroundColor: '#60a5fa',
    padding: 12,
    width: '90%',
    alignItems: 'center',
    borderRadius: 10,
    marginVertical: 20,
  },
  submitButtonText: {
    fontWeight: 'bold',
    fontSize: 18,
    color: 'white',
  },
  prompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promptText: {
    color: 'blue',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  promptText1: {
    fontWeight: 'bold',
  },
});
