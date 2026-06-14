import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { usePrescriptions } from '@/hooks/queries/use-medical';

export default function PrescriptionsScreen() {
  const router = useRouter();
  const { data: prescriptions, isLoading } = usePrescriptions();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {!prescriptions?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="document-text-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No prescriptions yet</Text>
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
              onPress={() => router.push(`/medical/prescription-detail?id=${item.id}`)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  {item.diagnosis && (
                    <Text className="text-gray-900 dark:text-white font-semibold">{item.diagnosis}</Text>
                  )}
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    {item.prescription_date} · {item.medicines.length} medicines
                  </Text>
                </View>
                {item.follow_up_date && (
                  <View className="bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded">
                    <Text className="text-orange-600 dark:text-orange-400 text-xs">
                      Follow-up: {item.follow_up_date}
                    </Text>
                  </View>
                )}
              </View>
              {item.medicines.length > 0 && (
                <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2" numberOfLines={1}>
                  {item.medicines.map(m => m.name).join(', ')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => router.push('/medical/add-prescription')}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
