import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from '@react-native-vector-icons/ionicons';
import { useBiometric } from '@/hooks/use-biometric';

interface Props {
  children: React.ReactNode;
}

export function BiometricGate({ children }: Props) {
  const { isEnabled, authenticate } = useBiometric();
  const [isLocked, setIsLocked] = useState(true);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    unlock();
  }, [isEnabled]);

  const unlock = async () => {
    setChecking(true);
    if (!isEnabled) {
      setIsLocked(false);
      setChecking(false);
      return;
    }
    const success = await authenticate();
    setIsLocked(!success);
    setChecking(false);
  };

  if (checking) return null;

  if (isLocked) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-gray-900 justify-center items-center px-6">
        <Icon name="lock-closed" size={64} color="#2563eb" />
        <Text className="text-xl font-bold text-gray-900 dark:text-white mt-6">FamEx is Locked</Text>
        <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
          Authenticate to access your data
        </Text>
        <TouchableOpacity
          className="bg-primary-600 rounded-lg px-8 py-4 mt-8"
          onPress={unlock}
        >
          <Text className="text-white font-semibold text-lg">Unlock</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}
