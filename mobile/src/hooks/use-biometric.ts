import { useState, useEffect } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export function useBiometric() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    checkAvailability();
    checkEnabled();
  }, []);

  const checkAvailability = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setIsAvailable(compatible && enrolled);
  };

  const checkEnabled = async () => {
    const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
    setIsEnabled(enabled === 'true');
  };

  const toggle = async () => {
    if (!isEnabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric lock',
      });
      if (result.success) {
        await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
        setIsEnabled(true);
      }
    } else {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'false');
      setIsEnabled(false);
    }
  };

  const authenticate = async (): Promise<boolean> => {
    if (!isEnabled) return true;
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock NestLedger',
      fallbackLabel: 'Use passcode',
    });
    return result.success;
  };

  return { isAvailable, isEnabled, toggle, authenticate };
}
