import { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  maximumDate?: Date;
  minimumDate?: Date;
}

export default function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  maximumDate,
  minimumDate,
}: DatePickerFieldProps) {
  const [show, setShow] = useState(false);

  const currentDate = value ? new Date(value + 'T00:00:00') : new Date();

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShow(false);
    }
    if (event.type === 'set' && selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
    if (Platform.OS === 'ios' && event.type === 'dismissed') {
      setShow(false);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}{required ? ' *' : ''}
      </Text>
      <TouchableOpacity
        className="border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-800 flex-row items-center justify-between"
        onPress={() => setShow(true)}
      >
        <Text className={value ? 'text-gray-900 dark:text-white' : 'text-gray-400'}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <Text className="text-gray-400">📅</Text>
      </TouchableOpacity>

      {show && (
        <DateTimePicker
          value={currentDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          maximumDate={maximumDate}
          minimumDate={minimumDate}
        />
      )}

      {Platform.OS === 'ios' && show && (
        <TouchableOpacity
          className="bg-primary-600 rounded-lg py-2 mt-2"
          onPress={() => setShow(false)}
        >
          <Text className="text-white text-center font-semibold">Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
