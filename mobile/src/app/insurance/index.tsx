import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInsurancePolicies } from '@/hooks/queries/use-insurance';

export default function InsuranceScreen() {
  const router = useRouter();
  const { data: policies, isLoading } = useInsurancePolicies();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'life': return 'heart-outline';
      case 'health': return 'medkit-outline';
      case 'vehicle': return 'car-outline';
      case 'home': return 'home-outline';
      case 'travel': return 'airplane-outline';
      default: return 'shield-outline';
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {!policies?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="shield-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center">
            No insurance policies yet
          </Text>
          <Text className="text-gray-400 dark:text-gray-500 mt-2 text-center">
            Tap + to add your first policy
          </Text>
        </View>
      ) : (
        <FlatList
          data={policies}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
              onPress={() => router.push(`/insurance/${item.id}`)}
            >
              <View className="flex-row items-center mb-2">
                <View className="w-10 h-10 rounded-full bg-purple-50 dark:bg-purple-900/20 justify-center items-center mr-3">
                  <Icon name={getTypeIcon(item.policy_type)} size={20} color="#7c3aed" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold">
                    {item.provider_name}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                    {item.policy_type.replace(/_/g, ' ')} Insurance
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${
                  item.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Text className={`text-xs capitalize ${
                    item.status === 'active' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between mt-2">
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">Premium</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {formatCurrency(item.premium_amount)}
                  </Text>
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">Coverage</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {item.sum_insured ? formatCurrency(item.sum_insured) : '-'}
                  </Text>
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">Expires</Text>
                  <Text className="text-gray-900 dark:text-white font-bold text-sm">
                    {item.end_date}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => router.push('/insurance/add')}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
