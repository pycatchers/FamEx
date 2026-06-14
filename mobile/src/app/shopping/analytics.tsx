import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import { useShoppingAnalytics } from '@/hooks/queries/use-shopping';

export default function AnalyticsScreen() {
  const { data: analytics, isLoading } = useShoppingAnalytics();

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Monthly Summary */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Monthly Spending</Text>
          {analytics?.monthly_spending.length ? (
            analytics.monthly_spending.map((m) => (
              <View key={m.month} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <Text className="text-gray-700 dark:text-gray-300">{m.month}</Text>
                <Text className="text-gray-900 dark:text-white font-bold">{formatCurrency(m.total)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 dark:text-gray-500">No data yet</Text>
          )}
        </View>

        {/* Shop Spending */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">By Shop</Text>
          {analytics?.shop_spending.length ? (
            analytics.shop_spending.map((s) => (
              <View key={s.shop_id} className="flex-row justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                <View>
                  <Text className="text-gray-700 dark:text-gray-300">{s.shop_name}</Text>
                  <Text className="text-gray-400 dark:text-gray-500 text-xs">{s.bill_count} bills</Text>
                </View>
                <Text className="text-gray-900 dark:text-white font-bold">{formatCurrency(s.total)}</Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 dark:text-gray-500">No data yet</Text>
          )}
        </View>

        {/* Top Items */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Top Items</Text>
          {analytics?.top_items.length ? (
            analytics.top_items.slice(0, 10).map((item, i) => (
              <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <View className="flex-row items-center">
                  <Text className="text-gray-400 dark:text-gray-500 w-6">{i + 1}.</Text>
                  <Text className="text-gray-700 dark:text-gray-300">{item.item_name}</Text>
                </View>
                <Text className="text-gray-500 dark:text-gray-400 text-sm">
                  {item.count}x · avg {formatCurrency(item.avg_price)}
                </Text>
              </View>
            ))
          ) : (
            <Text className="text-gray-400 dark:text-gray-500">No data yet</Text>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
