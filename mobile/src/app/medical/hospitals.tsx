import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useHospitals, useCreateHospital, useDeleteHospital } from '@/hooks/queries/use-medical';

export default function HospitalsScreen() {
  const { data: hospitals, isLoading } = useHospitals();
  const createHospital = useCreateHospital();
  const deleteHospital = useDeleteHospital();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createHospital.mutateAsync({
      name: name.trim(),
      address: address.trim() || null,
      phone: phone.trim() || null,
    });
    setName('');
    setAddress('');
    setPhone('');
    setShowAdd(false);
  };

  const handleDelete = (id: string, hospitalName: string) => {
    Alert.alert('Delete Hospital', `Delete "${hospitalName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteHospital.mutate(id) },
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
            placeholder="Hospital name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Address"
            placeholderTextColor="#9ca3af"
            value={address}
            onChangeText={setAddress}
          />
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-3 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Phone"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <View className="flex-row gap-2">
            <TouchableOpacity className="flex-1 bg-primary-600 rounded-lg py-3" onPress={handleAdd}>
              <Text className="text-white text-center font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3" onPress={() => setShowAdd(false)}>
              <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!hospitals?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="business-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No hospitals yet</Text>
        </View>
      ) : (
        <FlatList
          data={hospitals}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm">
              <View className="w-10 h-10 rounded-full bg-red-50 dark:bg-red-900/20 justify-center items-center mr-3">
                <Icon name="business-outline" size={20} color="#dc2626" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold">{item.name}</Text>
                {item.address && (
                  <Text className="text-gray-500 dark:text-gray-400 text-sm" numberOfLines={1}>{item.address}</Text>
                )}
              </View>
              <TouchableOpacity className="p-1" onPress={() => handleDelete(item.id, item.name)}>
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
