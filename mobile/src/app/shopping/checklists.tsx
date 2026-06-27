import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useChecklists, useCreateChecklist, useDeleteChecklist } from '@/hooks/queries/use-shopping';
import { ShoppingChecklist } from '@/types/shopping';

export default function ChecklistsScreen() {
  const router = useRouter();
  const { data: checklists, isLoading, refetch } = useChecklists();
  const createChecklist = useCreateChecklist();
  const deleteChecklist = useDeleteChecklist();

  const [refreshing, setRefreshing] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createChecklist.mutateAsync({ title: newTitle.trim(), items: [] });
      setNewTitle('');
      setShowCreate(false);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleDelete = (list: ShoppingChecklist) => {
    Alert.alert(
      'Delete List',
      `Delete "${list.title}" and all its items?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteChecklist.mutate(list.id) },
      ],
    );
  };

  const pendingCount = (list: ShoppingChecklist) => list.items.filter(i => !i.is_checked).length;
  const totalCount = (list: ShoppingChecklist) => list.items.length;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="flex-row items-center px-4 pt-4 pb-3">
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <Icon name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1">Shopping Lists</Text>
      </View>

      <FlatList
        data={checklists}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const pending = pendingCount(item);
          const total = totalCount(item);
          return (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
              onPress={() => router.push({ pathname: '/shopping/checklist-detail', params: { checklistId: item.id, title: item.title } } as any)}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1 mr-3">
                  <Text className="text-base font-semibold text-gray-900 dark:text-white">{item.title}</Text>
                  <Text className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {total === 0 ? 'Empty' : `${pending} of ${total} remaining`}
                  </Text>
                </View>
                <View className="flex-row items-center gap-3">
                  {total > 0 && (
                    <View className={`w-7 h-7 rounded-full items-center justify-center ${pending === 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-primary-100 dark:bg-primary-900/30'}`}>
                      <Text className={`text-xs font-bold ${pending === 0 ? 'text-green-700 dark:text-green-400' : 'text-primary-700 dark:text-primary-400'}`}>
                        {pending === 0 ? '✓' : pending}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Icon name="trash-outline" size={18} color="#ef4444" />
                  </TouchableOpacity>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Icon name="list-outline" size={56} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
                No shopping lists yet.{'\n'}Create one to get started.
              </Text>
            </View>
          ) : null
        }
      />

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowCreate(true)}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>

      {/* Create modal */}
      <Modal visible={showCreate} transparent animationType="slide" onRequestClose={() => setShowCreate(false)}>
        <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={() => setShowCreate(false)} />
        <View className="bg-white dark:bg-gray-900 rounded-t-2xl px-6 pt-4 pb-10">
          <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-4">New Shopping List</Text>
          <TextInput
            className="border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 mb-4"
            placeholder="List name (e.g. Weekly groceries)"
            placeholderTextColor="#9ca3af"
            value={newTitle}
            onChangeText={setNewTitle}
            autoFocus
            onSubmitEditing={handleCreate}
          />
          <TouchableOpacity
            className="bg-primary-600 rounded-xl py-4 items-center"
            onPress={handleCreate}
            disabled={createChecklist.isPending}
          >
            <Text className="text-white font-semibold text-base">
              {createChecklist.isPending ? 'Creating…' : 'Create List'}
            </Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
