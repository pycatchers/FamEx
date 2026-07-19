import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Modal, Dimensions, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView, Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImageManipulator from 'expo-image-manipulator';
import Icon from '@react-native-vector-icons/ionicons';

interface PhotoCropEditorProps {
  visible: boolean;
  imageUri: string | null;
  onCancel: () => void;
  onConfirm: (resultUri: string) => void;
}

const MIN_CROP_SIZE = 60;
const BOX_PADDING = 16;
const BOX_MAX_HEIGHT_RATIO = 0.55;

function clamp(value: number, min: number, max: number) {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

export default function PhotoCropEditor({ visible, imageUri, onCancel, onConfirm }: PhotoCropEditorProps) {
  const insets = useSafeAreaInsets();
  const [currentUri, setCurrentUri] = useState<string | null>(imageUri);
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const left = useSharedValue(0);
  const top = useSharedValue(0);
  const right = useSharedValue(0);
  const bottom = useSharedValue(0);

  const window = Dimensions.get('window');
  const boxMaxWidth = window.width - BOX_PADDING * 2;
  const boxMaxHeight = window.height * BOX_MAX_HEIGHT_RATIO;

  let displayWidth = boxMaxWidth;
  let displayHeight = boxMaxHeight;
  if (naturalSize) {
    const aspect = naturalSize.width / naturalSize.height;
    displayWidth = boxMaxWidth;
    displayHeight = displayWidth / aspect;
    if (displayHeight > boxMaxHeight) {
      displayHeight = boxMaxHeight;
      displayWidth = displayHeight * aspect;
    }
  }

  // Reset state and (re-)load natural dimensions whenever the editor is opened with an image.
  // Keyed on [visible, imageUri] rather than on currentUri, so reopening with the exact same
  // uri (e.g. cancel then re-pick the same photo) still re-triggers this — a currentUri-keyed
  // effect would silently no-op since setCurrentUri(imageUri) wouldn't change the value.
  useEffect(() => {
    if (!visible || !imageUri) return;
    setCurrentUri(imageUri);
    setNaturalSize(null);
    let cancelled = false;
    Image.getSize(
      imageUri,
      (width, height) => {
        if (cancelled) return;
        setNaturalSize({ width, height });
      },
      () => {},
    );
    return () => { cancelled = true; };
  }, [visible, imageUri]);

  useEffect(() => {
    if (!naturalSize) return;
    left.value = 0;
    top.value = 0;
    right.value = displayWidth;
    bottom.value = displayHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [naturalSize, displayWidth, displayHeight]);

  const rotate = async () => {
    if (!currentUri || isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ rotate: 90 }],
        { format: ImageManipulator.SaveFormat.JPEG },
      );
      setCurrentUri(result.uri);
      setNaturalSize({ width: result.width, height: result.height });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirm = async () => {
    if (!currentUri || !naturalSize || isProcessing) return;
    const cropLeft = left.value;
    const cropTop = top.value;
    const cropRight = right.value;
    const cropBottom = bottom.value;

    const isFullBounds = cropLeft <= 0 && cropTop <= 0 && cropRight >= displayWidth && cropBottom >= displayHeight;
    if (isFullBounds) {
      onConfirm(currentUri);
      return;
    }

    setIsProcessing(true);
    try {
      const scaleX = naturalSize.width / displayWidth;
      const scaleY = naturalSize.height / displayHeight;
      const originX = Math.round(cropLeft * scaleX);
      const originY = Math.round(cropTop * scaleY);
      const width = Math.round((cropRight - cropLeft) * scaleX);
      const height = Math.round((cropBottom - cropTop) * scaleY);

      const result = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ crop: { originX, originY, width, height } }],
        { format: ImageManipulator.SaveFormat.JPEG },
      );
      onConfirm(result.uri);
    } finally {
      setIsProcessing(false);
    }
  };

  const panTopLeft = Gesture.Pan().onChange((e) => {
    left.value = clamp(left.value + e.changeX, 0, right.value - MIN_CROP_SIZE);
    top.value = clamp(top.value + e.changeY, 0, bottom.value - MIN_CROP_SIZE);
  });
  const panTopRight = Gesture.Pan().onChange((e) => {
    right.value = clamp(right.value + e.changeX, left.value + MIN_CROP_SIZE, displayWidth);
    top.value = clamp(top.value + e.changeY, 0, bottom.value - MIN_CROP_SIZE);
  });
  const panBottomLeft = Gesture.Pan().onChange((e) => {
    left.value = clamp(left.value + e.changeX, 0, right.value - MIN_CROP_SIZE);
    bottom.value = clamp(bottom.value + e.changeY, top.value + MIN_CROP_SIZE, displayHeight);
  });
  const panBottomRight = Gesture.Pan().onChange((e) => {
    right.value = clamp(right.value + e.changeX, left.value + MIN_CROP_SIZE, displayWidth);
    bottom.value = clamp(bottom.value + e.changeY, top.value + MIN_CROP_SIZE, displayHeight);
  });

  const cropRectStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: left.value,
    top: top.value,
    width: right.value - left.value,
    height: bottom.value - top.value,
    borderWidth: 2,
    borderColor: '#2563eb',
  }));

  const useHandleStyle = (edgeX: 'left' | 'right', edgeY: 'top' | 'bottom') =>
    useAnimatedStyle(() => ({
      position: 'absolute',
      left: (edgeX === 'left' ? left.value : right.value) - 14,
      top: (edgeY === 'top' ? top.value : bottom.value) - 14,
    }));

  const tlHandleStyle = useHandleStyle('left', 'top');
  const trHandleStyle = useHandleStyle('right', 'top');
  const blHandleStyle = useHandleStyle('left', 'bottom');
  const brHandleStyle = useHandleStyle('right', 'bottom');

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onCancel} statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <View style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-3">
            <TouchableOpacity onPress={onCancel} disabled={isProcessing}>
              <Text className="text-white text-base">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-white text-base font-semibold">Adjust Photo</Text>
            <TouchableOpacity onPress={confirm} disabled={isProcessing || !naturalSize}>
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text className="text-primary-400 text-base font-semibold">Done</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Crop area */}
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            {currentUri && naturalSize ? (
              <View style={{ width: displayWidth, height: displayHeight }}>
                <Image
                  source={{ uri: currentUri }}
                  style={{ width: displayWidth, height: displayHeight }}
                  resizeMode="contain"
                />
                <Animated.View style={cropRectStyle} pointerEvents="none" />
                <GestureDetector gesture={panTopLeft}>
                  <Animated.View style={tlHandleStyle}>
                    <View className="w-7 h-7 rounded-full bg-primary-600 border-2 border-white" />
                  </Animated.View>
                </GestureDetector>
                <GestureDetector gesture={panTopRight}>
                  <Animated.View style={trHandleStyle}>
                    <View className="w-7 h-7 rounded-full bg-primary-600 border-2 border-white" />
                  </Animated.View>
                </GestureDetector>
                <GestureDetector gesture={panBottomLeft}>
                  <Animated.View style={blHandleStyle}>
                    <View className="w-7 h-7 rounded-full bg-primary-600 border-2 border-white" />
                  </Animated.View>
                </GestureDetector>
                <GestureDetector gesture={panBottomRight}>
                  <Animated.View style={brHandleStyle}>
                    <View className="w-7 h-7 rounded-full bg-primary-600 border-2 border-white" />
                  </Animated.View>
                </GestureDetector>
              </View>
            ) : (
              <ActivityIndicator size="large" color="#fff" />
            )}
          </View>

          <Text className="text-gray-400 text-center text-xs mb-2 px-6">
            Drag the corner handles to crop. Use rotate to fix orientation.
          </Text>

          {/* Footer actions */}
          <View className="flex-row items-center justify-center py-4">
            <TouchableOpacity
              className="flex-row items-center bg-white/10 rounded-full px-5 py-3"
              onPress={rotate}
              disabled={isProcessing}
            >
              <Icon name="reload" size={20} color="#fff" />
              <Text className="text-white font-medium ml-2">Rotate</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
}
