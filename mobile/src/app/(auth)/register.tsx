import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/providers/auth-provider';
import { useTranslation } from 'react-i18next';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!email || !password || !displayName) return;
    setLoading(true);
    try {
      await signUp(email, password, displayName);
      Alert.alert('Success', 'Check your email for verification link');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center px-6 bg-white dark:bg-gray-900">
      <Text className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
        FamEx
      </Text>

      <TextInput
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        placeholder={t('auth.displayName')}
        placeholderTextColor="#9ca3af"
        value={displayName}
        onChangeText={setDisplayName}
      />

      <TextInput
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        placeholder={t('auth.email')}
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 mb-6 text-gray-900 dark:text-white bg-white dark:bg-gray-800"
        placeholder={t('auth.password')}
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        className="bg-primary-600 rounded-lg py-3 mb-4"
        onPress={handleRegister}
        disabled={loading}
      >
        <Text className="text-white text-center font-semibold text-lg">
          {loading ? t('common.loading') : t('auth.register')}
        </Text>
      </TouchableOpacity>

      <Link href="/(auth)/login" asChild>
        <TouchableOpacity>
          <Text className="text-primary-600 text-center">
            {t('auth.hasAccount')}
          </Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}
