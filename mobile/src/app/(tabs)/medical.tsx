import { View, Text, FlatList, TouchableOpacity, RefreshControl, Modal, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import { useVisits, useDeleteVisit } from '@/hooks/queries/use-medical';
import { useFamilyMembers } from '@/hooks/queries/use-family';
import { VisitSummary, Medicine, OCRPrescriptionResult, OCRMedicine } from '@/types/medical';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { apiUploadFile, apiClient } from '@/lib/api';
import { compressImage } from '@/lib/image-upload';
import { useQueryClient } from '@tanstack/react-query';

// ─── Medicine pill ───────────────────────────────────────────────────────────
function MedicinePill({ med }: { med: Medicine }) {
  const slots = [
    med.morning && 'Morning',
    med.afternoon && 'Afternoon',
    med.night && 'Night',
  ].filter(Boolean).join(' · ');

  return (
    <View className="bg-purple-50 dark:bg-purple-900/20 rounded-lg px-3 py-2 mb-2">
      <Text className="text-purple-900 dark:text-purple-200 font-medium text-sm">{med.name}</Text>
      {med.dosage ? <Text className="text-purple-600 dark:text-purple-400 text-xs">{med.dosage}</Text> : null}
      {slots ? <Text className="text-purple-500 dark:text-purple-500 text-xs mt-0.5">{slots}</Text> : null}
      {med.timing ? (
        <Text className="text-purple-400 text-xs">{med.timing.replace(/_/g, ' ')}</Text>
      ) : null}
    </View>
  );
}

// ─── Visit detail modal ───────────────────────────────────────────────────────
function VisitDetailModal({ visit, onClose, onDeleted }: { visit: VisitSummary; onClose: () => void; onDeleted: () => void }) {
  const deleteVisit = useDeleteVisit();
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleDelete = () => {
    Alert.alert(
      'Delete Visit',
      `Delete this visit record from ${formatDate(visit.visit_date)}? This will also remove all associated medicines.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: () => deleteVisit.mutate(visit.prescription_id, { onSuccess: onDeleted }),
        },
      ],
    );
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
        <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <TouchableOpacity onPress={onClose} className="mr-3">
            <Icon name="close" size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1" numberOfLines={1}>
            {visit.hospital_name || 'Visit Details'}
          </Text>
          <TouchableOpacity onPress={handleDelete} className="ml-2">
            <Icon name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 p-4">
          {/* Patient & Date */}
          <View className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-4">
            <View className="flex-row items-center mb-2">
              <Icon name="person-outline" size={16} color="#6b7280" />
              <Text className="text-gray-700 dark:text-gray-300 font-semibold ml-2">
                {visit.patient_name || 'Patient not specified'}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Icon name="calendar-outline" size={16} color="#6b7280" />
              <Text className="text-gray-600 dark:text-gray-400 ml-2">{formatDate(visit.visit_date)}</Text>
            </View>
          </View>

          {/* Reason / Diagnosis */}
          {(visit.reason_for_visit || visit.diagnosis) && (
            <View className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 mb-4">
              {visit.reason_for_visit ? (
                <View className="mb-2">
                  <Text className="text-xs text-blue-500 dark:text-blue-400 uppercase font-semibold mb-1">
                    Reason for Visit
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-200">{visit.reason_for_visit}</Text>
                </View>
              ) : null}
              {visit.diagnosis ? (
                <View>
                  <Text className="text-xs text-blue-500 dark:text-blue-400 uppercase font-semibold mb-1">
                    Diagnosis
                  </Text>
                  <Text className="text-blue-900 dark:text-blue-200">{visit.diagnosis}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Doctor */}
          {visit.doctor_name && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">Doctor</Text>
              <View className="flex-row items-center">
                <Icon name="person-circle-outline" size={20} color="#2563eb" />
                <View className="ml-2 flex-1">
                  <Text className="text-gray-900 dark:text-white font-medium">{visit.doctor_name}</Text>
                  {visit.doctor_qualification ? (
                    <Text className="text-gray-500 dark:text-gray-400 text-xs">{visit.doctor_qualification}</Text>
                  ) : null}
                </View>
              </View>
              {visit.doctor_registration_id ? (
                <Text className="text-gray-400 dark:text-gray-500 text-xs mt-1 ml-7">
                  Reg. {visit.doctor_registration_id}
                </Text>
              ) : null}
            </View>
          )}

          {/* Hospital contact */}
          {(visit.hospital_address || visit.hospital_phone) && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">Hospital</Text>
              {visit.hospital_address ? (
                <View className="flex-row items-start mb-1">
                  <Icon name="location-outline" size={16} color="#6b7280" />
                  <Text className="text-gray-700 dark:text-gray-300 text-sm ml-2 flex-1">{visit.hospital_address}</Text>
                </View>
              ) : null}
              {visit.hospital_phone ? (
                <View className="flex-row items-center">
                  <Icon name="call-outline" size={16} color="#6b7280" />
                  <Text className="text-gray-700 dark:text-gray-300 text-sm ml-2">{visit.hospital_phone}</Text>
                </View>
              ) : null}
            </View>
          )}

          {/* Medicines */}
          {visit.medicines.length > 0 && (
            <View className="mb-4">
              <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-2">
                Prescribed Medicines ({visit.medicines.length})
              </Text>
              {visit.medicines.map((med) => (
                <MedicinePill key={med.id} med={med} />
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Visit list card ──────────────────────────────────────────────────────────
function VisitCard({ visit, onPress }: { visit: VisitSummary; onPress: () => void }) {
  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <TouchableOpacity
      className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-base font-semibold text-gray-900 dark:text-white" numberOfLines={1}>
            {visit.hospital_name || 'Unknown Hospital'}
          </Text>
          <View className="flex-row items-center mt-1 gap-3 flex-wrap">
            <View className="flex-row items-center gap-1">
              <Icon name="person-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-500 dark:text-gray-400">
                {visit.patient_name || 'No patient'}
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Icon name="calendar-outline" size={12} color="#9ca3af" />
              <Text className="text-xs text-gray-400 dark:text-gray-500">{formatDate(visit.visit_date)}</Text>
            </View>
          </View>
          {(visit.reason_for_visit || visit.diagnosis) && (
            <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1" numberOfLines={1}>
              {visit.reason_for_visit || visit.diagnosis}
            </Text>
          )}
        </View>
        <View className="items-end gap-1">
          {visit.medicines.length > 0 && (
            <View className="bg-purple-100 dark:bg-purple-900/30 rounded-full px-2 py-0.5 flex-row items-center gap-1">
              <Icon name="medical-outline" size={11} color="#7c3aed" />
              <Text className="text-xs text-purple-700 dark:text-purple-300">{visit.medicines.length}</Text>
            </View>
          )}
          <Icon name="chevron-forward" size={16} color="#9ca3af" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Upload flow modal ────────────────────────────────────────────────────────
type UploadStep = 'pick-patient' | 'pick-action' | 'loading' | 'preview';

const today = () => new Date().toISOString().split('T')[0];

function UploadModal({
  onClose,
  onSaved,
}: {
  onClose: () => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: familyMembers } = useFamilyMembers();

  const [step, setStep] = useState<UploadStep>('pick-patient');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Editable preview fields
  const [hospitalName, setHospitalName] = useState('');
  const [hospitalAddress, setHospitalAddress] = useState('');
  const [hospitalPhone, setHospitalPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [doctorQualification, setDoctorQualification] = useState('');
  const [doctorRegId, setDoctorRegId] = useState('');
  const [visitDate, setVisitDate] = useState(today());
  const [diagnosis, setDiagnosis] = useState('');
  const [reason, setReason] = useState('');
  const [medicines, setMedicines] = useState<OCRMedicine[]>([]);

  const selectedName = selectedMemberId
    ? familyMembers?.find(m => m.id === selectedMemberId)?.full_name ?? 'Selected'
    : 'Self';

  const pickAndExtract = async (useCamera: boolean) => {
    const permission = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) { Alert.alert('Permission Required', 'Please grant camera/gallery access.'); return; }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });

    if (result.canceled || !result.assets[0]) return;

    setStep('loading');
    setExtractError(null);
    try {
      const compressedUri = await compressImage(result.assets[0].uri);
      const data = await apiUploadFile<OCRPrescriptionResult>(
        '/api/v1/ai/ocr/prescription',
        { uri: compressedUri, name: `rx_${Date.now()}.jpg`, type: 'image/jpeg' },
        { language: 'en' },
      );

      setHospitalName(data.hospital_name ?? '');
      setHospitalAddress(data.hospital_address ?? '');
      setHospitalPhone(data.hospital_phone ?? '');
      setDoctorName(data.doctor_name ?? '');
      setDoctorQualification(data.doctor_qualification ?? '');
      setDoctorRegId(data.doctor_registration_id ?? '');
      setVisitDate(data.visit_date ?? today());
      setDiagnosis(data.diagnosis ?? '');
      setReason(data.reason_for_visit ?? '');
      setMedicines(data.medicines.length ? data.medicines : []);
      setStep('preview');
    } catch (err: any) {
      setExtractError(err.message || 'Could not extract data from this image.');
      setStep('pick-action');
    }
  };

  const updateMed = (idx: number, field: keyof OCRMedicine, value: any) => {
    const next = [...medicines];
    (next[idx] as any)[field] = value;
    setMedicines(next);
  };
  const addMed = () =>
    setMedicines([...medicines, { name: '', dosage: null, frequency: null, duration: null, timing: null, morning: false, afternoon: false, night: false }]);
  const removeMed = (idx: number) => setMedicines(medicines.filter((_, i) => i !== idx));

  const save = async () => {
    setIsSaving(true);
    try {
      await apiClient('/api/v1/medical/save-ocr-prescription', {
        method: 'POST',
        body: {
          hospital_name: hospitalName.trim() || null,
          hospital_address: hospitalAddress.trim() || null,
          hospital_phone: hospitalPhone.trim() || null,
          doctor_name: doctorName.trim() || null,
          doctor_qualification: doctorQualification.trim() || null,
          doctor_registration_id: doctorRegId.trim() || null,
          family_member_id: selectedMemberId || null,
          visit_date: visitDate || today(),
          diagnosis: diagnosis.trim() || null,
          reason_for_visit: reason.trim() || null,
          medicines: medicines.filter(m => m.name.trim()).map(m => ({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            timing: m.timing,
            morning: m.morning,
            afternoon: m.afternoon,
            night: m.night,
          })),
        },
      });
      queryClient.invalidateQueries({ queryKey: ['visits'] });
      queryClient.invalidateQueries({ queryKey: ['active-medicines'] });
      onSaved();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save prescription.');
    } finally {
      setIsSaving(false);
    }
  };

  const goManual = () => {
    onClose();
    const params: Record<string, string> = {};
    if (selectedMemberId) params.family_member_id = selectedMemberId;
    router.push({ pathname: '/medical/add-visit', params } as any);
  };

  // ── Preview is a full-screen modal inside the modal ──────────────────────
  if (step === 'preview') {
    return (
      <Modal visible transparent={false} animationType="slide" onRequestClose={() => setStep('pick-action')}>
        <SafeAreaView className="flex-1 bg-white dark:bg-gray-900">
          <View className="flex-row items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <TouchableOpacity onPress={() => setStep('pick-action')} className="mr-3">
              <Icon name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 dark:text-white flex-1">Review & Edit</Text>
          </View>

          <ScrollView className="flex-1 p-4" keyboardShouldPersistTaps="handled">
            {/* Hospital */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">Hospital</Text>
              <PreviewField label="Name" value={hospitalName} onChange={setHospitalName} placeholder="Hospital name" />
              <PreviewField label="Address" value={hospitalAddress} onChange={setHospitalAddress} placeholder="Address" />
              <PreviewField label="Phone" value={hospitalPhone} onChange={setHospitalPhone} placeholder="Phone" keyboardType="phone-pad" />
            </View>

            {/* Doctor */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">Doctor</Text>
              <PreviewField label="Name" value={doctorName} onChange={setDoctorName} placeholder="Doctor name" />
              <PreviewField label="Qualification" value={doctorQualification} onChange={setDoctorQualification} placeholder="e.g. MBBS, MD" />
              <PreviewField label="Registration ID" value={doctorRegId} onChange={setDoctorRegId} placeholder="Reg. ID" />
            </View>

            {/* Visit */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold mb-3">Visit</Text>
              <PreviewField label="Patient" value={selectedName} onChange={() => {}} editable={false} />
              <PreviewField label="Date" value={visitDate} onChange={setVisitDate} placeholder="YYYY-MM-DD" />
              <PreviewField label="Reason" value={reason} onChange={setReason} placeholder="Reason for visit" />
              <PreviewField label="Diagnosis" value={diagnosis} onChange={setDiagnosis} placeholder="Diagnosis" />
            </View>

            {/* Medicines */}
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">
                  Medicines ({medicines.length})
                </Text>
                <TouchableOpacity onPress={addMed} className="flex-row items-center gap-1">
                  <Icon name="add-circle-outline" size={20} color="#dc2626" />
                  <Text className="text-red-600 text-sm font-medium">Add</Text>
                </TouchableOpacity>
              </View>

              {medicines.map((med, idx) => (
                <View key={idx} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 mb-2">
                  <View className="flex-row items-center mb-2">
                    <TextInput
                      className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 mr-2 text-sm font-medium"
                      value={med.name}
                      onChangeText={v => updateMed(idx, 'name', v)}
                      placeholder="Medicine name"
                      placeholderTextColor="#9ca3af"
                    />
                    <TouchableOpacity onPress={() => removeMed(idx)}>
                      <Icon name="close-circle" size={22} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    className="border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 text-sm mb-2"
                    value={med.dosage ?? ''}
                    onChangeText={v => updateMed(idx, 'dosage', v || null)}
                    placeholder="Dosage (e.g. 500mg)"
                    placeholderTextColor="#9ca3af"
                  />
                  {/* Slots */}
                  <View className="flex-row gap-2">
                    {(['morning', 'afternoon', 'night'] as const).map(slot => (
                      <TouchableOpacity
                        key={slot}
                        className={`flex-1 py-1.5 rounded-lg items-center ${med[slot] ? 'bg-red-600' : 'bg-gray-100 dark:bg-gray-700'}`}
                        onPress={() => updateMed(idx, slot, !med[slot])}
                      >
                        <Text className={`text-xs font-medium capitalize ${med[slot] ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}>
                          {slot === 'morning' ? 'Morn' : slot === 'afternoon' ? 'Aftn' : 'Night'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}

              {medicines.length === 0 && (
                <Text className="text-gray-400 dark:text-gray-500 text-sm text-center py-2">
                  No medicines extracted — tap Add to enter manually.
                </Text>
              )}
            </View>

            <TouchableOpacity
              className="bg-red-600 rounded-xl py-4 mb-3 flex-row items-center justify-center gap-2"
              onPress={save}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator color="white" size="small" /> : <Icon name="checkmark-circle" size={20} color="white" />}
              <Text className="text-white font-semibold text-lg">{isSaving ? 'Saving…' : 'Save Prescription'}</Text>
            </TouchableOpacity>

            <TouchableOpacity className="py-3 mb-6" onPress={goManual}>
              <Text className="text-gray-500 dark:text-gray-400 text-center">Enter Fully Manually</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  }

  // ── Bottom sheet (pick-patient / pick-action / loading) ──────────────────
  return (
    <Modal visible transparent animationType="slide" onRequestClose={step === 'loading' ? undefined : onClose}>
      <TouchableOpacity className="flex-1 bg-black/40" activeOpacity={1} onPress={step === 'loading' ? undefined : onClose} />
      <View className="bg-white dark:bg-gray-900 rounded-t-2xl px-6 pt-4 pb-10">
        <View className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full self-center mb-5" />

        {/* Step: pick patient */}
        {step === 'pick-patient' && (
          <>
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">Who is the patient?</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Select the family member this visit is for.
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
              <TouchableOpacity
                className={`mr-2 px-4 py-2.5 rounded-full ${!selectedMemberId ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                onPress={() => setSelectedMemberId(null)}
              >
                <Text className={`font-medium ${!selectedMemberId ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>Self</Text>
              </TouchableOpacity>
              {familyMembers?.map(m => (
                <TouchableOpacity
                  key={m.id}
                  className={`mr-2 px-4 py-2.5 rounded-full ${selectedMemberId === m.id ? 'bg-red-600' : 'bg-gray-200 dark:bg-gray-700'}`}
                  onPress={() => setSelectedMemberId(m.id)}
                >
                  <Text className={`font-medium ${selectedMemberId === m.id ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {m.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              className="bg-red-600 rounded-xl py-4 items-center"
              onPress={() => setStep('pick-action')}
            >
              <Text className="text-white font-semibold text-base">Continue as {selectedName}</Text>
            </TouchableOpacity>
          </>
        )}

        {/* Step: loading */}
        {step === 'loading' && (
          <View className="items-center py-8">
            <ActivityIndicator size="large" color="#dc2626" />
            <Text className="text-gray-600 dark:text-gray-400 mt-4 text-base font-medium">Analysing prescription…</Text>
            <Text className="text-gray-400 dark:text-gray-500 mt-1 text-sm">Extracting details with AI</Text>
          </View>
        )}

        {/* Step: pick action */}
        {step === 'pick-action' && (
          <>
            <TouchableOpacity onPress={() => setStep('pick-patient')} className="flex-row items-center mb-4">
              <Icon name="arrow-back" size={18} color="#6b7280" />
              <Text className="text-gray-500 dark:text-gray-400 ml-1 text-sm">Patient: {selectedName}</Text>
            </TouchableOpacity>
            <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">Add Prescription</Text>
            <Text className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Scan the prescription or enter details manually.
            </Text>

            {extractError && (
              <View className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 mb-4">
                <View className="flex-row items-start gap-2 mb-1">
                  <Icon name="warning-outline" size={16} color="#dc2626" />
                  <Text className="text-red-700 dark:text-red-400 text-sm flex-1">{extractError}</Text>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                  Try a clearer photo, or enter details manually.
                </Text>
              </View>
            )}

            <TouchableOpacity
              className="flex-row items-center bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-3"
              onPress={() => pickAndExtract(true)}
            >
              <View className="w-10 h-10 bg-red-600 rounded-full items-center justify-center mr-4">
                <Icon name="camera" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-white">Scan Prescription</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Camera</Text>
              </View>
              <Icon name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-3"
              onPress={() => pickAndExtract(false)}
            >
              <View className="w-10 h-10 bg-red-600 rounded-full items-center justify-center mr-4">
                <Icon name="images" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-white">Scan Prescription</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Gallery</Text>
              </View>
              <Icon name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center bg-gray-50 dark:bg-gray-800 rounded-xl p-4"
              onPress={goManual}
            >
              <View className="w-10 h-10 bg-gray-600 rounded-full items-center justify-center mr-4">
                <Icon name="create-outline" size={20} color="white" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-semibold text-gray-900 dark:text-white">Enter Manually</Text>
                <Text className="text-sm text-gray-500 dark:text-gray-400">Type in prescription details</Text>
              </View>
              <Icon name="chevron-forward" size={18} color="#9ca3af" />
            </TouchableOpacity>
          </>
        )}
      </View>
    </Modal>
  );
}

// ── Tiny reusable editable field for preview ─────────────────────────────────
function PreviewField({
  label, value, onChange, placeholder, keyboardType, editable = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  editable?: boolean;
}) {
  return (
    <View className="mb-3">
      <Text className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</Text>
      <TextInput
        className={`border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm ${editable ? 'text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800'}`}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        editable={editable}
      />
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function MedicalScreen() {
  const { data: visits, isLoading, refetch } = useVisits();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<VisitSummary | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="px-4 pt-4 pb-2">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white">Medical</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Hospital visit history</Text>
      </View>

      <FlatList
        data={visits}
        keyExtractor={(item) => item.prescription_id}
        contentContainerStyle={{ padding: 16, paddingTop: 4, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <VisitCard visit={item} onPress={() => setSelectedVisit(item)} />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center py-16">
              <Icon name="medical-outline" size={56} color="#9ca3af" />
              <Text className="text-gray-500 dark:text-gray-400 mt-3 text-center">
                No hospital visits yet.{'\n'}Upload a prescription to get started.
              </Text>
            </View>
          ) : null
        }
      />

      {/* Floating Add Button */}
      <TouchableOpacity
        className="absolute bottom-8 right-6 w-14 h-14 bg-red-600 rounded-full items-center justify-center shadow-lg"
        onPress={() => setShowUpload(true)}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>

      {selectedVisit && (
        <VisitDetailModal
          visit={selectedVisit}
          onClose={() => setSelectedVisit(null)}
          onDeleted={() => setSelectedVisit(null)}
        />
      )}

      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onSaved={() => {
            setShowUpload(false);
            Alert.alert('Saved', 'Prescription details extracted and saved.');
          }}
        />
      )}
    </SafeAreaView>
  );
}
