import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCreateBill, useShops } from '@/hooks/queries/use-shopping';
import { PurchaseItemCreate } from '@/types/shopping';

export default function AddBillScreen() {
  const router = useRouter();
  const createBill = useCreateBill();
  const { data: shops } = useShops();

  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [items, setItems] = useState<PurchaseItemCreate[]>([{ item_name: '', bought_price: 0 }]);

  const addItem = () => {
    setItems([...items, { item_name: '', bought_price: 0 }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItemCreate, value: string) => {
    const updated = [...items];
    if (field === 'bought_price' || field === 'quantity' || field === 'mrp' || field === 'discount') {
      (updated[index] as any)[field] = parseFloat(value) || 0;
    } else {
      (updated[index] as any)[field] = value;
    }
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.bought_price || 0), 0);

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.item_name.trim() && i.bought_price > 0);
    if (!validItems.length) {
      Alert.alert('Error', 'Add at least one item with name and price');
      return;
    }

    try {
      await createBill.mutateAsync({
        shop_id: selectedShopId,
        bill_date: billDate,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        entry_method: 'manual',
        items: validItems,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Bill</Text>

        {/* Shop Selection */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <TouchableOpacity
            className={`mr-2 px-3 py-2 rounded-full ${!selectedShopId ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            onPress={() => setSelectedShopId(null)}
          >
            <Text className={`text-sm ${!selectedShopId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>None</Text>
          </TouchableOpacity>
          {shops?.map((shop) => (
            <TouchableOpacity
              key={shop.id}
              className={`mr-2 px-3 py-2 rounded-full ${selectedShopId === shop.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={() => setSelectedShopId(shop.id)}
            >
              <Text className={`text-sm ${selectedShopId === shop.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {shop.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Date */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={billDate}
          onChangeText={setBillDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />

        {/* Payment Method */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment</Text>
        <View className="flex-row mb-4">
          {['cash', 'upi', 'card'].map((m) => (
            <TouchableOpacity
              key={m}
              className={`mr-2 px-4 py-2 rounded-full ${paymentMethod === m ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={() => setPaymentMethod(m)}
            >
              <Text className={`text-sm capitalize ${paymentMethod === m ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Items */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</Text>
          <TouchableOpacity onPress={addItem}>
            <Icon name="add-circle-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center">
              <View className="flex-1 mr-2">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="Item name"
                  placeholderTextColor="#9ca3af"
                  value={item.item_name}
                  onChangeText={(v) => updateItem(index, 'item_name', v)}
                />
              </View>
              <View className="w-24 mr-2">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="₹ Price"
                  placeholderTextColor="#9ca3af"
                  value={item.bought_price ? String(item.bought_price) : ''}
                  onChangeText={(v) => updateItem(index, 'bought_price', v)}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Icon name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* Total */}
        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 my-4">
          <Text className="text-primary-600 dark:text-primary-300 text-center text-sm">Total</Text>
          <Text className="text-primary-700 dark:text-primary-200 text-center text-2xl font-bold">
            ₹{totalAmount.toLocaleString('en-IN')}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-4 mb-4"
          onPress={handleSubmit}
          disabled={createBill.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createBill.isPending ? 'Saving...' : 'Save Bill'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
