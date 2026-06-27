import { View, Text, FlatList, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useBills, useDeleteBill } from '@/hooks/queries/use-shopping';
import { ShoppingBill } from '@/types/shopping';
import { useState } from 'react';

function BillCard({ bill, onDelete }: { bill: ShoppingBill; onDelete: () => void }) {
  const formatCurrency = (n: number) => `₹${Number(n).toLocaleString('en-IN')}`;
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  const [expanded, setExpanded] = useState(false);

  return (
    <View className="bg-white dark:bg-gray-800 rounded-xl mb-3 shadow-sm overflow-hidden">
      <TouchableOpacity
        className="p-4"
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View className="flex-row justify-between items-center">
          <View className="flex-1 mr-3">
            <Text className="text-sm font-medium text-gray-900 dark:text-white">
              {formatDate(bill.bill_date)}
            </Text>
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {bill.items.length} item{bill.items.length !== 1 ? 's' : ''}
              {bill.payment_method ? ` · ${bill.payment_method}` : ''}
            </Text>
          </View>
          <View className="items-end flex-row gap-3 items-center">
            <Text className="text-base font-bold text-gray-900 dark:text-white">
              {formatCurrency(bill.total_amount)}
            </Text>
            <TouchableOpacity
              onPress={onDelete}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
            <Icon name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && bill.items.length > 0 && (
        <View className="border-t border-gray-100 dark:border-gray-700 px-4 pb-3">
          {bill.items.map((item) => (
            <View key={item.id} className="flex-row justify-between py-1.5">
              <View className="flex-1 mr-2">
                <Text className="text-sm text-gray-800 dark:text-gray-200">{item.item_name}</Text>
                {item.quantity ? (
                  <Text className="text-xs text-gray-400 dark:text-gray-500">
                    {item.quantity} {item.unit || ''}
                    {item.mrp && item.mrp !== item.bought_price ? ` · MRP ₹${item.mrp}` : ''}
                  </Text>
                ) : null}
              </View>
              <Text className="text-sm font-medium text-gray-900 dark:text-white">
                {formatCurrency(item.bought_price)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ShopDetailScreen() {
  const { shopId, shopName } = useLocalSearchParams<{ shopId: string; shopName: string }>();
  const router = useRouter();
  const { data: bills, isLoading, refetch } = useBills(shopId);
  const deleteBill = useDeleteBill();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleDelete = (bill: ShoppingBill) => {
    const formatDate = (d: string) =>
      new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    Alert.alert(
      'Delete Bill',
      `Delete bill from ${formatDate(bill.bill_date)} (₹${Number(bill.total_amount).toLocaleString('en-IN')})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteBill.mutate(bill.id),
        },
      ],
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-xl font-bold text-gray-900 dark:text-white" numberOfLines={1}>
            {shopName}
          </Text>
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            {bills?.length ?? 0} bill{(bills?.length ?? 0) !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      <FlatList
        data={bills}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 32 }}
        renderItem={({ item }) => (
          <BillCard bill={item} onDelete={() => handleDelete(item)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Icon name="receipt-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 mt-3">No bills for this shop yet.</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
