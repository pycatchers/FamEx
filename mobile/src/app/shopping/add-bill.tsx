import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useCreateBill, useShops, useItemPriceComparison, useCreateShop, useDraft, useDeleteDraft } from '@/hooks/queries/use-shopping';
import { useDraftAutosave } from '@/hooks/use-draft-autosave';
import { PurchaseItemCreate, SHOPPING_UNITS, PURCHASE_MODES } from '@/types/shopping';
import DatePickerField from '@/components/date-picker-field';
import BillPhotoField from '@/components/bill-photo-field';
import ItemNameInput from '@/components/item-name-input';

export default function AddBillScreen() {
  const router = useRouter();
  const { draftId: draftIdParam } = useLocalSearchParams<{ draftId?: string }>();
  const createBill = useCreateBill();
  const createShop = useCreateShop();
  const deleteDraft = useDeleteDraft();
  const { data: shops } = useShops();
  const { data: existingDraft } = useDraft(draftIdParam ?? null);

  const [newShopName, setNewShopName] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [billDate, setBillDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [purchaseMode, setPurchaseMode] = useState<string>('offline');
  const [items, setItems] = useState<PurchaseItemCreate[]>([{ item_name: '', bought_price: 0 }]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [compareItemName, setCompareItemName] = useState('');
  const [draftId, setDraftId] = useState<string | null>(draftIdParam ?? null);
  const [initialized, setInitialized] = useState(!draftIdParam);
  const { data: priceComparison, isLoading: pricesLoading } = useItemPriceComparison(compareItemName);

  // Rehydrate from an existing draft, if one was passed in via ?draftId=.
  useEffect(() => {
    if (existingDraft && !initialized) {
      const d = existingDraft.draft_data as any;
      if (d.newShopName != null) setNewShopName(d.newShopName);
      if (d.selectedShopId !== undefined) setSelectedShopId(d.selectedShopId);
      if (d.billDate) setBillDate(d.billDate);
      if (d.paymentMethod) setPaymentMethod(d.paymentMethod);
      if (d.purchaseMode) setPurchaseMode(d.purchaseMode);
      if (Array.isArray(d.items) && d.items.length) setItems(d.items);
      if (d.imageUrl !== undefined) setImageUrl(d.imageUrl);
      setInitialized(true);
    }
  }, [existingDraft, initialized]);

  const isMeaningful = newShopName.trim() !== '' || items.some((i) => i.item_name.trim() !== '');
  useDraftAutosave(
    'manual',
    { newShopName, selectedShopId, billDate, paymentMethod, purchaseMode, items, imageUrl },
    isMeaningful && initialized,
    draftId,
    setDraftId,
  );

  const addItem = () => {
    setItems([...items, { item_name: '', bought_price: 0 }]);
  };

  const updateItem = (index: number, field: keyof PurchaseItemCreate, value: string) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.bought_price as any) || 0), 0);

  const filteredShops = newShopName.trim()
    ? shops?.filter((s) => s.name.toLowerCase().includes(newShopName.trim().toLowerCase()))
    : shops;

  const handleSubmit = async () => {
    const validItems = items.filter(i => i.item_name.trim() && parseFloat(i.bought_price as any) > 0);
    if (!validItems.length) {
      Alert.alert('Error', 'Add at least one item with name and price');
      return;
    }

    try {
      let shopId = selectedShopId;
      // If user typed a new shop name, create (or find) it first
      if (newShopName.trim()) {
        const shop = await createShop.mutateAsync({ name: newShopName.trim() });
        shopId = shop.id;
      }
      await createBill.mutateAsync({
        shop_id: shopId,
        bill_date: billDate,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        purchase_mode: purchaseMode,
        image_url: imageUrl,
        entry_method: 'manual',
        items: validItems,
      });
      if (draftId) deleteDraft.mutate(draftId);
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
        {/* New shop text input */}
        <TextInput
          className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white bg-white dark:bg-gray-800 mb-2"
          placeholder="Type new shop name…"
          placeholderTextColor="#9ca3af"
          value={newShopName}
          onChangeText={(v) => {
            setNewShopName(v);
            if (v) setSelectedShopId(null); // clear chip selection
          }}
        />
        {/* Or pick existing */}
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
              {filteredShops?.map((shop) => (
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

        {/* Purchase Mode */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Purchase Type</Text>
        <View className="flex-row mb-4">
          {PURCHASE_MODES.map((m) => (
            <TouchableOpacity
              key={m}
              className={`mr-2 px-4 py-2 rounded-full flex-row items-center ${purchaseMode === m ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={() => setPurchaseMode(m)}
            >
              <Icon
                name={m === 'online' ? 'globe-outline' : 'storefront-outline'}
                size={14}
                color={purchaseMode === m ? 'white' : '#6b7280'}
                style={{ marginRight: 4 }}
              />
              <Text className={`text-sm capitalize ${purchaseMode === m ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Photo */}
        <BillPhotoField imageUrl={imageUrl} onChange={setImageUrl} />

        {/* Items */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Items</Text>
          <TouchableOpacity onPress={addItem}>
            <Icon name="add-circle-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <View className="flex-1 mr-2">
                <ItemNameInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  value={item.item_name}
                  onChangeText={(v) => updateItem(index, 'item_name', v)}
                  onBlur={() => {
                    if (item.item_name.trim().length >= 2) {
                      setCompareItemName(item.item_name.trim());
                    }
                  }}
                />
              </View>
              <TouchableOpacity onPress={() => removeItem(index)}>
                <Icon name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <TextInput
              className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mb-2"
              placeholder="Brand (optional)"
              placeholderTextColor="#9ca3af"
              value={item.brand_name ?? ''}
              onChangeText={(v) => updateItem(index, 'brand_name', v)}
            />
            <View className="flex-row items-center gap-2">
              <View className="w-16">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="Qty"
                  placeholderTextColor="#9ca3af"
                  value={String(item.quantity ?? '')}
                  onChangeText={(v) => updateItem(index, 'quantity', v)}
                  onBlur={() => {
                    const updated = [...items];
                    (updated[index] as any).quantity = parseFloat(String(item.quantity)) || 0;
                    setItems(updated);
                  }}
                  keyboardType="decimal-pad"
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
                {SHOPPING_UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    className={`px-2 py-1.5 rounded mr-1 ${item.unit === u ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                    onPress={() => updateItem(index, 'unit', u)}
                  >
                    <Text className={`text-xs ${item.unit === u ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View className="w-24">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="₹ Price"
                  placeholderTextColor="#9ca3af"
                  value={String(item.bought_price ?? '')}
                  onChangeText={(v) => updateItem(index, 'bought_price', v)}
                  onBlur={() => {
                    const updated = [...items];
                    (updated[index] as any).bought_price = parseFloat(String(item.bought_price)) || 0;
                    setItems(updated);
                  }}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        ))}

        {/* Price Comparison */}
        {compareItemName.length >= 2 && (
          <View className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Price History: "{compareItemName}"
              </Text>
              <TouchableOpacity onPress={() => setCompareItemName('')}>
                <Icon name="close" size={18} color="#9ca3af" />
              </TouchableOpacity>
            </View>
            {pricesLoading ? (
              <ActivityIndicator size="small" color="#2563eb" />
            ) : priceComparison && priceComparison.length > 0 ? (
              priceComparison.map((pc) => (
                <View key={pc.shop_id} className="flex-row items-center py-1.5 border-t border-gray-100 dark:border-gray-700">
                  <View className="flex-1">
                    <Text className="text-gray-900 dark:text-white text-sm">{pc.shop_name}</Text>
                    <Text className="text-gray-400 text-xs">
                      Last: {pc.last_bought_date || 'N/A'}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-900 dark:text-white text-sm font-medium">₹{pc.last_price}</Text>
                    <Text className="text-gray-400 text-xs">
                      Avg: ₹{pc.avg_price} · Min: ₹{pc.min_price}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 text-sm text-center py-2">No price history found</Text>
            )}
          </View>
        )}

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
