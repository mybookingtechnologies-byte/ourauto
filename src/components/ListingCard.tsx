import { Image, Pressable, StyleSheet, Text, View, useColorScheme } from 'react-native';

import { Listing } from '../api/listings';
import { getTheme } from '../utils/constants';

type ListingCardProps = {
  listing: Listing;
  onPress: () => void;
};

const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export const ListingCard = ({ listing, onPress }: ListingCardProps) => {
  const theme = getTheme(useColorScheme());
  const imageUri = listing.images[0];

  return (
    <Pressable
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          shadowColor: theme.cardShadow,
        },
      ]}
      onPress={onPress}
    >
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder, { backgroundColor: theme.border }]}>
          <Text style={{ color: theme.mutedText }}>No image</Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {listing.title}
        </Text>
        <Text style={[styles.price, { color: theme.primary }]}>{currency.format(listing.price || 0)}</Text>
        <Text style={[styles.meta, { color: theme.mutedText }]} numberOfLines={1}>
          {listing.location}
        </Text>
        <Text style={[styles.meta, { color: theme.mutedText }]} numberOfLines={1}>
          Dealer: {listing.dealerName}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 180,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 14,
    gap: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  price: {
    fontSize: 18,
    fontWeight: '700',
  },
  meta: {
    fontSize: 13,
  },
});
