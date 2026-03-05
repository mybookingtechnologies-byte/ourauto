import { useLocalSearchParams } from 'expo-router';

import { ListingDetailsScreen } from '../../../src/screens/marketplace/ListingDetailsScreen';

export default function ListingDetailsRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return null;
  }

  return <ListingDetailsScreen listingId={id} />;
}
