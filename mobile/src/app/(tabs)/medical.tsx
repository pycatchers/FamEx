import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Icon from 'react-native-vector-icons/Ionicons';
import { useActiveMedicines } from '@/hooks/queries/use-medical';

export default function MedicalScreen() {
  const router = useRouter();
  const { data: activeMeds } = useActiveMedicines();

  const menuItems = [
    { title: 'Hospitals', icon: 'business-outline', route: '/medical/hospitals', color: '#dc2626' },
    { title: 'Doctors', icon: 'person-outline', route: '/medical/doctors', color: '#2563eb' },
    { title: 'Prescriptions', icon: 'document-text-outline', route: '/medical/prescriptions', color: '#7c3aed' },
    { title: 'Medicines', icon: 'medical-outline', route: '/medical/medicines', color: '#059669' },
  ];

  const getTimeSlotMeds = (slot: 'morning' | 'afternoon' | 'night') =>
    activeMeds?.filter(m => m[slot]) || [];

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-gray-900">
      <View className="p-4">
        {/* Today's Medicines */}
        {activeMeds && activeMeds.length > 0 && (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-4 shadow-sm">
            <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Today's Medicines
            </Text>
            {(['morning', 'afternoon', 'night'] as const).map(slot => {
              const meds = getTimeSlotMeds(slot);
              if (!meds.length) return null;
              return (
                <View key={slot} className="mb-3">
                  <View className="flex-row items-center mb-1">
                    <Icon
                      name={slot === 'morning' ? 'sunny-outline' : slot === 'afternoon' ? 'partly-sunny-outline' : 'moon-outline'}
                      size={16}
                      color="#6b7280"
                    />
                    <Text className="text-gray-500 dark:text-gray-400 text-sm ml-1 capitalize">{slot}</Text>
                  </View>
                  {meds.map(med => (
                    <View key={med.id} className="ml-5 py-1">
                      <Text className="text-gray-900 dark:text-white">{med.name}</Text>
                      <Text className="text-gray-400 dark:text-gray-500 text-xs">
                        {[med.dosage, med.timing?.replace('_', ' ')].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>
        )}

        {/* Menu Grid */}
        <View className="flex-row flex-wrap gap-3">
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.title}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
              style={{ width: '47%' }}
              onPress={() => router.push(item.route as any)}
            >
              <View className="w-10 h-10 rounded-full justify-center items-center mb-2" style={{ backgroundColor: `${item.color}15` }}>
                <Icon name={item.icon} size={22} color={item.color} />
              </View>
              <Text className="text-gray-900 dark:text-white font-semibold">{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}
