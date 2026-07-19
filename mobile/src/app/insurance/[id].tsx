import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useInsurancePolicy, useDeleteInsurance, usePremiumPayments, useUpdatePremium } from '@/hooks/queries/use-insurance';

export default function InsuranceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: policy, isLoading } = useInsurancePolicy(id);
  const { data: premiums } = usePremiumPayments(id);
  const updatePremium = useUpdatePremium(id);
  const deleteMutation = useDeleteInsurance();

  if (isLoading || !policy) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handleMarkPaid = (premiumId: string) => {
    const today = new Date().toISOString().split('T')[0];
    updatePremium.mutate({ premiumId, data: { status: 'paid', paid_date: today } });
  };

  const paidCount = premiums?.filter(p => p.status === 'paid').length || 0;
  const totalCount = premiums?.length || 0;

  const handleDelete = () => {
    Alert.alert('Delete Policy', 'Are you sure?', [
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

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => {
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
          <View className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-900/20 justify-center items-center mb-3">
            <Icon name="shield-checkmark" size={32} color="#7c3aed" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 dark:text-white">
            {policy.provider_name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 capitalize">
            {policy.policy_type.replace(/_/g, ' ')} Insurance
          </Text>
        </View>

        {/* Details */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <InfoRow label="Policy Number" value={policy.policy_number} />
          <InfoRow label="Sum Insured" value={policy.sum_insured ? formatCurrency(policy.sum_insured) : null} />
          <InfoRow label="Premium" value={`${formatCurrency(policy.premium_amount)} (${policy.premium_frequency})`} />
          <InfoRow label="Start Date" value={policy.start_date} />
          <InfoRow label="End Date" value={policy.end_date} />
          <InfoRow label="Next Premium" value={policy.next_premium_date} />
          <InfoRow label="Nominee" value={policy.nominee_name} />
          <InfoRow label="Vehicle Number" value={policy.vehicle_number} />
          <InfoRow label="Vehicle" value={policy.vehicle_make_model} />
          <InfoRow label="Agent" value={policy.agent_name} />
          <InfoRow label="Agent Phone" value={policy.agent_phone} />
          <InfoRow label="Status" value={policy.status} />
          {policy.notes && (
            <View className="pt-3">
              <Text className="text-gray-500 dark:text-gray-400 mb-1">Notes</Text>
              <Text className="text-gray-900 dark:text-white">{policy.notes}</Text>
            </View>
          )}
        </View>

        {/* Premiums Paid */}
        {totalCount > 0 && (
          <>
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-semibold text-gray-900 dark:text-white">
                Premiums Paid
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{paidCount}/{totalCount} paid</Text>
            </View>

            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-3">
              <View
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
              />
            </View>

            {premiums?.map((premium) => (
              <View
                key={premium.id}
                className={`bg-white dark:bg-gray-800 rounded-xl p-3 mb-2 flex-row items-center shadow-sm ${
                  premium.status === 'paid' ? 'opacity-60' : ''
                }`}
              >
                <View className={`w-8 h-8 rounded-full justify-center items-center mr-3 ${
                  premium.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
                  premium.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' :
                  'bg-gray-100 dark:bg-gray-700'
                }`}>
                  <Icon
                    name={premium.status === 'paid' ? 'checkmark' : premium.status === 'overdue' ? 'alert' : 'time-outline'}
                    size={16}
                    color={premium.status === 'paid' ? '#16a34a' : premium.status === 'overdue' ? '#dc2626' : '#6b7280'}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-900 dark:text-white font-medium">
                    {formatCurrency(premium.amount)}
                  </Text>
                  <Text className="text-gray-500 dark:text-gray-400 text-sm">
                    Due: {premium.due_date}
                  </Text>
                </View>
                {premium.status === 'upcoming' && (
                  <TouchableOpacity
                    className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full"
                    onPress={() => handleMarkPaid(premium.id)}
                  >
                    <Text className="text-green-700 dark:text-green-300 text-sm font-medium">Mark Paid</Text>
                  </TouchableOpacity>
                )}
                {premium.status === 'paid' && (
                  <Text className="text-green-600 dark:text-green-400 text-sm">Paid</Text>
                )}
              </View>
            ))}
          </>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 mt-4">
          <TouchableOpacity
            className="flex-1 bg-primary-600 rounded-lg py-3"
            onPress={() => router.push(`/insurance/add?editId=${id}` as any)}
          >
            <Text className="text-white text-center font-semibold">Edit Policy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-lg py-3"
            onPress={handleDelete}
          >
            <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete Policy</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
