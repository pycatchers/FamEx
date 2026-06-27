import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import { useCreateDocument } from '@/hooks/queries/use-documents';
import { DOCUMENT_TYPES } from '@/types/documents';
import DatePickerField from '@/components/date-picker-field';

export default function AddDocumentScreen() {
  const router = useRouter();
  const { familyMemberId } = useLocalSearchParams<{ familyMemberId?: string }>();
  const createMutation = useCreateDocument();

  const [documentType, setDocumentType] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!documentType) {
      Alert.alert('Error', 'Please select a document type');
      return;
    }

    try {
      await createMutation.mutateAsync({
        family_member_id: familyMemberId || null,
        document_type: documentType,
        document_number: documentNumber || null,
        issuing_authority: issuingAuthority || null,
        issue_date: issueDate || null,
        expiry_date: expiryDate || null,
        notes: notes || null,
        file_url: selectedImage || null,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Add Document
        </Text>

        {/* Document Type */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Type *</Text>
        <View className="flex-row flex-wrap mb-4">
          {DOCUMENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.value}
              className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                documentType === type.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setDocumentType(type.value)}
            >
              <Text
                className={`text-sm ${
                  documentType === type.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Document Number */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Document Number</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Enter document number"
          placeholderTextColor="#9ca3af"
          value={documentNumber}
          onChangeText={setDocumentNumber}
        />

        {/* Issuing Authority */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Issuing Authority</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="e.g., Government of India"
          placeholderTextColor="#9ca3af"
          value={issuingAuthority}
          onChangeText={setIssuingAuthority}
        />

        {/* Issue Date */}
        <DatePickerField
          label="Issue Date"
          value={issueDate}
          onChange={setIssueDate}
          maximumDate={new Date()}
        />

        {/* Expiry Date */}
        <DatePickerField
          label="Expiry Date"
          value={expiryDate}
          onChange={setExpiryDate}
        />

        {/* Image Upload */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Document Image</Text>
        <View className="flex-row gap-3 mb-4">
          <TouchableOpacity
            className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-4 items-center"
            onPress={pickImage}
          >
            <Icon name="images-outline" size={24} color="#6b7280" />
            <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg py-4 items-center"
            onPress={takePhoto}
          >
            <Icon name="camera-outline" size={24} color="#6b7280" />
            <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1">Camera</Text>
          </TouchableOpacity>
        </View>
        {selectedImage && (
          <View className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 mb-4 flex-row items-center">
            <Icon name="checkmark-circle" size={20} color="#16a34a" />
            <Text className="text-green-700 dark:text-green-300 ml-2">Image selected</Text>
          </View>
        )}

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-6 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Any notes..."
          placeholderTextColor="#9ca3af"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
        />

        {/* Submit */}
        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-4 mb-4"
          onPress={handleSubmit}
          disabled={createMutation.isPending}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {createMutation.isPending ? 'Saving...' : 'Save Document'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
