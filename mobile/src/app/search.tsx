import { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useSearch } from '@/hooks/queries/use-dashboard';

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { data, isLoading } = useSearch(query);

  const getModuleIcon = (module: string) => {
    switch (module) {
      case 'family': return 'people-outline';
      case 'document': return 'folder-outline';
      case 'shop': return 'storefront-outline';
      case 'medicine': return 'medical-outline';
      case 'prescription': return 'document-text-outline';
      case 'insurance': return 'shield-outline';
      case 'loan': return 'card-outline';
      default: return 'ellipse-outline';
    }
  };

  const getModuleColor = (module: string) => {
    switch (module) {
      case 'family': return '#2563eb';
      case 'document': return '#059669';
      case 'shop': return '#7c3aed';
      case 'medicine': return '#dc2626';
      case 'prescription': return '#d97706';
      case 'insurance': return '#0891b2';
      case 'loan': return '#4f46e5';
      default: return '#6b7280';
    }
  };

  const handleResultPress = (result: { module: string; id: string }) => {
    switch (result.module) {
      case 'family':
        router.push(`/family/${result.id}`);
        break;
      case 'document':
        router.push(`/documents/${result.id}`);
        break;
      case 'shop':
        router.push(`/shopping/bill-detail?id=${result.id}`);
        break;
      case 'medicine':
      case 'prescription':
        router.push(`/medical/prescription-detail?id=${result.id}`);
        break;
      case 'insurance':
        router.push(`/insurance/${result.id}`);
        break;
      case 'loan':
        router.push(`/loans/${result.id}`);
        break;
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900">
      {/* Search Input */}
      <View className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <View className="flex-row items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-3">
          <Icon name="search-outline" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-900 dark:text-white"
            placeholder="Search documents, shops, medicines..."
            placeholderTextColor="#9ca3af"
            value={query}
            onChangeText={setQuery}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Icon name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results */}
      {isLoading && query.length >= 2 ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : query.length < 2 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="search-outline" size={64} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4 text-center">
            Type at least 2 characters to search
          </Text>
        </View>
      ) : data?.results.length === 0 ? (
        <View className="flex-1 justify-center items-center px-6">
          <Icon name="alert-circle-outline" size={48} color="#9ca3af" />
          <Text className="text-gray-500 dark:text-gray-400 mt-4">No results found</Text>
        </View>
      ) : (
        <FlatList
          data={data?.results || []}
          keyExtractor={(item, index) => `${item.module}-${item.id}-${index}`}
          contentContainerStyle={{ padding: 16 }}
          ListHeaderComponent={() => (
            <Text className="text-gray-500 dark:text-gray-400 text-sm mb-3">
              {data?.total ?? 0} result{data?.total !== 1 ? 's' : ''}
            </Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-2 flex-row items-center shadow-sm"
              onPress={() => handleResultPress(item)}
            >
              <View
                className="w-10 h-10 rounded-full justify-center items-center mr-3"
                style={{ backgroundColor: `${getModuleColor(item.module)}15` }}
              >
                <Icon name={getModuleIcon(item.module)} size={20} color={getModuleColor(item.module)} />
              </View>
              <View className="flex-1">
                <Text className="text-gray-900 dark:text-white font-medium">{item.title}</Text>
                {item.subtitle && (
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">{item.subtitle}</Text>
                )}
              </View>
              <View className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                <Text className="text-gray-500 dark:text-gray-400 text-xs capitalize">{item.module}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
