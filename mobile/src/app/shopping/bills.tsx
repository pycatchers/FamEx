import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useBills } from '@/hooks/queries/use-shopping';

export default function BillsScreen() {
  const router = useRouter();
  const { data: bills, isLoading } = useBills();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'ocr': return 'camera-outline';
      case 'voice': return 'mic-outline';
      default: return 'create-outline';
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {!bills?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="receipt-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No bills yet</Text>
        </View>
      ) : (
        <FlatList
          data={bills}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
              onPress={() => router.push(`/shopping/bill-detail?id=${item.id}`)}
            >
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    {formatCurrency(item.total_amount)}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    {item.bill_date} · {item.items.length} items
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Icon name={getMethodIcon(item.entry_method)} size={16} color="#6b7280" />
                  <Text className="text-gray-400 dark:text-gray-500 text-xs ml-1 capitalize">
                    {item.entry_method}
                  </Text>
                </View>
              </View>
              {item.items.length > 0 && (
                <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2" numberOfLines={1}>
                  {item.items.map(i => i.item_name).join(', ')}
                </Text>
              )}
            </TouchableOpacity>
          )}
        />
      )}

      {/* Entry Mode Buttons */}
      <View className="absolute bottom-6 right-6 items-end gap-3">
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.push('/shopping/ocr-bill')}
        >
          <View className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1 mr-2 shadow-sm">
            <Text className="text-gray-700 dark:text-gray-300 text-xs">Scan</Text>
          </View>
          <View className="w-11 h-11 rounded-full bg-purple-600 justify-center items-center shadow-lg">
            <Icon name="camera-outline" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center"
          onPress={() => router.push('/shopping/voice-bill')}
        >
          <View className="bg-white dark:bg-gray-800 rounded-lg px-3 py-1 mr-2 shadow-sm">
            <Text className="text-gray-700 dark:text-gray-300 text-xs">Voice</Text>
          </View>
          <View className="w-11 h-11 rounded-full bg-green-600 justify-center items-center shadow-lg">
            <Icon name="mic-outline" size={20} color="white" />
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          className="w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
          onPress={() => router.push('/shopping/add-bill')}
        >
          <Icon name="create-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
