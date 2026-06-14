import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useChecklists, useCreateChecklist, useToggleChecklistItem, useDeleteChecklist } from '@/hooks/queries/use-shopping';

export default function ChecklistScreen() {
  const { data: checklists, isLoading } = useChecklists();
  const createChecklist = useCreateChecklist();
  const toggleItem = useToggleChecklistItem();
  const deleteChecklist = useDeleteChecklist();
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [newItems, setNewItems] = useState('');

  const handleCreate = async () => {
    if (!title.trim()) return;
    const itemList = newItems
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(item_name => ({ item_name }));
    await createChecklist.mutateAsync({ title: title.trim(), items: itemList });
    setTitle('');
    setNewItems('');
    setShowCreate(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Checklist', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChecklist.mutate(id) },
    ]);
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {showCreate && (
        <View className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="List title (e.g., Weekly Groceries)"
            placeholderTextColor="#9ca3af"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Items (comma separated): rice, milk, sugar"
            placeholderTextColor="#9ca3af"
            value={newItems}
            onChangeText={setNewItems}
          />
          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 bg-primary-600 rounded-lg py-3" onPress={handleCreate}>
              <Text className="text-white text-center font-semibold">Create</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3" onPress={() => setShowCreate(false)}>
              <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!checklists?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="checkbox-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No checklists yet</Text>
        </View>
      ) : (
        <FlatList
          data={checklists}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item: checklist }) => (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-gray-900 dark:text-white font-semibold text-lg">{checklist.title}</Text>
                <TouchableOpacity onPress={() => handleDelete(checklist.id)}>
                  <Icon name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
              {checklist.items.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center py-2"
                  onPress={() => toggleItem.mutate({ checklistId: checklist.id, itemId: item.id })}
                >
                  <Icon
                    name={item.is_checked ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={item.is_checked ? '#16a34a' : '#9ca3af'}
                  />
                  <Text className={`ml-3 ${item.is_checked ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                    {item.item_name}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text className="text-gray-400 dark:text-gray-500 text-xs mt-2">
                {checklist.items.filter(i => i.is_checked).length}/{checklist.items.length} done
              </Text>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => setShowCreate(true)}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
