import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreateInsurance, useUpdateInsurance, useInsurancePolicy } from '@/hooks/queries/use-insurance';
import { POLICY_TYPES, PREMIUM_FREQUENCIES } from '@/types/insurance';
import DatePickerField from '@/components/date-picker-field';

export default function AddInsuranceScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;

  const { data: existingPolicy } = useInsurancePolicy(editId || '');
  const createMutation = useCreateInsurance();
  const updateMutation = useUpdateInsurance(editId || '');

  const [policyType, setPolicyType] = useState('');
  const [providerName, setProviderName] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [sumInsured, setSumInsured] = useState('');
  const [premiumAmount, setPremiumAmount] = useState('');
  const [premiumFrequency, setPremiumFrequency] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [nomineeName, setNomineeName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [initialized, setInitialized] = useState(!isEditing);

  useEffect(() => {
    if (existingPolicy && !initialized) {
      setPolicyType(existingPolicy.policy_type);
      setProviderName(existingPolicy.provider_name);
      setPolicyNumber(existingPolicy.policy_number);
      setSumInsured(existingPolicy.sum_insured != null ? String(existingPolicy.sum_insured) : '');
      setPremiumAmount(String(existingPolicy.premium_amount));
      setPremiumFrequency(existingPolicy.premium_frequency);
      setStartDate(existingPolicy.start_date);
      setEndDate(existingPolicy.end_date);
      setNomineeName(existingPolicy.nominee_name ?? '');
      setVehicleNumber(existingPolicy.vehicle_number ?? '');
      setNotes(existingPolicy.notes ?? '');
      setInitialized(true);
    }
  }, [existingPolicy, initialized]);

  const handleSubmit = async () => {
    if (!policyType || !providerName || !policyNumber || !premiumAmount || !premiumFrequency || !startDate || !endDate) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    const data = {
      policy_type: policyType,
      provider_name: providerName,
      policy_number: policyNumber,
      sum_insured: sumInsured ? parseFloat(sumInsured) : null,
      premium_amount: parseFloat(premiumAmount),
      premium_frequency: premiumFrequency,
      start_date: startDate,
      end_date: endDate,
      nominee_name: nomineeName || null,
      vehicle_number: vehicleNumber || null,
      notes: notes || null,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isEditing ? 'Edit Insurance' : 'Add Insurance'}
        </Text>

        {/* Policy Type */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Type *</Text>
        <View className="flex-row flex-wrap mb-4">
          {POLICY_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                policyType === type.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setPolicyType(type.value)}
            >
              <Text className={`text-sm ${
                policyType === type.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Provider */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Provider Name *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., LIC, HDFC Life"
          placeholderTextColor="#9ca3af"
          value={providerName}
          onChangeText={setProviderName}
        />

        {/* Policy Number */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Policy Number *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Policy number"
          placeholderTextColor="#9ca3af"
          value={policyNumber}
          onChangeText={setPolicyNumber}
        />

        {/* Sum Insured */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sum Insured (₹)</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Coverage amount"
          placeholderTextColor="#9ca3af"
          value={sumInsured}
          onChangeText={setSumInsured}
          keyboardType="numeric"
        />

        {/* Premium Amount */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium Amount (₹) *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Premium amount"
          placeholderTextColor="#9ca3af"
          value={premiumAmount}
          onChangeText={setPremiumAmount}
          keyboardType="numeric"
        />

        {/* Premium Frequency */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Premium Frequency *</Text>
        <View className="flex-row flex-wrap mb-4">
          {PREMIUM_FREQUENCIES.map((freq) => (
            <TouchableOpacity
              key={freq.value}
              className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                premiumFrequency === freq.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setPremiumFrequency(freq.value)}
            >
              <Text className={`text-sm ${
                premiumFrequency === freq.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}>
                {freq.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Nominee */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nominee Name</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Nominee name"
          placeholderTextColor="#9ca3af"
          value={nomineeName}
          onChangeText={setNomineeName}
        />

        {/* Vehicle Number (conditional on type) */}
        {policyType === 'vehicle' && (
          <>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Number</Text>
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
              placeholder="e.g., TN 01 AB 1234"
              placeholderTextColor="#9ca3af"
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
            />
          </>
        )}

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
          disabled={isLoading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? 'Saving...' : isEditing ? 'Update Policy' : 'Add Policy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
