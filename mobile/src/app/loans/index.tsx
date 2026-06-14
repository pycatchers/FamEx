import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useLoans } from '@/hooks/queries/use-loans';

export default function LoansScreen() {
  const router = useRouter();
  const { data: loans, isLoading } = useLoans();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {!loans?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="cash-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center">
            No loans tracked yet
          </Text>
          <Text className="text-gray-400 dark:text-gray-500 mt-2 text-center">
            Tap + to add your first loan
          </Text>
        </View>
      ) : (
        <FlatList
          data={loans}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
              onPress={() => router.push(`/loans/${item.id}`)}
            >
              <View className="flex-row justify-between items-start mb-2">
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-semibold text-base">
                    {item.lender_name}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                    {item.loan_type.replace(/_/g, ' ')} Loan
                  </Text>
                </View>
                <View className={`px-2 py-1 rounded-full ${
                  item.status === 'active' ? 'bg-green-100 dark:bg-green-900/30' :
                  item.status === 'closed' ? 'bg-gray-100 dark:bg-gray-700' :
                  'bg-red-100 dark:bg-red-900/30'
                }`}>
                  <Text className={`text-xs capitalize ${
                    item.status === 'active' ? 'text-green-700 dark:text-green-300' :
                    item.status === 'closed' ? 'text-gray-600 dark:text-gray-400' :
                    'text-red-700 dark:text-red-300'
                  }`}>
                    {item.status}
                  </Text>
                </View>
              </View>
              <View className="flex-row justify-between mt-2">
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">EMI</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {formatCurrency(item.emi_amount)}
                  </Text>
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">Outstanding</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {formatCurrency(item.outstanding_amount || item.principal_amount)}
                  </Text>
                </View>
                <View>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">Rate</Text>
                  <Text className="text-gray-900 dark:text-white font-bold">
                    {item.interest_rate}%
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => router.push('/loans/add')}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
