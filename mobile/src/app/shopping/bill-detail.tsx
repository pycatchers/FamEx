import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useBill, useDeleteBill } from '@/hooks/queries/use-shopping';

export default function BillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bill, isLoading } = useBill(id);
  const deleteBill = useDeleteBill();

  if (isLoading || !bill) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handleDelete = () => {
    Alert.alert('Delete Bill', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteBill.mutateAsync(id); router.back(); } },
    ]);
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(bill.total_amount)}
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 capitalize text-sm">
              {bill.entry_method}
            </Text>
          </View>
          <Text className="text-gray-500 dark:text-gray-400">{bill.bill_date}</Text>
          {bill.payment_method && (
            <Text className="text-gray-400 dark:text-gray-500 text-sm capitalize mt-1">
              Paid via {bill.payment_method}
            </Text>
          )}
        </View>

        {/* Items */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Items</Text>
        {bill.items.map((item) => (
          <View key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 flex-row justify-between items-center shadow-sm">
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-medium">{item.item_name}</Text>
              {item.quantity && (
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {item.quantity} {item.unit || ''}
                </Text>
              )}
            </View>
            <Text className="text-gray-900 dark:text-white font-bold">
              {formatCurrency(item.bought_price)}
            </Text>
          </View>
        ))}

        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 mt-6"
          onPress={handleDelete}
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete Bill</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
