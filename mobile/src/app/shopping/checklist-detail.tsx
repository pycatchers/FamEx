import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import {
  useChecklists,
  useToggleChecklistItem,
  useAddChecklistItem,
  useDeleteChecklistItem,
} from '@/hooks/queries/use-shopping';
import { ChecklistItem } from '@/types/shopping';

export default function ChecklistDetailScreen() {
  const { checklistId, title } = useLocalSearchParams<{ checklistId: string; title: string }>();
  const router = useRouter();

  const { data: allLists, refetch } = useChecklists();
  const checklist = allLists?.find(c => c.id === checklistId);
  const items = checklist?.items ?? [];

  const toggleItem = useToggleChecklistItem();
  const addItem = useAddChecklistItem();
  const deleteItem = useDeleteChecklistItem();

  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleAdd = async () => {
    if (!newItemName.trim()) return;
    try {
      await addItem.mutateAsync({
        checklistId,
        item_name: newItemName.trim(),
        quantity: newItemQty.trim() || undefined,
      });
      setNewItemName('');
      setNewItemQty('');
      setShowAdd(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (item: ChecklistItem) => {
    Alert.alert(
      'Remove Item',
      `Remove "${item.item_name}" from this list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: () => deleteItem.mutate({ checklistId, itemId: item.id }),
        },
      ],
    );
  };

  const pending = items.filter(i => !i.is_checked).length;
  const done = items.filter(i => i.is_checked).length;

  // Sort: unchecked first, then checked
  const sorted = [...items].sort((a, b) => Number(a.is_checked) - Number(b.is_checked));

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center mb-1">
          <TouchableOpacity onPress={() => router.back()} className="mr-3">
            <Icon name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
            {title}
          </Text>
        </View>
        {items.length > 0 && (
          <Text className="text-sm text-gray-500 dark:text-gray-400 ml-9">
            {pending} remaining · {done} done
          </Text>
        )}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View className={`flex-row items-center bg-white dark:bg-gray-800 rounded-xl px-4 py-3.5 mb-2 shadow-sm ${item.is_checked ? 'opacity-60' : ''}`}>
            <TouchableOpacity
              className={`w-6 h-6 rounded-full border-2 mr-3 items-center justify-center ${item.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-300 dark:border-gray-600'}`}
              onPress={() => toggleItem.mutate({ checklistId, itemId: item.id })}
            >
              {item.is_checked && <Icon name="checkmark" size={14} color="white" />}
            </TouchableOpacity>
            <View className="flex-1">
              <Text className={`text-sm font-medium ${item.is_checked ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                {item.item_name}
              </Text>
              {item.quantity ? (
                <Text className="text-xs text-gray-400 dark:text-gray-500">{item.quantity}</Text>
              ) : null}
            </View>
            <TouchableOpacity
              onPress={() => handleDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Icon name="close" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Icon name="cart-outline" size={56} color="#9ca3af" />
            <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
              No items yet.{'\n'}Tap + to add items to buy.
            </Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowAdd(true)}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Add item modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={() => setShowAdd(false)} />
        <View className="bg-white dark:bg-gray-900 rounded-t-2xl px-6 pt-4 pb-10">
          <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">Add Item</Text>

          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Item name</Text>
          <TextInput
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 mb-3"
            placeholder="e.g. Onions"
            placeholderTextColor="#9ca3af"
            value={newItemName}
            onChangeText={setNewItemName}
            autoFocus
          />

          <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">Quantity (optional)</Text>
          <TextInput
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 mb-4"
            placeholder="e.g. 2 kg, 1 pack"
            placeholderTextColor="#9ca3af"
            value={newItemQty}
            onChangeText={setNewItemQty}
            onSubmitEditing={handleAdd}
          />

          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleAdd}
            disabled={addItem.isPending}
          >
            <Text className="text-white font-semibold text-base">
              {addItem.isPending ? 'Adding…' : 'Add Item'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
