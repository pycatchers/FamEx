import { Stack } from 'expo-router';

export default function LoansLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Loans' }} />
      <Stack.Screen name="add" options={{ title: 'Add Loan' }} />
      <Stack.Screen name="[id]" options={{ title: 'Loan Details' }} />
    </Stack>
  );
}
