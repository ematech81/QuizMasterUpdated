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

const BANKS = ['First Bank', 'Access Bank', 'GTBank', 'Zenith Bank', 'UBA'];

const BankTransferForm = ({ onSuccess }) => {
  const { stats, refreshWallet } = useContext(QuizContext);

  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const available = stats.totalEarnings;

  const handleSubmit = async () => {
    const numericAmount = parseFloat(amount);

    if (!bankName || !accountNumber || !accountName || !amount) {
      Alert.alert('Missing information', 'Please fill in all fields.');
      return;
    }

    if (!/^\d{10}$/.test(accountNumber)) {
      Alert.alert('Invalid account number', 'Account number must be exactly 10 digits.');
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

    Alert.alert(
      'Confirm Withdrawal',
      `Withdraw $${numericAmount.toFixed(2)} to ${accountName} (${bankName})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              await requestWithdrawal({
                method: 'bank',
                amount: numericAmount,
                bankDetails: { bankName, accountNumber, accountName },
              });
              await refreshWallet();
              Alert.alert(
                'Request submitted',
                'Your withdrawal request has been submitted and will be reviewed shortly.'
              );
              setBankName('');
              setAccountNumber('');
              setAccountName('');
              setAmount('');
              onSuccess?.();
            } catch (err) {
              Alert.alert('Could not submit request', err.message);
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nigerian Bank Transfer</Text>
      <Text style={styles.available}>Available: ${available.toFixed(2)}</Text>

      <Text style={styles.label}>Bank</Text>
      <View style={styles.bankRow}>
        {BANKS.map((bank) => (
          <TouchableOpacity
            key={bank}
            style={[styles.bankChip, bankName === bank && styles.bankChipSelected]}
            onPress={() => setBankName(bank)}
          >
            <Text
              style={[styles.bankChipText, bankName === bank && styles.bankChipTextSelected]}
            >
              {bank}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Account Number</Text>
      <TextInput
        style={styles.input}
        value={accountNumber}
        onChangeText={setAccountNumber}
        placeholder="10-digit account number"
        keyboardType="numeric"
        maxLength={10}
      />

      <Text style={styles.label}>Account Name</Text>
      <TextInput
        style={styles.input}
        value={accountName}
        onChangeText={setAccountName}
        placeholder="Enter your account name"
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
  container: {
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  available: {
    textAlign: 'center',
    color: '#22c55e',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  bankRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
    gap: 8,
  },
  bankChip: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bankChipSelected: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  bankChipText: {
    fontSize: 13,
    color: '#111',
  },
  bankChipTextSelected: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default BankTransferForm;
