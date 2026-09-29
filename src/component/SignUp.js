import React, { useState, useContext } from 'react';
import { QuizContext } from '../Context/QuizContext';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Checkbox from '../customs/Checkbox';

function SignUp() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [privacyError, setPrivacyError] = useState('');

  const [loading, setLoading] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const { signUp } = useContext(QuizContext);

  const openPrivacyPolicy = () => {
    Linking.openURL('https://ematech81.github.io/privacyPolicy/#privacy-policy');
  };

  const openTermsAndConditions = () => {
    Linking.openURL('https://ematech81.github.io/privacyPolicy/#terms-and-conditions');
  };

  const handleSignUp = async () => {
    setEmailError('');
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setFormError('');
    setPrivacyError('');

    if (!isChecked) {
      setPrivacyError('Please agree to the Privacy Policy and Terms and Conditions.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;

    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      hasError = true;
    }

    if (username.trim().length < 3) {
      setUsernameError('Username must be at least 3 characters');
      hasError = true;
    }

    if (password.length < 6) {
      setPasswordError('Password length cannot be less than 6 characters');
      hasError = true;
    }

    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      hasError = true;
    }

    if (hasError) return;

    try {
      setLoading(true);
      await signUp(username.trim(), email.trim(), password);
      // Root navigator switches to the main app automatically once
      // the context's `user` becomes non-null - no manual navigate needed.
    } catch (error) {
      setFormError(error.message || 'An error occurred during sign-up. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 50 }}
    >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ padding: 16, marginTop: 40 }}>
          <Text style={styles.signUp}>Welcome</Text>

          <View style={styles.formWrapper}>
            <Text style={styles.signUp}>Sign Up</Text>

            {formError ? <Text style={styles.formErrorText}>{formError}</Text> : null}

            <View style={{ width: '90%', margin: 'auto', marginVertical: 20 }}>
              <Text style={styles.label}>Email:</Text>
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={(text) => setEmail(text.trim())}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            <View style={{ width: '90%', margin: 'auto', marginVertical: 20 }}>
              <Text style={styles.label}>Username:</Text>
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
                autoCapitalize="none"
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            </View>

            <View style={{ width: '90%', margin: 'auto', marginVertical: 15 }}>
              <Text style={styles.label}>Password:</Text>
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                style={styles.input}
              />
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <View style={{ width: '90%', margin: 'auto', marginVertical: 15 }}>
              <Text style={styles.label}> Confirm Password:</Text>
              <TextInput
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                style={styles.input}
              />
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            <View style={styles.checkboxContainer}>
              <Checkbox value={isChecked} onValueChange={setIsChecked} />
              <Text style={styles.labelPrivacy}>
                By clicking the sign up button, You agree to our{' '}
                <Text style={styles.link} onPress={openPrivacyPolicy}>
                  Privacy Policy
                </Text>{' '}
                and{' '}
                <Text style={styles.link} onPress={openTermsAndConditions}>
                  Terms and Conditions
                </Text>
                .
              </Text>
            </View>
            {privacyError ? <Text style={styles.errorText}>{privacyError}</Text> : null}

            <TouchableOpacity
              style={[styles.submit, loading && { opacity: 0.6 }]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ fontWeight: 'bold', fontSize: 18, color: 'white' }}>Sign Up</Text>
              )}
            </TouchableOpacity>

            <View style={styles.prompt}>
              <Text style={styles.promptText1}>Already have an account?</Text>
              <Pressable onPress={() => navigation.navigate('SignInScreen')}>
                <Text style={styles.promptText}>Sign In here</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScrollView>
  );
}

export default SignUp;

const styles = StyleSheet.create({
  signUp: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 8,
    paddingLeft: 15,
    backgroundColor: '#f9f9f9',
  },
  label: {
    fontSize: 18,
    fontWeight: '700',
    color: '#525252',
  },
  submit: {
    height: 50,
    width: '90%',
    padding: 6,
    marginVertical: 15,
    backgroundColor: '#60a5fa',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  formWrapper: {
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    backgroundColor: 'white',
    paddingVertical: 16,
    borderRadius: 10,
  },
  prompt: {
    width: '90%',
    margin: 'auto',
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  promptText: {
    color: 'blue',
    fontWeight: 'bold',
    marginLeft: 5,
  },
  promptText1: {
    fontWeight: 'bold',
    marginLeft: 1,
  },
  errorText: {
    color: 'red',
    fontWeight: '600',
    fontSize: 14,
  },
  formErrorText: {
    color: 'red',
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 16,
    width: '90%',
    alignSelf: 'center',
  },
  labelPrivacy: {
    marginLeft: 10,
    color: '#34495e',
    flexShrink: 1,
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});
