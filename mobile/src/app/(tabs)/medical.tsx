import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';

export default function MedicalScreen() {
  const { t } = useTranslation();

  return (
    <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-gray-900">
      <Text className="text-xl text-gray-500 dark:text-gray-400">
        {t('tabs.medical')}
      </Text>
      <Text className="text-gray-400 dark:text-gray-500 mt-2">Coming soon</Text>
    </View>
  );
}
