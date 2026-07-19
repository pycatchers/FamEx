import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useBill, useDeleteBill, useUpdateBill } from '@/hooks/queries/use-shopping';
import BillPhotoField from '@/components/bill-photo-field';

export default function BillDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bill, isLoading } = useBill(id);
  const deleteBill = useDeleteBill();
  const updateBill = useUpdateBill();
  const [viewerVisible, setViewerVisible] = useState(false);

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
          <View className="flex-row items-center">
            <Text className="text-gray-500 dark:text-gray-400">{bill.bill_date}</Text>
            <View className="flex-row items-center ml-2 px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700">
              <Icon
                name={bill.purchase_mode === 'online' ? 'globe-outline' : 'storefront-outline'}
                size={11}
                color="#6b7280"
                style={{ marginRight: 3 }}
              />
              <Text className="text-gray-500 dark:text-gray-400 text-xs capitalize">{bill.purchase_mode}</Text>
            </View>
          </View>
          {bill.payment_method && (
            <Text className="text-gray-400 dark:text-gray-500 text-sm capitalize mt-1">
              Paid via {bill.payment_method}
            </Text>
          )}
        </View>

        {/* Photo */}
        <BillPhotoField
          imageUrl={bill.image_url}
          onPressImage={() => setViewerVisible(true)}
          onChange={(imageUrl) => updateBill.mutate({ id, data: { image_url: imageUrl } })}
        />

        {/* Items */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Items</Text>
        {bill.items.map((item) => (
          <View key={item.id} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 flex-row justify-between items-center shadow-sm">
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-medium">{item.item_name}</Text>
              {item.brand_name && (
                <Text className="text-gray-400 dark:text-gray-500 text-xs">{item.brand_name}</Text>
              )}
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
          className="bg-primary-600 rounded-lg py-3 mt-6"
          onPress={() => router.push(`/shopping/edit-bill?id=${id}` as any)}
        >
          <Text className="text-white text-center font-semibold">Edit Bill</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 mt-3"
          onPress={handleDelete}
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete Bill</Text>
        </TouchableOpacity>
      </View>

      {bill.image_url && (
        <Modal visible={viewerVisible} transparent animationType="fade" onRequestClose={() => setViewerVisible(false)}>
          <TouchableOpacity
            className="flex-1 bg-black/90 items-center justify-center"
            activeOpacity={1}
            onPress={() => setViewerVisible(false)}
          >
            <Image source={{ uri: bill.image_url }} className="w-full h-2/3" resizeMode="contain" />
          </TouchableOpacity>
        </Modal>
      )}
    </ScrollView>
  );
}
