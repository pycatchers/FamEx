import { Stack } from 'expo-router';

export default function InsuranceLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Insurance' }} />
      <Stack.Screen name="add" options={{ title: 'Add Policy' }} />
      <Stack.Screen name="[id]" options={{ title: 'Policy Details' }} />
    </Stack>
  );
}
