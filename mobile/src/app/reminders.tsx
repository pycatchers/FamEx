import { View, Text } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';

export default function RemindersScreen() {
  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center px-6">
      <Icon name="notifications-outline" size={64} color="#9ca3af" />
      <Text className="text-gray-500 dark:text-gray-400 text-lg mt-4">Reminders</Text>
      <Text className="text-gray-400 dark:text-gray-500 text-sm mt-2 text-center">
        Automatic reminders for EMI payments, insurance renewals, and follow-up visits will appear here.
      </Text>
    </View>
  );
}
