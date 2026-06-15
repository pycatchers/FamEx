import { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useDocuments } from '@/hooks/queries/use-documents';
import { DOCUMENT_TYPES } from '@/types/documents';

export default function DocumentsScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | undefined>();
  const { data: documents, isLoading } = useDocuments(undefined, selectedType);

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Filter Chips */}
      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={[{ value: undefined, label: 'All' }, ...DOCUMENT_TYPES]}
        keyExtractor={(item) => item.label}
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className={`mr-2 px-3 py-1.5 rounded-full ${
              selectedType === item.value ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
            }`}
            onPress={() => setSelectedType(item.value)}
          >
            <Text
              className={`text-sm ${
                selectedType === item.value ? 'text-white' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Document List */}
      {!documents?.length ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="document-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center">
            No documents found
          </Text>
        </View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
              onPress={() => router.push(`/documents/${item.id}`)}
            >
              <View className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 justify-center items-center mr-3">
                <Icon name="document-text-outline" size={22} color="#2563eb" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-semibold capitalize">
                  {item.document_type.replace(/_/g, ' ')}
                </Text>
                {item.document_number && (
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    {item.document_number}
                  </Text>
                )}
                {item.expiry_date && (
                  <Text className="text-orange-500 text-xs mt-1">
                    Expires: {item.expiry_date}
                  </Text>
                )}
              </View>
              <Icon name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
        onPress={() => router.push('/documents/add')}
      >
        <Icon name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}
