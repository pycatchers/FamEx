import { Stack } from 'expo-router';

export default function FamilyLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Family' }} />
      <Stack.Screen name="add" options={{ title: 'Add Family Member' }} />
      <Stack.Screen name="[id]" options={{ title: 'Member Details' }} />
    </Stack>
  );
}
