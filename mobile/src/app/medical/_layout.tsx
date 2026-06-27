import { Stack } from 'expo-router';

export default function MedicalLayout() {
  return (
    <Stack>
      <Stack.Screen name="hospitals" options={{ title: 'Hospitals' }} />
      <Stack.Screen name="doctors" options={{ title: 'Doctors' }} />
      <Stack.Screen name="medicines" options={{ title: 'Medicines' }} />
      <Stack.Screen name="prescriptions" options={{ title: 'Prescriptions' }} />
      <Stack.Screen name="add-prescription" options={{ title: 'Add Prescription' }} />
      <Stack.Screen name="add-visit" options={{ title: 'Add Hospital Visit' }} />
      <Stack.Screen name="prescription-detail" options={{ title: 'Prescription Details' }} />
    </Stack>
  );
}
