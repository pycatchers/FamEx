import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import DatePickerField from '@/components/date-picker-field';
import { useCreatePrescription, useHospitals, useDoctors, useCreateHospital, useCreateDoctor } from '@/hooks/queries/use-medical';
import { useFamilyMembers } from '@/hooks/queries/use-family';
import { apiUploadFile } from '@/lib/api';
import { compressImage } from '@/lib/image-upload';
import { MedicineCreate } from '@/types/medical';

interface OCRPrescriptionResult {
  doctor_name: string | null;
  hospital_name: string | null;
  visit_date: string | null;
  diagnosis: string | null;
  medicines: { name: string; dosage?: string; frequency?: string; duration?: string; timing?: string }[];
  follow_up_date: string | null;
  raw_text: string | null;
}

export default function AddVisitScreen() {
  const router = useRouter();
  const { family_member_id: paramFamilyMemberId } = useLocalSearchParams<{ family_member_id?: string }>();
  const createPrescription = useCreatePrescription();
  const { data: hospitals } = useHospitals();
  const { data: familyMembers } = useFamilyMembers();
  const createHospital = useCreateHospital();
  const createDoctor = useCreateDoctor();

  // Form state
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedFamilyMemberId, setSelectedFamilyMemberId] = useState<string | null>(paramFamilyMemberId ?? null);
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isProcessingOCR, setIsProcessingOCR] = useState(false);
  const [medicines, setMedicines] = useState<MedicineCreate[]>([
    { name: '', dosage: '', morning: false, afternoon: false, night: false },
  ]);

  // Inline add forms
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospitalName, setNewHospitalName] = useState('');
  const [showAddDoctor, setShowAddDoctor] = useState(false);
  const [newDoctorName, setNewDoctorName] = useState('');
  const [newDoctorSpec, setNewDoctorSpec] = useState('');

  // Get doctors filtered by selected hospital
  const { data: doctors } = useDoctors(selectedHospitalId || undefined);

  const pickImage = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please grant camera/gallery access.');
      return;
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const extractPrescriptionData = async () => {
    if (!imageUri) return;
    setIsProcessingOCR(true);

    try {
      const compressedUri = await compressImage(imageUri);
      const ocrResult = await apiUploadFile<OCRPrescriptionResult>(
        '/api/v1/ai/ocr/prescription',
        { uri: compressedUri, name: `prescription_${Date.now()}.jpg`, type: 'image/jpeg' },
        { language: 'en' },
      );

      if (ocrResult.diagnosis) setDiagnosis(ocrResult.diagnosis);
      if (ocrResult.follow_up_date) setFollowUpDate(ocrResult.follow_up_date);
      if (ocrResult.medicines && ocrResult.medicines.length > 0) {
        setMedicines(
          ocrResult.medicines.map(m => ({
            name: m.name || '',
            dosage: m.dosage || '',
            duration_days: m.duration ? parseInt(m.duration) || null : null,
            timing: m.timing?.includes('before') ? 'before_food' : m.timing?.includes('after') ? 'after_food' : m.timing?.includes('with') ? 'with_food' : null,
            morning: false,
            afternoon: false,
            night: false,
          })),
        );
      }
      Alert.alert('Success', 'Prescription data extracted. Please review and edit as needed.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to extract prescription data');
    } finally {
      setIsProcessingOCR(false);
    }
  };

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

  const handleAddHospital = async () => {
    if (!newHospitalName.trim()) return;
    try {
      const hospital = await createHospital.mutateAsync({ name: newHospitalName.trim() });
      setSelectedHospitalId(hospital.id);
      setNewHospitalName('');
      setShowAddHospital(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleAddDoctor = async () => {
    if (!newDoctorName.trim()) return;
    try {
      const doctor = await createDoctor.mutateAsync({
        name: newDoctorName.trim(),
        specialization: newDoctorSpec.trim() || null,
        hospital_id: selectedHospitalId,
      });
      setSelectedDoctorId(doctor.id);
      setNewDoctorName('');
      setNewDoctorSpec('');
      setShowAddDoctor(false);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleSubmit = async () => {
    const validMeds = medicines.filter(m => m.name.trim());

    try {
      await createPrescription.mutateAsync({
        prescription_date: visitDate,
        family_member_id: selectedFamilyMemberId,
        hospital_id: selectedHospitalId,
        doctor_id: selectedDoctorId,
        reason_for_visit: reasonForVisit.trim() || null,
        diagnosis: diagnosis.trim() || null,
        image_url: imageUri,
        follow_up_date: followUpDate || null,
        notes: notes.trim() || null,
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
        {/* Visit Date */}
        <DatePickerField
          label="Visit Date"
          value={visitDate}
          onChange={setVisitDate}
          required
          maximumDate={new Date()}
        />

        {/* Family Member */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Family Member</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          <TouchableOpacity
            className={`mr-2 px-3 py-2 rounded-full ${!selectedFamilyMemberId ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            onPress={() => setSelectedFamilyMemberId(null)}
          >
            <Text className={`text-sm ${!selectedFamilyMemberId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Self</Text>
          </TouchableOpacity>
          {familyMembers?.map(member => (
            <TouchableOpacity
              key={member.id}
              className={`mr-2 px-3 py-2 rounded-full ${selectedFamilyMemberId === member.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={() => setSelectedFamilyMemberId(member.id)}
            >
              <Text className={`text-sm ${selectedFamilyMemberId === member.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                {member.full_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Hospital */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Hospital</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <TouchableOpacity
            className={`mr-2 px-3 py-2 rounded-full ${!selectedHospitalId ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            onPress={() => { setSelectedHospitalId(null); setSelectedDoctorId(null); }}
          >
            <Text className={`text-sm ${!selectedHospitalId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>None</Text>
          </TouchableOpacity>
          {hospitals?.map(h => (
            <TouchableOpacity
              key={h.id}
              className={`mr-2 px-3 py-2 rounded-full ${selectedHospitalId === h.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={() => { setSelectedHospitalId(h.id); setSelectedDoctorId(null); }}
            >
              <Text className={`text-sm ${selectedHospitalId === h.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{h.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            className="mr-2 px-3 py-2 rounded-full border border-dashed border-gray-400"
            onPress={() => setShowAddHospital(true)}
          >
            <Text className="text-sm text-gray-500">+ Add New</Text>
          </TouchableOpacity>
        </ScrollView>

        {showAddHospital && (
          <View className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-700">
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
              placeholder="Hospital name"
              placeholderTextColor="#9ca3af"
              value={newHospitalName}
              onChangeText={setNewHospitalName}
              autoFocus
            />
            <View className="flex-row gap-2">
              <TouchableOpacity className="flex-1 bg-primary-600 rounded py-2" onPress={handleAddHospital}>
                <Text className="text-white text-center text-sm font-semibold">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-700 rounded py-2" onPress={() => setShowAddHospital(false)}>
                <Text className="text-gray-700 dark:text-gray-300 text-center text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Doctor */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Doctor</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
          <TouchableOpacity
            className={`mr-2 px-3 py-2 rounded-full ${!selectedDoctorId ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
            onPress={() => setSelectedDoctorId(null)}
          >
            <Text className={`text-sm ${!selectedDoctorId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>None</Text>
          </TouchableOpacity>
          {doctors?.map(d => (
            <TouchableOpacity
              key={d.id}
              className={`mr-2 px-3 py-2 rounded-full ${selectedDoctorId === d.id ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}
              onPress={() => setSelectedDoctorId(d.id)}
            >
              <Text className={`text-sm ${selectedDoctorId === d.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>{d.name}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            className="mr-2 px-3 py-2 rounded-full border border-dashed border-gray-400"
            onPress={() => setShowAddDoctor(true)}
          >
            <Text className="text-sm text-gray-500">+ Add New</Text>
          </TouchableOpacity>
        </ScrollView>

        {showAddDoctor && (
          <View className="bg-white dark:bg-gray-800 rounded-lg p-3 mb-3 border border-gray-200 dark:border-gray-700">
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
              placeholder="Doctor name"
              placeholderTextColor="#9ca3af"
              value={newDoctorName}
              onChangeText={setNewDoctorName}
              autoFocus
            />
            <TextInput
              className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 mb-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
              placeholder="Specialization"
              placeholderTextColor="#9ca3af"
              value={newDoctorSpec}
              onChangeText={setNewDoctorSpec}
            />
            <View className="flex-row gap-2">
              <TouchableOpacity className="flex-1 bg-primary-600 rounded py-2" onPress={handleAddDoctor}>
                <Text className="text-white text-center text-sm font-semibold">Save</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-gray-200 dark:bg-gray-700 rounded py-2" onPress={() => setShowAddDoctor(false)}>
                <Text className="text-gray-700 dark:text-gray-300 text-center text-sm">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Reason for Visit */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Visit</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={reasonForVisit}
          onChangeText={setReasonForVisit}
          placeholder="e.g., Fever, Regular checkup"
          placeholderTextColor="#9ca3af"
        />

        {/* Prescription Image */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prescription Image</Text>
        {!imageUri ? (
          <View className="flex-row gap-3 mb-4">
            <TouchableOpacity
              className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-4 items-center"
              onPress={() => pickImage(true)}
            >
              <Icon name="camera-outline" size={24} color="#6b7280" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-4 items-center"
              onPress={() => pickImage(false)}
            >
              <Icon name="images-outline" size={24} color="#6b7280" />
              <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="mb-4">
            <Image source={{ uri: imageUri }} className="w-full h-40 rounded-xl" resizeMode="cover" />
            <View className="flex-row gap-2 mt-2">
              <TouchableOpacity
                className="flex-1 bg-green-600 rounded-lg py-2.5 flex-row justify-center items-center"
                onPress={extractPrescriptionData}
                disabled={isProcessingOCR}
              >
                {isProcessingOCR ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <Icon name="scan-outline" size={18} color="white" />
                    <Text className="text-white font-semibold ml-2">Extract Data</Text>
                  </>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2.5"
                onPress={() => setImageUri(null)}
              >
                <Icon name="close" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Diagnosis */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Diagnosis</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={diagnosis}
          onChangeText={setDiagnosis}
          placeholder="e.g., Viral fever, Cold"
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
            <View className="flex-row gap-2 mb-2">
              <View className="flex-1">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="Dosage (e.g., 500mg)"
                  placeholderTextColor="#9ca3af"
                  value={med.dosage || ''}
                  onChangeText={(v) => updateMedicine(index, 'dosage', v)}
                />
              </View>
              <View className="w-24">
                <TextInput
                  className="border border-gray-200 dark:border-gray-600 rounded px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700"
                  placeholder="Days"
                  placeholderTextColor="#9ca3af"
                  value={med.duration_days ? String(med.duration_days) : ''}
                  onChangeText={(v) => updateMedicine(index, 'duration_days', parseInt(v) || null)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <View className="flex-row gap-1 mb-2">
              {[
                { value: 'before_food', label: 'Before Food' },
                { value: 'after_food', label: 'After Food' },
                { value: 'with_food', label: 'With Food' },
              ].map(t => (
                <TouchableOpacity
                  key={t.value}
                  className={`flex-1 py-1.5 rounded ${med.timing === t.value ? 'bg-green-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  onPress={() => updateMedicine(index, 'timing', med.timing === t.value ? null : t.value)}
                >
                  <Text className={`text-center text-xs ${med.timing === t.value ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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

        {/* Follow-up Date */}
        <View className="mt-2">
          <DatePickerField
            label="Follow-up Date (optional)"
            value={followUpDate}
            onChange={setFollowUpDate}
            minimumDate={new Date()}
          />
        </View>

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          value={notes}
          onChangeText={setNotes}
          placeholder="Any additional notes..."
          placeholderTextColor="#9ca3af"
          multiline
          numberOfLines={3}
        />

        {/* Submit */}
        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-4 mb-4"
          onPress={handleSubmit}
          disabled={createPrescription.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createPrescription.isPending ? 'Saving...' : 'Save Visit'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3 mb-4" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
