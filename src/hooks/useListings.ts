import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchListings, ListingUploadPayload, uploadListing } from '../api/listings';

export const LISTINGS_QUERY_KEY = ['listings'];

export const useListings = () => {
  return useQuery({
    queryKey: LISTINGS_QUERY_KEY,
    queryFn: fetchListings,
  });
};

export const useUploadListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ListingUploadPayload) => uploadListing(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: LISTINGS_QUERY_KEY });
    },
  });
};
