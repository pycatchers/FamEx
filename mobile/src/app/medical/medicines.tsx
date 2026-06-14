import { View, Text, FlatList, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useActiveMedicines } from '@/hooks/queries/use-medical';

export default function MedicinesScreen() {
  const { data: medicines, isLoading } = useActiveMedicines();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!medicines?.length) {
    return (
      <View className="flex-1 justify-center items-center px-6 bg-gray-50 dark:bg-gray-900">
        <Icon name="medical-outline" size={64} color="#9ca3af" />
        <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No active medicines</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      <FlatList
        data={medicines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        ListHeaderComponent={() => (
          <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">
            {medicines.length} active medicine{medicines.length !== 1 ? 's' : ''}
          </Text>
        )}
        renderItem={({ item }) => (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold text-lg">{item.name}</Text>
                {item.dosage && <Text className="text-gray-500 dark:text-gray-400">{item.dosage}</Text>}
              </View>
              {item.timing && (
                <View className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  <Text className="text-green-700 dark:text-green-300 text-xs capitalize">
                    {item.timing.replace('_', ' ')}
                  </Text>
                </View>
              )}
            </View>

            <View className="flex-row mt-3 gap-2">
              {item.morning && (
                <View className="flex-row items-center bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                  <Icon name="sunny-outline" size={12} color="#d97706" />
                  <Text className="text-yellow-700 dark:text-yellow-300 text-xs ml-1">Morning</Text>
                </View>
              )}
              {item.afternoon && (
                <View className="flex-row items-center bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                  <Icon name="partly-sunny-outline" size={12} color="#ea580c" />
                  <Text className="text-orange-700 dark:text-orange-300 text-xs ml-1">Afternoon</Text>
                </View>
              )}
              {item.night && (
                <View className="flex-row items-center bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded">
                  <Icon name="moon-outline" size={12} color="#4f46e5" />
                  <Text className="text-indigo-700 dark:text-indigo-300 text-xs ml-1">Night</Text>
                </View>
              )}
            </View>

            {(item.doctor_name || item.diagnosis) && (
              <View className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                {item.doctor_name && <Text className="text-gray-400 dark:text-gray-500 text-xs">Dr. {item.doctor_name}</Text>}
                {item.diagnosis && <Text className="text-gray-400 dark:text-gray-500 text-xs">For: {item.diagnosis}</Text>}
              </View>
            )}

            {item.end_date && (
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1">Until {item.end_date}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}
