import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Icon from '@react-native-vector-icons/ionicons';
import { useLoan, useEMIPayments, useUpdateEMI, useDeleteLoan } from '@/hooks/queries/use-loans';

export default function LoanDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: loan, isLoading } = useLoan(id);
  const { data: emis } = useEMIPayments(id);
  const updateEMI = useUpdateEMI(id);
  const deleteLoan = useDeleteLoan();

  if (isLoading || !loan) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

  const handleMarkPaid = (emiId: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateEMI.mutate({ emiId, data: { status: 'paid', paid_date: today } });
  };

  const handleDelete = () => {
    Alert.alert('Delete Loan', 'This will delete the loan and all EMI records.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteLoan.mutateAsync(id);
          router.back();
        },
      },
    ]);
  };

  const paidCount = emis?.filter(e => e.status === 'paid').length || 0;
  const totalCount = emis?.length || 0;

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Header */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-xl font-bold text-gray-900 dark:text-white">
            {loan.lender_name}
          </Text>
          <Text className="text-gray-500 dark:text-gray-400 capitalize mb-3">
            {loan.loan_type.replace(/_/g, ' ')} Loan
          </Text>

          <View className="flex-row justify-between mb-2">
            <View className="flex-1">
              <Text className="text-gray-400 dark:text-gray-500 text-xs">Principal</Text>
              <Text className="text-gray-900 dark:text-white font-bold text-lg">
                {formatCurrency(loan.principal_amount)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 dark:text-gray-500 text-xs">EMI</Text>
              <Text className="text-gray-900 dark:text-white font-bold text-lg">
                {formatCurrency(loan.emi_amount)}
              </Text>
            </View>
          </View>

          <View className="flex-row justify-between">
            <View className="flex-1">
              <Text className="text-gray-400 dark:text-gray-500 text-xs">Interest Rate</Text>
              <Text className="text-gray-900 dark:text-white font-semibold">{loan.interest_rate}%</Text>
            </View>
            <View className="flex-1">
              <Text className="text-gray-400 dark:text-gray-500 text-xs">Tenure</Text>
              <Text className="text-gray-900 dark:text-white font-semibold">{loan.tenure_months} months</Text>
            </View>
          </View>

          {/* Progress */}
          <View className="mt-4">
            <View className="flex-row justify-between mb-1">
              <Text className="text-gray-500 dark:text-gray-400 text-sm">Progress</Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">{paidCount}/{totalCount} EMIs paid</Text>
            </View>
            <View className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <View
                className="h-2 bg-green-500 rounded-full"
                style={{ width: `${totalCount > 0 ? (paidCount / totalCount) * 100 : 0}%` }}
              />
            </View>
          </View>
        </View>

        {/* EMI Timeline */}
        <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          EMI Schedule
        </Text>

        {emis?.map((emi) => (
          <View
            key={emi.id}
            className={`bg-white dark:bg-gray-800 rounded-xl p-3 mb-2 flex-row items-center shadow-sm ${
              emi.status === 'paid' ? 'opacity-60' : ''
            }`}
          >
            <View className={`w-8 h-8 rounded-full justify-center items-center mr-3 ${
              emi.status === 'paid' ? 'bg-green-100 dark:bg-green-900/30' :
              emi.status === 'overdue' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Icon
                name={emi.status === 'paid' ? 'checkmark' : emi.status === 'overdue' ? 'alert' : 'time-outline'}
                size={16}
                color={emi.status === 'paid' ? '#16a34a' : emi.status === 'overdue' ? '#dc2626' : '#6b7280'}
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 dark:text-white font-medium">
                {formatCurrency(emi.amount)}
              </Text>
              <Text className="text-gray-500 dark:text-gray-400 text-sm">
                Due: {emi.due_date}
              </Text>
            </View>
            {emi.status === 'upcoming' && (
              <TouchableOpacity
                className="bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full"
                onPress={() => handleMarkPaid(emi.id)}
              >
                <Text className="text-green-700 dark:text-green-300 text-sm font-medium">Mark Paid</Text>
              </TouchableOpacity>
            )}
            {emi.status === 'paid' && (
              <Text className="text-green-600 dark:text-green-400 text-sm">Paid</Text>
            )}
          </View>
        ))}

        {/* Delete */}
        <TouchableOpacity
          className="bg-red-50 dark:bg-red-900/20 rounded-lg py-3 mt-6"
          onPress={handleDelete}
        >
          <Text className="text-red-600 dark:text-red-400 text-center font-semibold">Delete Loan</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
