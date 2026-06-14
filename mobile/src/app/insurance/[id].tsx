import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useInsurancePolicy, useDeleteInsurance } from '@/hooks/queries/use-insurance';

export default function InsuranceDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: policy, isLoading } = useInsurancePolicy(id);
  const deleteMutation = useDeleteInsurance();

  if (isLoading || !policy) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

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

        {/* Delete */}
        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 mt-4"
          onPress={handleDelete}
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete Policy</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
