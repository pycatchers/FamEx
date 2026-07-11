import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useBill, useUpdateBill, useShops, useCreateShop } from '@/hooks/queries/use-shopping';
import DatePickerField from '@/components/date-picker-field';

interface EditableItem {
  item_name: string;
  quantity: string;
  unit: string;
  bought_price: string;
}

export default function EditBillScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: bill, isLoading } = useBill(id);
  const updateBill = useUpdateBill();
  const createShop = useCreateShop();
  const { data: shops } = useShops();

  const [isSaving, setIsSaving] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [billDate, setBillDate] = useState('');
  const [items, setItems] = useState<EditableItem[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (bill && !initialized) {
      setSelectedShopId(bill.shop_id ?? null);
      setBillDate(bill.bill_date);
      setItems(
        bill.items.map(i => ({
          item_name: i.item_name,
          quantity: i.quantity != null ? String(i.quantity) : '',
          unit: i.unit ?? '',
          bought_price: String(i.bought_price),
        })),
      );
      setInitialized(true);
    }
  }, [bill, initialized]);

  const updateItem = (index: number, field: keyof EditableItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { item_name: '', quantity: '', unit: '', bought_price: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.bought_price) || 0), 0);

  const save = async () => {
    const validItems = items.filter(i => i.item_name.trim() && (parseFloat(i.bought_price) || 0) > 0);
    if (!validItems.length) {
      Alert.alert('Error', 'Add at least one item with a name and price');
      return;
    }

    setIsSaving(true);
    try {
      let shopId = selectedShopId;
      if (newShopName.trim()) {
        const shop = await createShop.mutateAsync({ name: newShopName.trim() });
        shopId = shop.id;
      }
      await updateBill.mutateAsync({
        id,
        data: {
          shop_id: shopId,
          bill_date: billDate,
          total_amount: totalAmount,
          items: validItems.map(i => ({
            item_name: i.item_name.trim(),
            quantity: i.quantity ? parseFloat(i.quantity) || null : null,
            unit: i.unit.trim() || null,
            bought_price: parseFloat(i.bought_price) || 0,
          })),
        },
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !bill || !initialized) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Edit Bill</Text>

        {/* Shop */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Shop</Text>
        <TextInput
          className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-gray-800 mb-2"
          placeholder="Type new shop name…"
          placeholderTextColor="#9ca3af"
          value={newShopName}
          onChangeText={(v) => {
            setNewShopName(v);
            if (v) setSelectedShopId(null);
          }}
        />
        {(shops?.length ?? 0) > 0 && (
          <>
            <Text className="text-xs text-gray-400 dark:text-gray-500 mb-1.5">or select existing</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <TouchableOpacity
                className={`mr-2 px-3 py-2 rounded-full ${!selectedShopId && !newShopName ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                onPress={() => { setSelectedShopId(null); setNewShopName(''); }}
              >
                <Text className={`text-sm ${!selectedShopId && !newShopName ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>None</Text>
              </TouchableOpacity>
              {shops?.map((shop) => (
                <TouchableOpacity
                  key={shop.id}
                  className={`mr-2 px-3 py-2 rounded-full ${selectedShopId === shop.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  onPress={() => { setSelectedShopId(shop.id); setNewShopName(''); }}
                >
                  <Text className={`text-sm ${selectedShopId === shop.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {shop.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Date */}
        <DatePickerField
          label="Date"
          value={billDate}
          onChange={setBillDate}
          maximumDate={new Date()}
        />

        {/* Items */}
        <View className="flex-row justify-between items-center mb-2 mt-2">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Items ({items.length})</Text>
          <TouchableOpacity onPress={addItem}>
            <Icon name="add-circle-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mr-2"
                placeholder="Item name"
                placeholderTextColor="#9ca3af"
                value={item.item_name}
                onChangeText={(v) => updateItem(index, 'item_name', v)}
              />
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Icon name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2">
              <View className="w-16">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="Qty"
                  placeholderTextColor="#9ca3af"
                  value={item.quantity}
                  onChangeText={(v) => updateItem(index, 'quantity', v)}
                  keyboardType="decimal-pad"
                />
              </View>
              <View className="w-20">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="Unit"
                  placeholderTextColor="#9ca3af"
                  value={item.unit}
                  onChangeText={(v) => updateItem(index, 'unit', v)}
                />
              </View>
              <View className="flex-1">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="₹ Price"
                  placeholderTextColor="#9ca3af"
                  value={item.bought_price}
                  onChangeText={(v) => updateItem(index, 'bought_price', v)}
                  keyboardType="numeric"
                />
              </View>
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
          onPress={save}
          disabled={isSaving}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
