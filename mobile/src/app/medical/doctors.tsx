import { useState } from 'react';
import { View, Text, FlatList, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDoctors, useCreateDoctor, useDeleteDoctor, useHospitals } from '@/hooks/queries/use-medical';
import { Hospital } from '@/types/medical';

function HospitalSelector({ hospitals, selectedId, onSelect }: { hospitals: Hospital[]; selectedId: string | null; onSelect: (id: string | null) => void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <TouchableOpacity
        className={`mr-2 px-3 py-2 rounded-full ${!selectedId ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
        onPress={() => onSelect(null)}
      >
        <Text className={`text-sm ${!selectedId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>None</Text>
      </TouchableOpacity>
      {hospitals.map(h => (
        <TouchableOpacity
          key={h.id}
          className={`mr-2 px-3 py-2 rounded-full ${selectedId === h.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
          onPress={() => onSelect(h.id)}
        >
          <Text className={`text-sm ${selectedId === h.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{h.name}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

export default function DoctorsScreen() {
  const { data: doctors, isLoading } = useDoctors();
  const { data: hospitals } = useHospitals();
  const createDoctor = useCreateDoctor();
  const deleteDoctor = useDeleteDoctor();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!name.trim()) return;
    await createDoctor.mutateAsync({
      name: name.trim(),
      specialization: specialization.trim() || null,
      phone: phone.trim() || null,
      hospital_id: selectedHospitalId,
    });
    setName('');
    setSpecialization('');
    setPhone('');
    setSelectedHospitalId(null);
    setShowAdd(false);
  };

  const handleDelete = (id: string, doctorName: string) => {
    Alert.alert('Delete Doctor', `Delete "${doctorName}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteDoctor.mutate(id) },
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
            placeholder="Doctor name"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Specialization"
            placeholderTextColor="#9ca3af"
            value={specialization}
            onChangeText={setSpecialization}
          />
          <TextInput
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-2 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
            placeholder="Phone"
            placeholderTextColor="#9ca3af"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          {hospitals && hospitals.length > 0 && (
            <>
              <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">Hospital</Text>
              <HospitalSelector hospitals={hospitals} selectedId={selectedHospitalId} onSelect={setSelectedHospitalId} />
            </>
          )}
          <View className="flex-row gap-2 mt-3">
            <TouchableOpacity className="flex-1 bg-primary-600 rounded-lg py-3" onPress={handleAdd}>
              <Text className="text-white text-center font-semibold">Save</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg py-3" onPress={() => setShowAdd(false)}>
              <Text className="text-gray-700 dark:text-gray-300 text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!doctors?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="person-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">No doctors yet</Text>
        </View>
      ) : (
        <FlatList
          data={doctors}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm">
              <View className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 justify-center items-center mr-3">
                <Icon name="person-outline" size={20} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold">{item.name}</Text>
                {item.specialization && (
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.specialization}</Text>
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
