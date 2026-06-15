import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';
import { useShoppingAnalytics } from '@/hooks/queries/use-shopping';

export default function ShoppingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: analytics } = useShoppingAnalytics();

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  const menuItems = [
    { title: 'Shops', icon: 'storefront-outline', route: '/shopping/shops', color: '#2563eb' },
    { title: 'Bills', icon: 'receipt-outline', route: '/shopping/bills', color: '#7c3aed' },
    { title: 'Analytics', icon: 'bar-chart-outline', route: '/shopping/analytics', color: '#059669' },
    { title: 'Checklist', icon: 'checkbox-outline', route: '/shopping/checklist', color: '#d97706' },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Spending Summary */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-sm text-gray-500 dark:text-gray-400 mb-1">This Month</Text>
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(analytics?.total_this_month || 0)}
          </Text>
          <Text className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Last month: {formatCurrency(analytics?.total_last_month || 0)}
          </Text>
        </View>

        {/* Menu Grid */}
        <View className="flex-row flex-wrap gap-3">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              style={{ width: '47%' }}
              onPress={() => router.push(item.route as any)}
            >
              <View className="w-10 h-10 rounded-full justify-center items-center mb-2" style={{ backgroundColor: `${item.color}15` }}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Top Items */}
        {analytics?.top_items && analytics.top_items.length > 0 && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mt-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Frequently Bought
            </Text>
            {analytics.top_items.slice(0, 5).map((item, i) => (
              <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-gray-700 dark:text-gray-300">{item.item_name}</Text>
                <Text className="text-gray-500 dark:text-gray-400">
                  {item.count}x · avg {formatCurrency(item.avg_price)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
