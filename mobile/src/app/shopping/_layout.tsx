import { Stack } from 'expo-router';

export default function ShoppingLayout() {
  return (
    <Stack>
      <Stack.Screen name="shops" options={{ title: 'Shops' }} />
      <Stack.Screen name="bills" options={{ title: 'Bills' }} />
      <Stack.Screen name="add-bill" options={{ title: 'Add Bill' }} />
      <Stack.Screen name="ocr-bill" options={{ title: 'Scan Bill' }} />
      <Stack.Screen name="voice-bill" options={{ title: 'Voice Entry' }} />
      <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
      <Stack.Screen name="checklist" options={{ title: 'Checklist' }} />
      <Stack.Screen name="checklists" options={{ title: 'Shopping Lists', headerShown: false }} />
      <Stack.Screen name="checklist-detail" options={{ title: 'List', headerShown: false }} />
      <Stack.Screen name="bill-detail" options={{ title: 'Bill Details' }} />
      <Stack.Screen name="edit-bill" options={{ title: 'Edit Bill' }} />
      <Stack.Screen name="shop-detail" options={{ title: 'Shop Details', headerShown: false }} />
    </Stack>
  );
}
