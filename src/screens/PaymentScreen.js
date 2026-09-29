import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

import BankTransferForm from '../component/BankTransferForm';
import PayPalWithdrawForm from '../component/PayPalWithdrawForm';
import { StatusBar } from 'react-native';
import BackArrow from '../customs/backArrow';
import { QuizContext } from '../Context/QuizContext';

const PaymentScreen = ({ navigation }) => {
  const { stats } = useContext(QuizContext);
  const [selectedMethod, setSelectedMethod] = useState(null);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#e2e8f0' }}>
      <StatusBar backgroundColor="#e2e8f0" barStyle="dark-content" />
      <View>
        <BackArrow onPress={() => navigation.goBack()} />
      </View>
      <View style={{ marginTop: 20, backgroundColor: 'green' }}>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 18,
            fontWeight: '600',
            color: '#fff',
            marginTop: 10,
          }}
        >
          Please Select Your Withdrawal Method
        </Text>
        <Text style={styles.balanceText}>Available: ${stats.totalEarnings.toFixed(2)}</Text>
        <View style={styles.paymentContainer}>
          <TouchableOpacity
            onPress={() => setSelectedMethod('local')}
            style={[styles.paymentButton, selectedMethod === 'local' && styles.paymentButtonActive]}
          >
            <Text style={styles.paymentTex}>Nigerian Bank Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSelectedMethod('international')}
            style={styles.paymentButton2}
          >
            <Text style={styles.paymentTex2}>PayPal (International)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 50 }}>
        {selectedMethod === 'local' && (
          <View style={{ marginTop: 20 }}>
            <BankTransferForm onSuccess={() => navigation.navigate('ActivityScreen')} />
          </View>
        )}

        {selectedMethod === 'international' && (
          <View style={{ marginTop: 20 }}>
            <PayPalWithdrawForm onSuccess={() => navigation.navigate('ActivityScreen')} />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PaymentScreen;

const styles = StyleSheet.create({
  balanceText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    marginTop: 6,
  },
  paymentContainer: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 20,
    flexDirection: 'row',
    paddingHorizontal: 5,
  },
  paymentButton: {
    backgroundColor: '#fedfaa',
    borderRadius: 10,
    padding: 8,
  },
  paymentButtonActive: {
    backgroundColor: '#fff',
  },
  paymentButton2: {
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#fedfaa',
  },
  paymentTex: {
    color: 'green',
    fontWeight: 'bold',
    fontSize: 12,
  },
  paymentTex2: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
