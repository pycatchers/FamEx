import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useShops, useCreateShop, useDeleteShop } from '@/hooks/queries/use-shopping';

export default function ShopsScreen() {
  const { data: shops, isLoading } = useShops();
  const createShop = useCreateShop();
  const deleteShop = useDeleteShop();
  const [showAdd, setShowAdd] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopCategory, setNewShopCategory] = useState('');

  const handleAddShop = async () => {
    if (!newShopName.trim()) return;
    await createShop.mutateAsync({
      name: newShopName.trim(),
      category: newShopCategory.trim() || null,
    });
    setNewShopName('');
    setNewShopCategory('');
    setShowAdd(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete Shop', `Delete "${name}" and all its bills?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteShop.mutate(id) },
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
      {showAdd && (
        <View className="bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700">
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Shop name"
            placeholderTextColor="#9ca3af"
            value={newShopName}
            onChangeText={setNewShopName}
            autoFocus
          />
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Category (e.g., Grocery, Medical)"
            placeholderTextColor="#9ca3af"
            value={newShopCategory}
            onChangeText={setNewShopCategory}
          />
          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 bg-primary-600 rounded-lg py-3" onPress={handleAddShop}>
              <Text className="text-white text-center font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3" onPress={() => setShowAdd(false)}>
              <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!shops?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="storefront-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No shops yet</Text>
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm">
              <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 justify-center items-center mr-3">
                <Icon name="storefront-outline" size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold">{item.name}</Text>
                {item.category && (
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.category}</Text>
                )}
              </View>
              {item.is_favorite && <Icon name="star" size={18} color="#d97706" />}
              <TouchableOpacity className="ml-3 p-1" onPress={() => handleDelete(item.id, item.name)}>
                <Icon name="trash-outline" size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => setShowAdd(true)}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
