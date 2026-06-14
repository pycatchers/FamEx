import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useCreateFamilyMember, useUpdateFamilyMember, useFamilyMember } from '@/hooks/queries/use-family';

const RELATIONSHIPS = ['Father', 'Mother', 'Spouse', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'];
const GENDERS = ['Male', 'Female', 'Other'];
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddFamilyMemberScreen() {
  const router = useRouter();
  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditing = !!editId;

  const { data: existingMember } = useFamilyMember(editId || '');
  const createMutation = useCreateFamilyMember();
  const updateMutation = useUpdateFamilyMember(editId || '');

  const [fullName, setFullName] = useState(existingMember?.full_name || '');
  const [relationship, setRelationship] = useState(existingMember?.relationship || '');
  const [gender, setGender] = useState(existingMember?.gender || '');
  const [dateOfBirth, setDateOfBirth] = useState(existingMember?.date_of_birth || '');
  const [phone, setPhone] = useState(existingMember?.phone || '');
  const [email, setEmail] = useState(existingMember?.email || '');
  const [bloodGroup, setBloodGroup] = useState(existingMember?.blood_group || '');
  const [notes, setNotes] = useState(existingMember?.notes || '');

  const handleSubmit = async () => {
    if (!fullName.trim() || !relationship) {
      Alert.alert('Error', 'Name and relationship are required');
      return;
    }

    const data = {
      full_name: fullName.trim(),
      relationship: relationship.toLowerCase(),
      gender: gender.toLowerCase() || null,
      date_of_birth: dateOfBirth || null,
      phone: phone || null,
      email: email || null,
      blood_group: bloodGroup || null,
      notes: notes || null,
    };

    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
      } else {
        await createMutation.mutateAsync(data);
      }
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {isEditing ? 'Edit Family Member' : 'Add Family Member'}
        </Text>

        {/* Full Name */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name *</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Enter full name"
          placeholderTextColor="#9ca3af"
          value={fullName}
          onChangeText={setFullName}
        />

        {/* Relationship */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship *</Text>
        <View className="flex-row flex-wrap mb-4">
          {RELATIONSHIPS.map((rel) => (
            <TouchableOpacity
              key={rel}
              className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                relationship.toLowerCase() === rel.toLowerCase()
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setRelationship(rel)}
            >
              <Text
                className={`text-sm ${
                  relationship.toLowerCase() === rel.toLowerCase()
                    ? 'text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {rel}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Gender */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</Text>
        <View className="flex-row mb-4">
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g}
              className={`mr-2 px-4 py-2 rounded-full ${
                gender.toLowerCase() === g.toLowerCase()
                  ? 'bg-primary-600'
                  : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setGender(g)}
            >
              <Text
                className={`text-sm ${
                  gender.toLowerCase() === g.toLowerCase()
                    ? 'text-white'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Date of Birth */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="YYYY-MM-DD"
          placeholderTextColor="#9ca3af"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />

        {/* Phone */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Phone number"
          placeholderTextColor="#9ca3af"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />

        {/* Email */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</Text>
        <TextInput
          className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
          placeholder="Email address"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        {/* Blood Group */}
        <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Blood Group</Text>
        <View className="flex-row flex-wrap mb-4">
          {BLOOD_GROUPS.map((bg) => (
            <TouchableOpacity
              key={bg}
              className={`mr-2 mb-2 px-3 py-2 rounded-full ${
                bloodGroup === bg ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
              }`}
              onPress={() => setBloodGroup(bg)}
            >
              <Text
                className={`text-sm ${
                  bloodGroup === bg ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {bg}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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

        {/* Submit Button */}
        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-4 mb-4"
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <Text className="text-white text-center font-semibold text-lg">
            {isLoading ? 'Saving...' : isEditing ? 'Update Member' : 'Add Member'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="py-3" onPress={() => router.back()}>
          <Text className="text-gray-500 dark:text-gray-400 text-center">Cancel</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
