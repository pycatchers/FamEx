import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { apiClient } from '@/lib/api';
import { useCreateBill } from '@/hooks/queries/use-shopping';

interface VoiceItem {
  item_name: string;
  quantity: number | null;
  unit: string | null;
  bought_price: number | null;
}

export default function VoiceBillScreen() {
  const router = useRouter();
  const createBill = useCreateBill();
  const [spokenText, setSpokenText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [items, setItems] = useState<VoiceItem[]>([]);

  const processVoiceText = async () => {
    if (!spokenText.trim()) {
      Alert.alert('Error', 'Enter or speak your shopping items');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await apiClient<{ items: VoiceItem[]; raw_text: string | null }>('/api/v1/ai/voice/items', {
        method: 'POST',
        body: { text: spokenText.trim(), language: 'en' },
      });
      if (result.items.length) {
        setItems(result.items);
      } else {
        Alert.alert('Error', 'Could not parse items from text');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process');
    } finally {
      setIsProcessing(false);
    }
  };

  const saveBill = async () => {
    const validItems = items.filter(i => i.item_name && (i.bought_price || 0) > 0);
    if (!validItems.length) {
      Alert.alert('Error', 'No valid items with prices to save');
      return;
    }

    try {
      const total = validItems.reduce((s, i) => s + (i.bought_price || 0), 0);
      await createBill.mutateAsync({
        bill_date: new Date().toISOString().split('T')[0],
        total_amount: total,
        entry_method: 'voice',
        items: validItems.map(i => ({
          item_name: i.item_name,
          quantity: i.quantity,
          unit: i.unit,
          bought_price: i.bought_price || 0,
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
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Voice Entry</Text>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Type or paste your spoken shopping list:
          </Text>
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 min-h-[120px]"
            placeholder="e.g., rice 5kg 250 rupees, milk 2 packets 60 rupees, sugar 1kg 45 rupees"
            placeholderTextColor="#9ca3af"
            value={spokenText}
            onChangeText={setSpokenText}
            multiline
            textAlignVertical="top"
          />
          <TouchableOpacity
            className="bg-primary-600 rounded-lg py-3 mt-3"
            onPress={processVoiceText}
            disabled={isProcessing}
          >
            <Text className="text-white text-center font-semibold">
              {isProcessing ? 'Processing...' : 'Extract Items'}
            </Text>
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View className="items-center py-6">
            <ActivityIndicator size="large" color="#2563eb" />
            <Text className="text-gray-500 dark:text-gray-400 mt-2">Parsing items with AI...</Text>
          </View>
        )}

        {items.length > 0 && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Parsed Items ({items.length})
            </Text>
            {items.map((item, i) => (
              <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white">{item.item_name}</Text>
                  {item.quantity && (
                    <Text className="text-gray-400 text-xs">{item.quantity} {item.unit || ''}</Text>
                  )}
                </View>
                <Text className="text-gray-900 dark:text-white font-bold">
                  {item.bought_price ? `₹${item.bought_price}` : '-'}
                </Text>
              </View>
            ))}

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

        <TouchableOpacity className="py-4 mt-2" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
