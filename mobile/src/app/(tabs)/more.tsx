import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers/auth-provider';
import { useBiometric } from '@/hooks/use-biometric';

export default function MoreScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { signOut } = useAuth();
  const { isAvailable, isEnabled, toggle: toggleBiometric } = useBiometric();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const sections = [
    {
      title: 'Records',
      items: [
        { title: 'Documents', icon: 'folder-outline', route: '/documents', color: '#059669' },
        { title: 'Loans & EMI', icon: 'card-outline', route: '/loans', color: '#4f46e5' },
        { title: 'Insurance', icon: 'shield-outline', route: '/insurance', color: '#0891b2' },
      ],
    },
    {
      title: 'Tools',
      items: [
        { title: t('dashboard.search'), icon: 'search-outline', route: '/search', color: '#2563eb' },
        { title: 'Reminders', icon: 'notifications-outline', route: '/reminders', color: '#d97706' },
      ],
    },
    {
      title: 'Settings',
      items: [
        ...(isAvailable ? [{ title: `Biometric Lock: ${isEnabled ? 'On' : 'Off'}`, icon: 'finger-print-outline', action: toggleBiometric, color: '#7c3aed' }] : []),
        { title: i18n.language === 'en' ? 'Switch to Tamil' : 'Switch to English', icon: 'language-outline', action: toggleLanguage, color: '#6b7280' },
      ],
    },
  ];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {sections.map((section) => (
          <View key={section.title} className="mb-6">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase mb-2 ml-1">
              {section.title}
            </Text>
            <View className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm">
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.title}
                  className={`flex-row items-center px-4 py-4 ${index < section.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
                  onPress={() => {
                    if ('action' in item && item.action) {
                      item.action();
                    } else if ('route' in item) {
                      router.push(item.route as any);
                    }
                  }}
                >
                  <View className="w-8 h-8 rounded-full justify-center items-center mr-3" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text className="flex-1 text-gray-900 dark:text-white">{item.title}</Text>
                  <Icon name="chevron-forward" size={16} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity
          className="bg-white dark:bg-gray-800 rounded-xl px-4 py-4 shadow-sm flex-row items-center"
          onPress={handleSignOut}
        >
          <View className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 justify-center items-center mr-3">
            <Icon name="log-out-outline" size={18} color="#ef4444" />
          </View>
          <Text className="text-red-600 dark:text-red-400 font-medium">Sign Out</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-400 dark:text-gray-600 text-xs mt-6">
          NestLedger v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}
