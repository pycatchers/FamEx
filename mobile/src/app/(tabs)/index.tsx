import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useTranslation } from 'react-i18next';
import { useDashboard } from '@/hooks/queries/use-dashboard';
import { useState } from 'react';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data, isLoading, refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => `₹${(amount || 0).toLocaleString('en-IN')}`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50 dark:bg-gray-900" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="p-4">
          {/* Quick Stats */}
          <View className="flex-row gap-3 mb-4">
            <View className="flex-1 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
              <Icon name="people-outline" size={20} color="#2563eb" />
              <Text className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                {data?.family_members_count ?? 0}
              </Text>
              <Text className="text-blue-500 dark:text-blue-400 text-xs">Family</Text>
            </View>
            <View className="flex-1 bg-green-50 dark:bg-green-900/20 rounded-xl p-3">
              <Icon name="card-outline" size={20} color="#059669" />
              <Text className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                {data?.active_loans_count ?? 0}
              </Text>
              <Text className="text-green-500 dark:text-green-400 text-xs">Active Loans</Text>
            </View>
            <View className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3">
              <Icon name="medical-outline" size={20} color="#7c3aed" />
              <Text className="text-2xl font-bold text-purple-700 dark:text-purple-300 mt-1">
                {data?.active_medicines_count ?? 0}
              </Text>
              <Text className="text-purple-500 dark:text-purple-400 text-xs">Medicines</Text>
            </View>
          </View>

          {/* Monthly Spending Card */}
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.thisMonth')}</Text>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatCurrency(data?.monthly_spending?.total || 0)}
                </Text>
                <Text className="text-gray-400 dark:text-gray-500 text-xs">
                  {data?.monthly_spending?.bill_count || 0} bills
                </Text>
              </View>
              <TouchableOpacity
                className="w-10 h-10 rounded-full bg-primary-50 dark:bg-primary-900/20 justify-center items-center"
                onPress={() => router.push('/(tabs)/shopping')}
              >
                <Icon name="arrow-forward" size={18} color="#2563eb" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming EMIs */}
          {data?.upcoming_emis && data.upcoming_emis.length > 0 && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.upcomingEMIs')}</Text>
                <TouchableOpacity onPress={() => router.push('/loans')}>
                  <Text className="text-primary-600 text-sm">View All</Text>
                </TouchableOpacity>
              </View>
              {data.upcoming_emis.map((emi, i) => (
                <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <View>
                    <Text className="text-gray-900 dark:text-white">{emi.lender_name}</Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs">{emi.due_date}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-900 dark:text-white font-bold">{formatCurrency(emi.amount)}</Text>
                    <Text className={`text-xs ${emi.status === 'overdue' ? 'text-red-500' : 'text-orange-500'}`}>
                      {emi.status}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Upcoming Insurance */}
          {data?.upcoming_insurance && data.upcoming_insurance.length > 0 && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.insuranceDue')}</Text>
                <TouchableOpacity onPress={() => router.push('/insurance')}>
                  <Text className="text-primary-600 text-sm">View All</Text>
                </TouchableOpacity>
              </View>
              {data.upcoming_insurance.map((ins, i) => (
                <View key={i} className="flex-row justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <View>
                    <Text className="text-gray-900 dark:text-white">{ins.provider_name}</Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs capitalize">{ins.policy_type}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-gray-900 dark:text-white font-bold">{formatCurrency(ins.premium_amount)}</Text>
                    <Text className="text-orange-500 text-xs">{ins.next_premium_date}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Follow-ups */}
          {data?.upcoming_follow_ups && data.upcoming_follow_ups.length > 0 && (
            <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('dashboard.followUps')}</Text>
              {data.upcoming_follow_ups.map((fu, i) => (
                <View key={i} className="flex-row items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <Icon name="calendar-outline" size={16} color="#d97706" />
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 dark:text-white">{fu.diagnosis || 'Follow-up'}</Text>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs">
                      {fu.doctor_name ? `Dr. ${fu.doctor_name} · ` : ''}{fu.follow_up_date}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Quick Actions */}
          <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">{t('dashboard.quickActions')}</Text>
          <View className="flex-row flex-wrap gap-3 mb-6">
            {[
              { title: 'Add Bill', icon: 'receipt-outline', route: '/shopping/add-bill', color: '#7c3aed' },
              { title: t('dashboard.search'), icon: 'search-outline', route: '/search', color: '#2563eb' },
              { title: 'Documents', icon: 'folder-outline', route: '/documents', color: '#059669' },
              { title: 'Prescription', icon: 'document-text-outline', route: '/medical/add-prescription', color: '#dc2626' },
            ].map((action) => (
              <TouchableOpacity
                key={action.title}
                className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-sm flex-row items-center"
                style={{ width: '47%' }}
                onPress={() => router.push(action.route as any)}
              >
                <View className="w-8 h-8 rounded-full justify-center items-center mr-2" style={{ backgroundColor: `${action.color}15` }}>
                  <Icon name={action.icon} size={16} color={action.color} />
                </View>
                <Text className="text-gray-700 dark:text-gray-300 text-sm">{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
