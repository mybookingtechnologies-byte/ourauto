import { apiClient } from './client';

export type Listing = {
  id: string;
  title: string;
  price: number;
  location: string;
  dealerName: string;
  description?: string;
  brand?: string;
  model?: string;
  year?: number;
  fuelType?: string;
  images: string[];
  dealerPhone?: string;
  dealerEmail?: string;
};

export type ListingUploadPayload = {
  title: string;
  price: string;
  brand: string;
  model: string;
  year: string;
  fuelType: string;
  location: string;
  description: string;
  images: string[];
};

type ListingResponse = Listing[] | { listings?: Listing[]; data?: Listing[] };

const asArray = (payload: ListingResponse): Listing[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  return payload.listings ?? payload.data ?? [];
};

const normalizeImage = (item: unknown): string | null => {
  if (typeof item === 'string') {
    return item;
  }

  if (item && typeof item === 'object') {
    const candidate = item as { url?: string; image?: string };
    return candidate.url ?? candidate.image ?? null;
  }

  return null;
};

const normalizeListing = (listing: Partial<Listing> & Record<string, unknown>): Listing => {
  const imagesRaw = (listing.images as unknown[]) ?? (listing.imageUrls as unknown[]) ?? [];

  return {
    id: String(listing.id ?? listing._id ?? ''),
    title: String(listing.title ?? ''),
    price: Number(listing.price ?? 0),
    location: String(listing.location ?? 'Unknown'),
    dealerName: String(listing.dealerName ?? listing.dealer ?? 'Dealer'),
    description: typeof listing.description === 'string' ? listing.description : '',
    brand: typeof listing.brand === 'string' ? listing.brand : '',
    model: typeof listing.model === 'string' ? listing.model : '',
    year: Number(listing.year ?? 0) || undefined,
    fuelType: typeof listing.fuelType === 'string' ? listing.fuelType : '',
    images: imagesRaw.map(normalizeImage).filter((value): value is string => Boolean(value)),
    dealerPhone: typeof listing.dealerPhone === 'string' ? listing.dealerPhone : '',
    dealerEmail: typeof listing.dealerEmail === 'string' ? listing.dealerEmail : '',
  };
};

export const fetchListings = async () => {
  const { data } = await apiClient.get<ListingResponse>('/listings');
  return asArray(data).map((listing) => normalizeListing(listing as Record<string, unknown>));
};

export const uploadListing = async (payload: ListingUploadPayload) => {
  const formData = new FormData();

  formData.append('title', payload.title);
  formData.append('price', payload.price);
  formData.append('brand', payload.brand);
  formData.append('model', payload.model);
  formData.append('year', payload.year);
  formData.append('fuelType', payload.fuelType);
  formData.append('location', payload.location);
  formData.append('description', payload.description);

  payload.images.forEach((uri, index) => {
    const extension = uri.split('.').pop() ?? 'jpg';
    formData.append('images', {
      uri,
      name: `listing-${index}.${extension}`,
      type: `image/${extension.toLowerCase()}`,
    } as unknown as Blob);
  });

  await apiClient.post('/listings/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};
