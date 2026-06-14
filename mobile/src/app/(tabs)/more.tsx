import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/auth-provider';
import { useRouter } from 'expo-router';

export default function MoreScreen() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const router = useRouter();

  const menuItems = [
    { label: 'Documents', icon: '📄', route: '/documents' },
    { label: 'Loans & EMI', icon: '💰', route: '/loans' },
    { label: 'Insurance', icon: '🛡️', route: '/insurance' },
    { label: 'Reminders', icon: '🔔', route: '/reminders' },
    { label: 'Settings', icon: '⚙️', route: '/settings' },
  ];

  return (
    <View className="flex-1 bg-gray-50 dark:bg-gray-900 p-4">
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.label}
          className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-3 flex-row items-center shadow-sm"
          onPress={() => {}}
        >
          <Text className="text-2xl mr-3">{item.icon}</Text>
          <Text className="text-lg text-gray-900 dark:text-white">{item.label}</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mt-6"
        onPress={signOut}
      >
        <Text className="text-red-600 dark:text-red-400 text-center font-semibold text-lg">
          Sign Out
        </Text>
      </TouchableOpacity>
    </View>
  );
}
