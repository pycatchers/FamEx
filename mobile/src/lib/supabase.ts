import 'react-native-url-polyfill/auto';
import process from 'process';
import { Buffer } from 'buffer';
import { Platform } from 'react-native';

(global as any).process = process;
(global as any).Buffer = Buffer;

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

const memoryStorage: Record<string, string> = {};

const ExpoSecureStoreAdapter = {
  // Methods for newer Supabase JS versions
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return typeof window !== 'undefined' ? localStorage.getItem(key) : memoryStorage[key] || null;
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
      else memoryStorage[key] = value;
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
      else delete memoryStorage[key];
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },

  // Fallbacks for older Supabase configurations
  getItemAsync: async (key: string) => {
    if (Platform.OS === 'web') return typeof window !== 'undefined' ? localStorage.getItem(key) : memoryStorage[key] || null;
    return SecureStore.getItemAsync(key);
  },
  setItemAsync: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.setItem(key, value);
      else memoryStorage[key] = value;
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  deleteItemAsync: async (key: string) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') localStorage.removeItem(key);
      else delete memoryStorage[key];
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
