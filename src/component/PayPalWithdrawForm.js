import React, { useContext, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { QuizContext } from '../Context/QuizContext';
import { requestWithdrawal } from '../api/withdrawals';

// Withdrawals are processed manually by an admin for now, so this just
// collects the PayPal email to send the payout to.
const PayPalWithdrawForm = ({ onSuccess }) => {
  const { stats, refreshWallet } = useContext(QuizContext);

  const [paypalEmail, setPaypalEmail] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const available = stats.totalEarnings;

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(paypalEmail)) {
      Alert.alert('Invalid email', 'Please enter a valid PayPal email address.');
      return;
    }

    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid withdrawal amount.');
      return;
    }

    if (numericAmount < 50) {
      Alert.alert('Minimum withdrawal', 'The minimum withdrawal amount is $50.');
      return;
    }

    if (numericAmount > available) {
      Alert.alert(
        'Insufficient balance',
        `You only have $${available.toFixed(2)} available to withdraw.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await requestWithdrawal({ method: 'paypal', amount: numericAmount, paypalEmail });
      await refreshWallet();
      Alert.alert(
        'Request submitted',
        'Your withdrawal request has been submitted and will be reviewed shortly.'
      );
      setPaypalEmail('');
      setAmount('');
      onSuccess?.();
    } catch (err) {
      Alert.alert('Could not submit request', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PayPal Withdrawal</Text>
      <Text style={styles.available}>Available: ${available.toFixed(2)}</Text>

      <Text style={styles.label}>PayPal Email</Text>
      <TextInput
        style={styles.input}
        value={paypalEmail}
        onChangeText={setPaypalEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <Text style={styles.label}>Amount to Withdraw (USD)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        placeholder={`Min $50, up to $${available.toFixed(2)}`}
        keyboardType="numeric"
      />

      <View style={{ marginVertical: 20 }}>
        {isSubmitting ? (
          <ActivityIndicator size="large" color="#22c55e" />
        ) : (
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
            <Text style={styles.submitBtnText}>Submit Withdrawal Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 4, textAlign: 'center' },
  available: { textAlign: 'center', color: '#22c55e', fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  submitBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default PayPalWithdrawForm;
