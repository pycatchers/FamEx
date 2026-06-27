import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Icon from '@react-native-vector-icons/ionicons';
import { useFamilyMembers } from '@/hooks/queries/use-family';

export default function FamilyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: members, isLoading, error } = useFamilyMembers();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <View className="flex-1">
        {!members?.length ? (
          <View className="flex-1 justify-center items-center px-6">
            <Icon name="people-outline" size={64} color="#9ca3af" />
            <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4 text-center">
              No family members yet
            </Text>
            <Text className="text-gray-400 dark:text-gray-500 mt-2 text-center">
              Tap + to add your first family member
            </Text>
          </View>
        ) : (
          <FlatList
            data={members}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
                onPress={() => router.push(`/family/${item.id}`)}
              >
                <View className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 justify-center items-center mr-3">
                  <Text className="text-primary-600 dark:text-primary-300 text-lg font-bold">
                    {item.full_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white text-base font-semibold">
                    {item.full_name}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                    {item.relationship}
                  </Text>
                </View>
                <Icon name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            )}
          />
        )}

        {/* FAB */}
        <TouchableOpacity
          className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-primary-600 justify-center items-center shadow-lg"
          onPress={() => router.push('/family/add')}
        >
          <Icon name="add" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
