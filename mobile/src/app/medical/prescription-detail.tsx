import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { usePrescription, useDeletePrescription } from '@/hooks/queries/use-medical';

export default function PrescriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: prescription, isLoading } = usePrescription(id);
  const deletePrescription = useDeletePrescription();

  if (isLoading || !prescription) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Prescription', 'This will also remove all associated medicines.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deletePrescription.mutateAsync(id); router.back(); } },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          {prescription.diagnosis && (
            <Text className="text-xl font-bold text-gray-900 dark:text-white mb-1">{prescription.diagnosis}</Text>
          )}
          <Text className="text-gray-500 dark:text-gray-400">{prescription.prescription_date}</Text>
          {prescription.follow_up_date && (
            <View className="flex-row items-center mt-2">
              <Icon name="calendar-outline" size={14} color="#d97706" />
              <Text className="text-orange-600 dark:text-orange-400 text-sm ml-1">
                Follow-up: {prescription.follow_up_date}
              </Text>
            </View>
          )}
          {prescription.notes && (
            <Text className="text-gray-600 dark:text-gray-300 mt-2">{prescription.notes}</Text>
          )}
        </View>

        {/* Medicines */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Medicines</Text>
        {prescription.medicines.map((med) => (
          <View key={med.id} className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-2 shadow-sm">
            <Text className="text-gray-900 dark:text-white font-semibold">{med.name}</Text>
            {med.dosage && (
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{med.dosage}</Text>
            )}
            <View className="flex-row mt-2 gap-2">
              {med.morning && (
                <View className="bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                  <Text className="text-yellow-700 dark:text-yellow-300 text-xs">Morning</Text>
                </View>
              )}
              {med.afternoon && (
                <View className="bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                  <Text className="text-orange-700 dark:text-orange-300 text-xs">Afternoon</Text>
                </View>
              )}
              {med.night && (
                <View className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                  <Text className="text-indigo-700 dark:text-indigo-300 text-xs">Night</Text>
                </View>
              )}
            </View>
            {med.timing && (
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1 capitalize">
                {med.timing.replace('_', ' ')}
              </Text>
            )}
          </View>
        ))}

        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 mt-6"
          onPress={handleDelete}
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete Prescription</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
