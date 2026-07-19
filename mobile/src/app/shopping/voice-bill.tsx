import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import {
  useAudioRecorder,
  useAudioRecorderState,
  useAudioPlayer,
  useAudioPlayerStatus,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { apiClient, apiUploadFile } from '@/lib/api';
import { useCreateBill, useShops, useCreateShop, useDraft, useDeleteDraft } from '@/hooks/queries/use-shopping';
import { useDraftAutosave } from '@/hooks/use-draft-autosave';
import { PURCHASE_MODES } from '@/types/shopping';
import DatePickerField from '@/components/date-picker-field';
import ItemNameInput from '@/components/item-name-input';

interface VoiceItem {
  item_name: string;
  quantity: number | null;
  unit: string | null;
  bought_price: number | null;
}

interface EditableItem {
  item_name: string;
  brand_name: string;
  quantity: string;
  unit: string;
  bought_price: string;
}

const today = () => new Date().toISOString().split('T')[0];

const toEditable = (items: VoiceItem[]): EditableItem[] =>
  items.map(i => ({
    item_name: i.item_name ?? '',
    brand_name: '',
    quantity: i.quantity != null ? String(i.quantity) : '',
    unit: i.unit ?? '',
    bought_price: i.bought_price != null ? String(i.bought_price) : '',
  }));

export default function VoiceBillScreen() {
  const router = useRouter();
  const { draftId: draftIdParam } = useLocalSearchParams<{ draftId?: string }>();
  const createBill = useCreateBill();
  const createShop = useCreateShop();
  const deleteDraft = useDeleteDraft();
  const { data: shops } = useShops();
  const { data: existingDraft, isError: draftLoadFailed } = useDraft(draftIdParam ?? null);

  const [step, setStep] = useState<'input' | 'preview'>(draftIdParam ? 'preview' : 'input');
  const [spokenText, setSpokenText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [draftId, setDraftId] = useState<string | null>(draftIdParam ?? null);
  const [initialized, setInitialized] = useState(!draftIdParam);

  // Preview / save fields
  const [newShopName, setNewShopName] = useState('');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [billDate, setBillDate] = useState(today());
  const [purchaseMode, setPurchaseMode] = useState<string>('offline');

  // Rehydrate from an existing draft (resumed via ?draftId=) straight into the preview step.
  useEffect(() => {
    if (existingDraft && !initialized) {
      const d = existingDraft.draft_data as any;
      if (Array.isArray(d.items) && d.items.length) setItems(d.items);
      if (d.newShopName != null) setNewShopName(d.newShopName);
      if (d.selectedShopId !== undefined) setSelectedShopId(d.selectedShopId);
      if (d.billDate) setBillDate(d.billDate);
      if (d.purchaseMode) setPurchaseMode(d.purchaseMode);
      setInitialized(true);
    }
  }, [existingDraft, initialized]);

  // If the draft failed to load (e.g. already deleted), fall back to a fresh entry
  // instead of leaving the user stuck on a permanent loading spinner.
  useEffect(() => {
    if (draftLoadFailed && !initialized) {
      setInitialized(true);
      setStep('input');
    }
  }, [draftLoadFailed, initialized]);

  const isMeaningful = step === 'preview' && items.some((i) => i.item_name.trim() !== '');
  useDraftAutosave(
    'voice',
    { newShopName, selectedShopId, billDate, purchaseMode, items },
    isMeaningful && initialized,
    draftId,
    setDraftId,
  );

  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [recordingPhase, setRecordingPhase] = useState<'idle' | 'recording' | 'paused' | 'stopped'>('idle');

  const player = useAudioPlayer(recordingPhase === 'stopped' ? recorder.uri : null);
  const playerStatus = useAudioPlayerStatus(player);

  useEffect(() => {
    (async () => {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
    })();
  }, []);

  const startRecording = async () => {
    const { granted } = await requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission Required', 'Microphone access is needed to record your shopping list.');
      return;
    }
    await recorder.prepareToRecordAsync();
    recorder.record();
    setRecordingPhase('recording');
  };

  const pauseRecording = () => {
    recorder.pause();
    setRecordingPhase('paused');
  };

  const resumeRecording = () => {
    recorder.record();
    setRecordingPhase('recording');
  };

  const stopRecording = async () => {
    await recorder.stop();
    setRecordingPhase('stopped');
  };

  const discardRecording = () => {
    player.pause();
    setRecordingPhase('idle');
  };

  const formatSeconds = (s: number) => {
    const total = Math.max(0, Math.round(s));
    const m = Math.floor(total / 60);
    const sec = total % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const goToPreview = (voiceItems: VoiceItem[]) => {
    setItems(toEditable(voiceItems));
    setBillDate(today());
    setStep('preview');
  };

  const extractFromRecording = async () => {
    const uri = recorder.uri;
    if (!uri) {
      Alert.alert('Error', 'No recording found, please try again.');
      return;
    }

    setIsProcessing(true);
    try {
      const result = await apiUploadFile<{ items: VoiceItem[]; raw_text: string | null }>(
        '/api/v1/ai/voice/audio',
        { uri, name: `voice_${Date.now()}.m4a`, type: 'audio/m4a' },
        { language: 'en' },
      );
      if (result.items.length) {
        setRecordingPhase('idle');
        goToPreview(result.items);
      } else {
        Alert.alert('Error', result.raw_text || 'Could not parse items from the recording');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process recording');
    } finally {
      setIsProcessing(false);
    }
  };

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
        goToPreview(result.items);
      } else {
        Alert.alert('Error', 'Could not parse items from text');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process');
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Preview / edit helpers ───────────────────────────────────────────────
  const updateItem = (index: number, field: keyof EditableItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addItem = () => {
    setItems([...items, { item_name: '', brand_name: '', quantity: '', unit: '', bought_price: '' }]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = items.reduce((sum, item) => sum + (parseFloat(item.bought_price) || 0), 0);

  const saveBill = async () => {
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
      await createBill.mutateAsync({
        shop_id: shopId,
        bill_date: billDate,
        total_amount: totalAmount,
        purchase_mode: purchaseMode,
        entry_method: 'voice',
        items: validItems.map(i => ({
          item_name: i.item_name.trim(),
          brand_name: i.brand_name.trim() || null,
          quantity: i.quantity ? parseFloat(i.quantity) || null : null,
          unit: i.unit.trim() || null,
          bought_price: parseFloat(i.bought_price) || 0,
        })),
      });
      if (draftId) deleteDraft.mutate(draftId);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save bill');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Render: preview / edit step ──────────────────────────────────────────
  if (step === 'preview' && !initialized) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
        <Text className="text-gray-600 dark:text-gray-400 mt-4 text-base">Loading draft…</Text>
      </View>
    );
  }

  if (step === 'preview') {
    return (
      <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900" keyboardShouldPersistTaps="handled">
        <View className="p-4">
          <View className="flex-row items-center mb-4">
            <TouchableOpacity onPress={() => setStep('input')} className="mr-3">
              <Icon name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1">Review & Edit</Text>
          </View>

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
                <ItemNameInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mr-2"
                  value={item.item_name}
                  onChangeText={(v) => updateItem(index, 'item_name', v)}
                />
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Icon name="close-circle" size={22} color="#ef4444" />
                </TouchableOpacity>
              </View>
              <TextInput
                className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mb-2"
                placeholder="Brand (optional)"
                placeholderTextColor="#9ca3af"
                value={item.brand_name}
                onChangeText={(v) => updateItem(index, 'brand_name', v)}
              />
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
            onPress={saveBill}
            disabled={isSaving}
          >
            <Text className="text-white text-center font-semibold text-lg">
              {isSaving ? 'Saving...' : 'Save Bill'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="py-3" onPress={() => router.back()}>
            <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // ── Render: input step (record / type) ───────────────────────────────────
  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Voice Entry</Text>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4 items-center">
          {recordingPhase === 'idle' && (
            <>
              <TouchableOpacity
                className="w-16 h-16 rounded-full items-center justify-center bg-primary-600"
                onPress={startRecording}
                disabled={isProcessing}
              >
                <Icon name="mic" size={28} color="white" />
              </TouchableOpacity>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Tap to record your shopping list
              </Text>
            </>
          )}

          {(recordingPhase === 'recording' || recordingPhase === 'paused') && (
            <>
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                {formatSeconds(recorderState.durationMillis / 1000)}
                {recordingPhase === 'paused' ? ' · Paused' : ' · Recording…'}
              </Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  className="w-14 h-14 rounded-full items-center justify-center bg-gray-500"
                  onPress={recordingPhase === 'paused' ? resumeRecording : pauseRecording}
                >
                  <Icon name={recordingPhase === 'paused' ? 'play' : 'pause'} size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-16 h-16 rounded-full items-center justify-center bg-red-600"
                  onPress={stopRecording}
                >
                  <Icon name="stop" size={28} color="white" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {recordingPhase === 'stopped' && (
            <>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-3">Preview your recording</Text>
              <View className="flex-row items-center gap-4 mb-4">
                <TouchableOpacity
                  className="w-14 h-14 rounded-full items-center justify-center bg-gray-600"
                  onPress={() => (playerStatus.playing ? player.pause() : player.play())}
                  disabled={isProcessing}
                >
                  <Icon name={playerStatus.playing ? 'pause' : 'play'} size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">
                  {formatSeconds(playerStatus.currentTime)} / {formatSeconds(playerStatus.duration)}
                </Text>
              </View>
              <View className="flex-row gap-3 w-full">
                <TouchableOpacity
                  className="flex-1 rounded-lg py-3 bg-gray-100 dark:bg-gray-700"
                  onPress={discardRecording}
                  disabled={isProcessing}
                >
                  <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">Re-record</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-lg py-3 bg-primary-600"
                  onPress={extractFromRecording}
                  disabled={isProcessing}
                >
                  <Text className="text-white text-center font-semibold">
                    {isProcessing ? 'Processing...' : 'Extract Items'}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-4">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Or type / paste your shopping list:
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

        <TouchableOpacity className="py-4 mt-2" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
