import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useCreateLoan } from '@/hooks/queries/use-loans';
import { LOAN_TYPES } from '@/types/loans';
import DatePickerField from '@/components/date-picker-field';

export default function AddLoanScreen() {
  const router = useRouter();
  const createMutation = useCreateLoan();

  const [loanType, setLoanType] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [tenureMonths, setTenureMonths] = useState('');
  const [emiAmount, setEmiAmount] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [emiDay, setEmiDay] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!loanType || !lenderName || !principalAmount || !interestRate || !tenureMonths || !emiAmount || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      await createMutation.mutateAsync({
        loan_type: loanType,
        lender_name: lenderName,
        loan_account_number: accountNumber || null,
        principal_amount: parseFloat(principalAmount),
        interest_rate: parseFloat(interestRate),
        tenure_months: parseInt(tenureMonths),
        emi_amount: parseFloat(emiAmount),
        start_date: startDate,
        end_date: endDate,
        emi_day_of_month: emiDay ? parseInt(emiDay) : null,
        outstanding_amount: parseFloat(principalAmount),
        notes: notes || null,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Loan</Text>

        {/* Loan Type */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Type *</Text>
        <View className="flex-row flex-wrap mb-4">
          {LOAN_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                loanType === type.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setLoanType(type.value)}
            >
              <Text className={`text-sm ${
                loanType === type.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Lender Name */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lender Name *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., SBI, HDFC Bank"
          placeholderTextColor="#9ca3af"
          value={lenderName}
          onChangeText={setLenderName}
        />

        {/* Account Number */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Account Number</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Account/Reference number"
          placeholderTextColor="#9ca3af"
          value={accountNumber}
          onChangeText={setAccountNumber}
        />

        {/* Principal Amount */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Principal Amount (₹) *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., 500000"
          placeholderTextColor="#9ca3af"
          value={principalAmount}
          onChangeText={setPrincipalAmount}
          keyboardType="numeric"
        />

        {/* Interest Rate */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%) *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., 8.5"
          placeholderTextColor="#9ca3af"
          value={interestRate}
          onChangeText={setInterestRate}
          keyboardType="decimal-pad"
        />

        {/* Tenure */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenure (Months) *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., 60"
          placeholderTextColor="#9ca3af"
          value={tenureMonths}
          onChangeText={setTenureMonths}
          keyboardType="numeric"
        />

        {/* EMI Amount */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMI Amount (₹) *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., 10250"
          placeholderTextColor="#9ca3af"
          value={emiAmount}
          onChangeText={setEmiAmount}
          keyboardType="numeric"
        />

        {/* Start Date */}
        <DatePickerField
          label="Start Date"
          value={startDate}
          onChange={setStartDate}
          required
        />

        {/* End Date */}
        <DatePickerField
          label="End Date"
          value={endDate}
          onChange={setEndDate}
          required
          minimumDate={startDate ? new Date(startDate) : undefined}
        />

        {/* EMI Day */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMI Day of Month</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="1-28"
          placeholderTextColor="#9ca3af"
          value={emiDay}
          onChangeText={setEmiDay}
          keyboardType="numeric"
        />

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-6 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Any notes..."
          placeholderTextColor="#9ca3af"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-4 mb-4"
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createMutation.isPending ? 'Saving...' : 'Add Loan'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
