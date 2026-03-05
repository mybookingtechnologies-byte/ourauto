import { useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View, Image, Pressable, useColorScheme } from 'react-native';

import { Loading } from '../../components/Loading';
import { useListings } from '../../hooks/useListings';
import { getTheme } from '../../utils/constants';

type ListingDetailsScreenProps = {
  listingId: string;
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const ListingDetailsScreen = ({ listingId }: ListingDetailsScreenProps) => {
  const { data, isLoading, error } = useListings();
  const theme = getTheme(useColorScheme());

  const listing = useMemo(() => {
    return (data ?? []).find((entry) => entry.id === listingId);
  }, [data, listingId]);

  if (isLoading) {
    return <Loading />;
  }

  if (error || !listing) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.background }]}>
        <Text style={[styles.message, { color: theme.text }]}>Listing not available right now.</Text>
      </View>
    );
  }

  const onContact = async () => {
    const phone = listing.dealerPhone?.trim();

    if (phone) {
      const url = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return;
      }
    }

    if (listing.dealerEmail) {
      await Linking.openURL(`mailto:${listing.dealerEmail}`);
      return;
    }

    Alert.alert('Contact unavailable', 'Dealer contact details are not available for this listing.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
        {listing.images.length > 0 ? (
          listing.images.map((uri) => <Image key={uri} source={{ uri }} style={styles.image} />)
        ) : (
          <View style={[styles.image, styles.imagePlaceholder, { backgroundColor: theme.border }]}>
            <Text style={{ color: theme.mutedText }}>No images</Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>{listing.title}</Text>
        <Text style={[styles.price, { color: theme.primary }]}>{currency.format(listing.price || 0)}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Location: {listing.location}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Brand: {listing.brand || '-'}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Model: {listing.model || '-'}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Year: {listing.year || '-'}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Fuel: {listing.fuelType || '-'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Dealer</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Name: {listing.dealerName || '-'}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Phone: {listing.dealerPhone || '-'}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>Email: {listing.dealerEmail || '-'}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]}>{listing.description || 'No description provided.'}</Text>
      </View>

      <Pressable style={[styles.contactButton, { backgroundColor: theme.primary }]} onPress={onContact}>
        <Text style={styles.contactText}>Contact Dealer</Text>
      </Pressable>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
  },
  imageRow: {
    padding: 16,
    gap: 12,
  },
  image: {
    width: 290,
    height: 190,
    borderRadius: 14,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 14,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  price: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  meta: {
    fontSize: 14,
    lineHeight: 20,
  },
  contactButton: {
    marginHorizontal: 16,
    marginBottom: 28,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  contactText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
