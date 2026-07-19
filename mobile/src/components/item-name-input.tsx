import { useEffect, useRef, useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { useItemNameSuggestions } from '@/hooks/queries/use-shopping';

interface ItemNameInputProps {
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  className: string;
  placeholderTextColor?: string;
}

const SUGGESTIONS_DEBOUNCE_MS = 300;

// Text input with a below-field dropdown of previously-used item names, to speed up manual entry.
export default function ItemNameInput({
  value, onChangeText, onBlur, placeholder = 'Item name', className, placeholderTextColor = '#9ca3af',
}: ItemNameInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const blurTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), SUGGESTIONS_DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [value]);

  const { data: suggestions } = useItemNameSuggestions(debouncedValue);

  const showSuggestions = isFocused && debouncedValue.trim().length >= 2 && !!suggestions?.length;

  const handleBlur = () => {
    // Delay hiding so a tap on a suggestion registers before the dropdown unmounts.
    blurTimeout.current = setTimeout(() => setIsFocused(false), 150);
    onBlur?.();
  };

  const selectSuggestion = (name: string) => {
    if (blurTimeout.current) clearTimeout(blurTimeout.current);
    onChangeText(name);
    setIsFocused(false);
  };

  return (
    <View style={{ position: 'relative', flex: 1 }}>
      <TextInput
        className={className}
        placeholder={placeholder}
        placeholderTextColor={placeholderTextColor}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
      />
      {showSuggestions && (
        <View
          className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg mt-1 shadow-sm"
          style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20 }}
        >
          {suggestions!.map((name) => (
            <TouchableOpacity
              key={name}
              className="px-3 py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              onPress={() => selectSuggestion(name)}
            >
              <Text className="text-gray-900 dark:text-white text-sm">{name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
