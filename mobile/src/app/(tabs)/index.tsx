import { View, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/auth-provider';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('dashboard.title')}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 mb-6">
          Welcome, {user?.user_metadata?.display_name || user?.email}
        </Text>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.upcomingEmis')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">No upcoming EMIs</Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.monthlySpending')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">No data yet</Text>
        </View>

        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('dashboard.recentPurchases')}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400">No purchases yet</Text>
        </View>
      </View>
    </ScrollView>
  );
}
