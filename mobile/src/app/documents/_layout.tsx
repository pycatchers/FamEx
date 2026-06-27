import { Stack } from 'expo-router';

export default function DocumentsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Documents' }} />
      <Stack.Screen name="add" options={{ title: 'Add Document' }} />
      <Stack.Screen name="[id]" options={{ title: 'Document Details' }} />
    </Stack>
  );
}
