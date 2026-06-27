import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import { apiClient, apiUploadFile } from '@/lib/api';
import { compressImage } from '@/lib/image-upload';
import { useQueryClient } from '@tanstack/react-query';
import { OCRBillResult, OCRBillItem, ShoppingBill } from '@/types/shopping';

type Step = 'capture' | 'loading' | 'preview';

const today = () => new Date().toISOString().split('T')[0];

export default function OCRBillScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<Step>('capture');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable extracted data
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopPhone, setShopPhone] = useState('');
  const [shopGstin, setShopGstin] = useState('');
  const [billDate, setBillDate] = useState(today());
  const [items, setItems] = useState<OCRBillItem[]>([]);

  const totalAmount = items.reduce((s, i) => s + (Number(i.bought_price) || 0), 0);

  // ── Image selection ──────────────────────────────────────────────────────
  const pickImage = async (useCamera: boolean) => {
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Please grant access.'); return; }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled || !result.assets[0]) return;
    setImageUri(result.assets[0].uri);
    setError(null);
    await extract(result.assets[0].uri);
  };

  // ── OCR extraction ───────────────────────────────────────────────────────
  const extract = async (uri: string) => {
    setStep('loading');
    setError(null);
    try {
      const compressedUri = await compressImage(uri);
      const result = await apiUploadFile<OCRBillResult>(
        '/api/v1/ai/ocr/bill',
        { uri: compressedUri, name: `bill_${Date.now()}.jpg`, type: 'image/jpeg' },
        { language: 'en' },
      );

      if (result.raw_text && !result.items.length) {
        setError(result.raw_text);
        setStep('capture');
        return;
      }

      setShopName(result.shop_name ?? '');
      setShopAddress(result.shop_address ?? '');
      setShopPhone(result.shop_phone ?? '');
      setShopGstin(result.shop_gstin ?? '');
      setBillDate(result.bill_date ?? today());
      setItems(result.items.length ? result.items : [{ item_name: '', quantity: null, unit: null, mrp: null, discount: null, bought_price: 0 }]);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Could not extract data from this image.');
      setStep('capture');
    }
  };

  // ── Item helpers ─────────────────────────────────────────────────────────
  const updateItem = (idx: number, field: keyof OCRBillItem, value: string) => {
    const next = [...items];
    if (field === 'bought_price' || field === 'quantity' || field === 'mrp' || field === 'discount') {
      (next[idx] as any)[field] = value === '' ? null : parseFloat(value);
    } else {
      (next[idx] as any)[field] = value;
    }
    setItems(next);
  };

  const addItem = () =>
    setItems([...items, { item_name: '', quantity: null, unit: null, mrp: null, discount: null, bought_price: 0 }]);

  const removeItem = (idx: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const save = async () => {
    const validItems = items.filter(i => i.item_name.trim());
    if (!validItems.length) { Alert.alert('Error', 'Add at least one item.'); return; }

    setIsSaving(true);
    try {
      await apiClient<ShoppingBill>('/api/v1/shopping/save-ocr-bill', {
        method: 'POST',
        body: {
          shop_name: shopName.trim() || null,
          shop_address: shopAddress.trim() || null,
          shop_phone: shopPhone.trim() || null,
          shop_gstin: shopGstin.trim() || null,
          bill_date: billDate,
          total_amount: totalAmount,
          items: validItems.map(i => ({
            item_name: i.item_name,
            quantity: i.quantity,
            unit: i.unit || null,
            mrp: i.mrp,
            discount: i.discount,
            bought_price: Number(i.bought_price) || 0,
          })),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['shops', 'recent'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save bill.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render: capture step ──────────────────────────────────────────────────
  if (step === 'capture') {
    return (
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900" keyboardShouldPersistTaps="handled">
        <View className="p-4">
          <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Scan Bill</Text>
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-5">
            AI will extract the shop and item details.
          </Text>

          <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center shadow-sm mb-4">
            {imageUri ? (
              <Image source={{ uri: imageUri }} className="w-full h-40 rounded-xl mb-4" resizeMode="cover" />
            ) : (
              <Icon name="scan-outline" size={64} color="#9ca3af" />
            )}
            <Text className="text-gray-500 dark:text-gray-400 mt-4 mb-6 text-center">
              Take a clear photo — make sure the text is readable.
            </Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="bg-primary-600 rounded-xl px-6 py-3 flex-row items-center"
                onPress={() => pickImage(true)}
              >
                <Icon name="camera" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 dark:bg-gray-700 rounded-xl px-6 py-3 flex-row items-center"
                onPress={() => pickImage(false)}
              >
                <Icon name="images" size={20} color="#6b7280" />
                <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2">Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>

          {error && (
            <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
              <View className="flex-row items-start gap-2 mb-3">
                <Icon name="warning-outline" size={18} color="#dc2626" />
                <View className="flex-1">
                  <Text className="text-red-700 dark:text-red-400 font-semibold text-sm">Extraction failed</Text>
                  <Text className="text-red-600 dark:text-red-400 text-sm mt-0.5">{error}</Text>
                </View>
              </View>
              <Text className="text-gray-500 dark:text-gray-400 text-xs mb-3">
                Try a clearer photo, or enter the details manually.
              </Text>
              <TouchableOpacity
                className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl py-3 flex-row items-center justify-center gap-2"
                onPress={() => router.replace('/shopping/add-bill' as any)}
              >
                <Icon name="create-outline" size={18} color="#374151" />
                <Text className="text-gray-800 dark:text-white font-semibold">Enter Manually</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity className="py-4" onPress={() => router.back()}>
            <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Render: loading step ──────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 dark:text-gray-400 mt-4 text-base">Analysing bill with AI…</Text>
        <Text className="text-gray-400 dark:text-gray-500 mt-1 text-sm">Extracting shop and items</Text>
      </View>
    );
  }

  // ── Render: preview/edit step ─────────────────────────────────────────────
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900" keyboardShouldPersistTaps="handled">
      <View className="p-4">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => setStep('capture')} className="mr-3">
            <Icon name="arrow-back" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1">Review & Edit</Text>
        </View>

        {/* Shop details */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">Shop Details</Text>
          <Field label="Shop Name" value={shopName} onChange={setShopName} placeholder="e.g. Big Bazaar" />
          <Field label="Address" value={shopAddress} onChange={setShopAddress} placeholder="Address (optional)" />
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Phone" value={shopPhone} onChange={setShopPhone} placeholder="Phone" keyboardType="phone-pad" />
            </View>
            <View className="flex-1">
              <Field label="GSTIN" value={shopGstin} onChange={setShopGstin} placeholder="GSTIN" autoCapitalize="characters" />
            </View>
          </View>
          <Field label="Bill Date" value={billDate} onChange={setBillDate} placeholder="YYYY-MM-DD" />
        </View>

        {/* Items */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
              Items ({items.length})
            </Text>
            <TouchableOpacity onPress={addItem} className="flex-row items-center gap-1">
              <Icon name="add-circle-outline" size={20} color="#2563eb" />
              <Text className="text-primary-600 text-sm font-medium">Add</Text>
            </TouchableOpacity>
          </View>

          {items.map((item, idx) => (
            <View key={idx} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 mb-2">
              <View className="flex-row items-center mb-2">
                <TextInput
                  className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mr-2 text-sm"
                  value={item.item_name}
                  onChangeText={v => updateItem(idx, 'item_name', v)}
                  placeholder="Item name"
                  placeholderTextColor="#9ca3af"
                />
                <TouchableOpacity onPress={() => removeItem(idx)}>
                  <Icon name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2">
                <TextInput
                  className="w-16 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-sm text-center"
                  value={item.quantity != null ? String(item.quantity) : ''}
                  onChangeText={v => updateItem(idx, 'quantity', v)}
                  placeholder="Qty"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
                <TextInput
                  className="w-16 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-sm text-center"
                  value={item.unit ?? ''}
                  onChangeText={v => updateItem(idx, 'unit', v)}
                  placeholder="Unit"
                  placeholderTextColor="#9ca3af"
                />
                <TextInput
                  className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-sm"
                  value={item.bought_price != null ? String(item.bought_price) : ''}
                  onChangeText={v => updateItem(idx, 'bought_price', v)}
                  placeholder="₹ Price"
                  placeholderTextColor="#9ca3af"
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        {/* Total */}
        <View className="bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4 mb-5 flex-row justify-between items-center">
          <Text className="text-gray-700 dark:text-gray-300 font-medium">Total</Text>
          <Text className="text-primary-700 dark:text-primary-300 text-xl font-bold">
            ₹{totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Text>
        </View>

        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 mb-3 flex-row items-center justify-center gap-2"
          onPress={save}
          disabled={isSaving}
        >
          {isSaving ? <ActivityIndicator color="white" size="small" /> : <Icon name="checkmark-circle" size={20} color="white" />}
          <Text className="text-white font-semibold text-lg">{isSaving ? 'Saving…' : 'Save Bill'}</Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ── Small reusable field ──────────────────────────────────────────────────────
function Field({
  label, value, onChange, placeholder, keyboardType, autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</Text>
      <TextInput
        className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-sm"
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}
