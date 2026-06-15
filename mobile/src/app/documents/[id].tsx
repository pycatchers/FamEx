import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useDocument, useDeleteDocument } from '@/hooks/queries/use-documents';

export default function DocumentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: document, isLoading } = useDocument(id);
  const deleteMutation = useDeleteDocument();

  if (isLoading || !document) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert('Delete Document', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMutation.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  const InfoRow = ({ label, value }: { label: string; value: string | null }) => {
    if (!value) return null;
    return (
      <View className="flex-row justify-between py-3 border-b border-gray-100 dark:border-gray-700">
        <Text className="text-gray-500 dark:text-gray-400">{label}</Text>
        <Text className="text-gray-900 dark:text-white font-medium flex-1 text-right ml-4">{value}</Text>
      </View>
    );
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="items-center mb-6">
          <View className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 justify-center items-center mb-3">
            <Icon name="document-text" size={32} color="#2563eb" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
            {document.document_type.replace(/_/g, ' ')}
          </Text>
        </View>

        {/* Details Card */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <InfoRow label="Document Number" value={document.document_number} />
          <InfoRow label="Issuing Authority" value={document.issuing_authority} />
          <InfoRow label="Issue Date" value={document.issue_date} />
          <InfoRow label="Expiry Date" value={document.expiry_date} />
          {document.notes && (
            <View className="pt-3">
              <Text className="text-gray-500 dark:text-gray-400 mb-1">Notes</Text>
              <Text className="text-gray-900 dark:text-white">{document.notes}</Text>
            </View>
          )}
          {document.tags && document.tags.length > 0 && (
            <View className="pt-3">
              <Text className="text-gray-500 dark:text-gray-400 mb-2">Tags</Text>
              <View className="flex-row flex-wrap">
                {document.tags.map((tag, i) => (
                  <View key={i} className="bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 mr-2 mb-1">
                    <Text className="text-gray-700 dark:text-gray-300 text-sm">{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* File Preview */}
        {document.file_url && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Attached File
            </Text>
            <TouchableOpacity className="flex-row items-center py-2">
              <Icon name="attach" size={20} color="#2563eb" />
              <Text className="text-primary-600 ml-2">View Document</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Actions */}
        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 mt-4"
          onPress={handleDelete}
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-semibold">
            Delete Document
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
