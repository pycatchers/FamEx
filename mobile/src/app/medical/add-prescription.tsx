import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useCreatePrescription, useDoctors, useHospitals } from '@/hooks/queries/use-medical';
import { MedicineCreate } from '@/types/medical';

export default function AddPrescriptionScreen() {
  const router = useRouter();
  const createPrescription = useCreatePrescription();
  const { data: doctors } = useDoctors();
  const { data: hospitals } = useHospitals();

  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [medicines, setMedicines] = useState<MedicineCreate[]>([
    { name: '', dosage: '', morning: false, afternoon: false, night: false },
  ]);

  const addMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', morning: false, afternoon: false, night: false }]);
  };

  const updateMedicine = (index: number, field: string, value: any) => {
    const updated = [...medicines];
    (updated[index] as any)[field] = value;
    setMedicines(updated);
  };

  const removeMedicine = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    const validMeds = medicines.filter(m => m.name.trim());
    if (!validMeds.length) {
      Alert.alert('Error', 'Add at least one medicine');
      return;
    }

    try {
      await createPrescription.mutateAsync({
        prescription_date: prescriptionDate,
        diagnosis: diagnosis.trim() || null,
        doctor_id: selectedDoctorId,
        hospital_id: selectedHospitalId,
        follow_up_date: followUpDate.trim() || null,
        medicines: validMeds,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add Prescription</Text>

        {/* Date */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={prescriptionDate}
          onChangeText={setPrescriptionDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />

        {/* Diagnosis */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={diagnosis}
          onChangeText={setDiagnosis}
          placeholder="e.g., Viral fever, Cold"
          placeholderTextColor="#9ca3af"
        />

        {/* Doctor Selector */}
        {doctors && doctors.length > 0 && (
          <>
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
              <TouchableOpacity
                className={`mr-2 px-3 py-2 rounded-full ${!selectedDoctorId ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                onPress={() => setSelectedDoctorId(null)}
              >
                <Text className={`text-sm ${!selectedDoctorId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>None</Text>
              </TouchableOpacity>
              {doctors.map(d => (
                <TouchableOpacity
                  key={d.id}
                  className={`mr-2 px-3 py-2 rounded-full ${selectedDoctorId === d.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  onPress={() => setSelectedDoctorId(d.id)}
                >
                  <Text className={`text-sm ${selectedDoctorId === d.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{d.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        )}

        {/* Follow-up Date */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Follow-up Date (optional)</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={followUpDate}
          onChangeText={setFollowUpDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
        />

        {/* Medicines */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-300">Medicines</Text>
          <TouchableOpacity onPress={addMedicine}>
            <Icon name="add-circle-outline" size={24} color="#2563eb" />
          </TouchableOpacity>
        </View>

        {medicines.map((med, index) => (
          <View key={index} className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-2 border border-gray-200 dark:border-gray-700">
            <View className="flex-row items-center mb-2">
              <TextInput
                className="flex-1 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mr-2"
                placeholder="Medicine name"
                placeholderTextColor="#9ca3af"
                value={med.name}
                onChangeText={(v) => updateMedicine(index, 'name', v)}
              />
              <TouchableOpacity onPress={() => removeMedicine(index)}>
                <Icon name="close-circle" size={22} color="#ef4444" />
              </TouchableOpacity>
            </View>
            <TextInput
              className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mb-2"
              placeholder="Dosage (e.g., 500mg)"
              placeholderTextColor="#9ca3af"
              value={med.dosage || ''}
              onChangeText={(v) => updateMedicine(index, 'dosage', v)}
            />
            <View className="flex-row gap-2">
              {(['morning', 'afternoon', 'night'] as const).map(slot => (
                <TouchableOpacity
                  key={slot}
                  className={`flex-1 py-2 rounded ${med[slot] ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  onPress={() => updateMedicine(index, slot, !med[slot])}
                >
                  <Text className={`text-center text-xs ${med[slot] ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {slot === 'morning' ? 'Morn' : slot === 'afternoon' ? 'Aft' : 'Night'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-4 mt-4 mb-4"
          onPress={handleSubmit}
          disabled={createPrescription.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createPrescription.isPending ? 'Saving...' : 'Save Prescription'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
