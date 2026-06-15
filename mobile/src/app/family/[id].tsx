import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useFamilyMember, useDeleteFamilyMember } from '@/hooks/queries/use-family';
import { useDocuments } from '@/hooks/queries/use-documents';

export default function FamilyMemberDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: member, isLoading } = useFamilyMember(id);
  const { data: documents } = useDocuments(id);
  const deleteMutation = useDeleteFamilyMember();

  if (isLoading || !member) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Delete Member',
      `Are you sure you want to delete ${member.full_name}? This will also delete their documents.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(id);
            router.back();
          },
        },
      ]
    );
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null }) => {
    if (!value) return null;
    return (
      <View className="flex-row justify-between py-3 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-gray-500 dark:text-gray-400">{label}</Text>
        <Text className="text-gray-900 dark:text-white font-medium">{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900 justify-center items-center mb-3">
            <Text className="text-primary-600 dark:text-primary-300 text-3xl font-bold">
              {member.full_name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {member.full_name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 capitalize">
            {member.relationship}
          </Text>
        </View>

        {/* Info Card */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <InfoRow label="Gender" value={member.gender} />
          <InfoRow label="Date of Birth" value={member.date_of_birth} />
          <InfoRow label="Phone" value={member.phone} />
          <InfoRow label="Email" value={member.email} />
          <InfoRow label="Blood Group" value={member.blood_group} />
          <InfoRow label="Guardian" value={member.guardian_name} />
          {member.notes && (
            <View className="pt-3">
              <Text className="text-gray-500 dark:text-gray-400 mb-1">Notes</Text>
              <Text className="text-gray-900 dark:text-white">{member.notes}</Text>
            </View>
          )}
        </View>

        {/* Documents Section */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row justify-between items-center mb-3">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white">
              Documents
            </Text>
            <TouchableOpacity
              onPress={() => router.push(`/documents/add?familyMemberId=${id}`)}
            >
              <Icon name="add-circle-outline" size={24} color="#2563eb" />
            </TouchableOpacity>
          </View>
          {!documents?.length ? (
            <Text className="text-gray-400 dark:text-gray-500">No documents yet</Text>
          ) : (
            documents.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                className="flex-row items-center py-2 border-b border-gray-100 dark:border-gray-700"
                onPress={() => router.push(`/documents/${doc.id}`)}
              >
                <Icon name="document-outline" size={20} color="#6b7280" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 dark:text-white capitalize">
                    {doc.document_type.replace(/_/g, ' ')}
                  </Text>
                  {doc.document_number && (
                    <Text className="text-gray-500 dark:text-gray-400 text-sm">
                      {doc.document_number}
                    </Text>
                  )}
                </View>
                <Icon name="chevron-forward" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Actions */}
        <View className="flex-row gap-3">
          <TouchableOpacity
            className="flex-1 bg-primary-600 rounded-lg py-3"
            onPress={() => router.push(`/family/add?editId=${id}`)}
          >
            <Text className="text-white text-center font-semibold">Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg py-3"
            onPress={handleDelete}
          >
            <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
