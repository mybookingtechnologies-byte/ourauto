import { useRouter } from 'expo-router';
import { RefreshControl, StyleSheet, Text, View, FlatList, useColorScheme } from 'react-native';

import { Header } from '../../components/Header';
import { ListingCard } from '../../components/ListingCard';
import { Loading } from '../../components/Loading';
import { useListings } from '../../hooks/useListings';
import { getTheme } from '../../utils/constants';

export const MarketplaceScreen = () => {
  const { data, isLoading, error, refetch, isRefetching } = useListings();
  const router = useRouter();
  const theme = getTheme(useColorScheme());

  if (isLoading) {
    return <Loading />;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={data ?? []}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        ListHeaderComponent={<Header title="Marketplace" subtitle="Verified pre-owned cars" />}
        renderItem={({ item }) => (
          <ListingCard listing={item} onPress={() => router.push(`/listing/${item.id}`)} />
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>No listings yet</Text>
            <Text style={[styles.emptySubtitle, { color: theme.mutedText }]}>
              New inventory will appear here.
            </Text>
          </View>
        }
      />

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.error }]}>
          <Text style={styles.errorText}>{error.message}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 40,
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 14,
  },
  errorBanner: {
    margin: 16,
    borderRadius: 12,
    padding: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
