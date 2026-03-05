import { Stack } from 'expo-router';

export default function DealerLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Dealer' }} />
      <Stack.Screen name="upload" options={{ title: 'Upload Listing' }} />
    </Stack>
  );
}
