import { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Icon from '@react-native-vector-icons/ionicons';
import { uploadBillPhoto } from '@/lib/image-upload';
import { useAuth } from '@/providers/auth-provider';
import PhotoCropEditor from '@/components/photo-crop-editor';

interface BillPhotoFieldProps {
  imageUrl: string | null;
  onChange: (url: string) => void;
  onError?: (error: Error) => void;
  onPressImage?: () => void;
}

export default function BillPhotoField({ imageUrl, onChange, onError, onPressImage }: BillPhotoFieldProps) {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [pendingUri, setPendingUri] = useState<string | null>(null);

  const uploadFinal = async (uri: string) => {
    if (!user) {
      Alert.alert('Error', 'You are signed out. Please sign in again and retry.');
      return;
    }
    setIsUploading(true);
    try {
      const url = await uploadBillPhoto(uri, user.id);
      onChange(url);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to upload photo.');
      onError?.(err);
    } finally {
      setIsUploading(false);
    }
  };

  const pick = async (useCamera: boolean) => {
    if (!user) {
      Alert.alert('Error', 'You are signed out. Please sign in again and retry.');
      return;
    }
    const perm = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission Required', 'Please grant access.'); return; }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    setPendingUri(result.assets[0].uri);
  };

  const showOptions = () => {
    Alert.alert(imageUrl ? 'Replace Photo' : 'Attach Photo', undefined, [
      { text: 'Camera', onPress: () => pick(true) },
      { text: 'Gallery', onPress: () => pick(false) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View className="mb-4">
      {imageUrl ? (
        <TouchableOpacity onPress={onPressImage} disabled={!onPressImage} activeOpacity={onPressImage ? 0.7 : 1}>
          <Image source={{ uri: imageUrl }} className="w-full h-40 rounded-xl mb-2" resizeMode="cover" />
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity
        className="flex-row items-center justify-center bg-white dark:bg-gray-800 rounded-lg py-3 border border-gray-200 dark:border-gray-700"
        onPress={showOptions}
        disabled={isUploading}
      >
        {isUploading ? (
          <ActivityIndicator size="small" color="#2563eb" />
        ) : (
          <>
            <Icon name="camera-outline" size={18} color="#2563eb" />
            <Text className="text-primary-600 dark:text-primary-400 font-medium ml-2">
              {imageUrl ? 'Replace Photo' : 'Attach Bill Photo'}
            </Text>
          </>
        )}
      </TouchableOpacity>

      <PhotoCropEditor
        visible={!!pendingUri}
        imageUri={pendingUri}
        onCancel={() => setPendingUri(null)}
        onConfirm={(resultUri) => {
          setPendingUri(null);
          uploadFinal(resultUri);
        }}
      />
    </View>
  );
}
