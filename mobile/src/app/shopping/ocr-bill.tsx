import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import { apiClient } from '@/lib/api';
import { useCreateBill } from '@/hooks/queries/use-shopping';

interface OCRItem {
  item_name: string;
  quantity: number | null;
  unit: string | null;
  mrp: number | null;
  discount: number | null;
  bought_price: number;
}

interface OCRResult {
  shop_name: string | null;
  bill_date: string | null;
  items: OCRItem[];
  total_amount: number | null;
  raw_text: string | null;
}

export default function OCRBillScreen() {
  const router = useRouter();
  const createBill = useCreateBill();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<OCRResult | null>(null);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant camera/gallery access.');
      return;
    }

    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImageUri(pickerResult.assets[0].uri);
      setResult(null);
    }
  };

  const processImage = async () => {
    if (!imageUri) return;
    setIsProcessing(true);

    try {
      // In production, upload to Supabase Storage first and get a public URL
      // For now, send the local URI (backend needs accessible URL)
      const ocrResult = await apiClient<OCRResult>('/api/v1/ai/ocr/bill', {
        method: 'POST',
        body: { image_url: imageUri, language: 'en' },
      });
      setResult(ocrResult);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveBill = async () => {
    if (!result || !result.items.length) {
      Alert.alert('Error', 'No items to save');
      return;
    }

    try {
      await createBill.mutateAsync({
        bill_date: result.bill_date || new Date().toISOString().split('T')[0],
        total_amount: result.total_amount || result.items.reduce((s, i) => s + i.bought_price, 0),
        entry_method: 'ocr',
        image_url: imageUri,
        items: result.items.map(i => ({
          item_name: i.item_name,
          quantity: i.quantity,
          unit: i.unit,
          mrp: i.mrp,
          discount: i.discount,
          bought_price: i.bought_price,
        })),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Scan Bill</Text>

        {/* Image Capture */}
        {!imageUri ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center shadow-sm mb-4">
            <Icon name="camera-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 dark:text-gray-400 mt-4 mb-6">Take a photo or pick from gallery</Text>
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="bg-primary-600 rounded-lg px-6 py-3 flex-row items-center"
                onPress={() => pickImage(true)}
              >
                <Icon name="camera" size={20} color="white" />
                <Text className="text-white font-semibold ml-2">Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 dark:bg-gray-700 rounded-lg px-6 py-3 flex-row items-center"
                onPress={() => pickImage(false)}
              >
                <Icon name="images" size={20} color="#6b7280" />
                <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2">Gallery</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="mb-4">
            <Image source={{ uri: imageUri }} className="w-full h-48 rounded-xl" resizeMode="cover" />
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                className="flex-1 bg-primary-600 rounded-lg py-3"
                onPress={processImage}
                disabled={isProcessing}
              >
                <Text className="text-white text-center font-semibold">
                  {isProcessing ? 'Processing...' : 'Extract Data'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-3"
                onPress={() => { setImageUri(null); setResult(null); }}
              >
                <Icon name="refresh" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {isProcessing && (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 dark:text-gray-400 mt-3">Analyzing bill with AI...</Text>
          </View>
        )}

        {/* Results */}
        {result && result.items.length > 0 && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            {result.shop_name && (
              <Text className="text-gray-500 dark:text-gray-400 text-sm mb-1">Shop: {result.shop_name}</Text>
            )}
            {result.bill_date && (
              <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">Date: {result.bill_date}</Text>
            )}

            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Extracted Items ({result.items.length})
            </Text>
            {result.items.map((item, i) => (
              <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white">{item.item_name}</Text>
                  {item.quantity && (
                    <Text className="text-gray-400 text-xs">{item.quantity} {item.unit || ''}</Text>
                  )}
                </View>
                <Text className="text-gray-900 dark:text-white font-bold">
                  ₹{item.bought_price}
                </Text>
              </View>
            ))}

            <View className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600">
              <Text className="text-right text-xl font-bold text-primary-600">
                Total: ₹{result.total_amount || result.items.reduce((s, i) => s + i.bought_price, 0)}
              </Text>
            </View>

            <TouchableOpacity
              className="bg-primary-600 rounded-lg py-4 mt-4"
              onPress={saveBill}
              disabled={createBill.isPending}
            >
              <Text className="text-white text-center font-semibold text-lg">
                {createBill.isPending ? 'Saving...' : 'Save Bill'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {result && !result.items.length && result.raw_text && (
          <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4">
            <Text className="text-red-600 dark:text-red-400">{result.raw_text}</Text>
          </View>
        )}

        <TouchableOpacity className="py-4 mt-2" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
