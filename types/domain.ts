export type FuelType = "Petrol" | "Diesel" | "CNG" | "Electric" | "Hybrid";

export type Transmission = "Manual" | "Automatic";

export type OwnerType = "1st" | "2nd" | "3rd+";

export type DealerBadge = "Basic" | "Pro" | "Premium";

export type ListingStatus = "active" | "sold" | "blocked";

export type StoryType = "new_arrival" | "hot_deal" | "sold";

export interface Dealer {
  id: string;
  name: string;
  city: string;
  state: string;
  profilePhotoUrl: string | null;
  coverImageUrl: string | null;
  badge: DealerBadge;
  rating: number;
  totalListings: number;
  soldRatio: number;
  responseTimeMinutes: number;
}

export interface Listing {
  id: string;
  dealerId: string;
  title: string;
  description: string;
  make: string;
  model: string;
  year: number;
  city: string;
  state: string;
  price: number;
  km: number;
  fuelType: FuelType;
  transmission: Transmission;
  ownerType: OwnerType;
  insuranceType: string;
  registrationNumber: string;
  mediaUrls: string[];
  videoUrl: string | null;
  isHotDeal: boolean;
  hotDealExpiresAt: string | null;
  status: ListingStatus;
  createdAt: string;
  views: number;
  chatCount: number;
  callClicks: number;
}

export interface ListingFilters {
  minPrice?: number;
  maxPrice?: number;
  minKm?: number;
  maxKm?: number;
  fuelType?: FuelType;
  transmission?: Transmission;
  ownerType?: OwnerType;
  sort?: "latest" | "price_asc" | "price_desc" | "hot_deals";
  city?: string;
  state?: string;
}

export interface SmartParseResult {
  regNo: string;
  year: number | null;
  make: string;
  transmission: Transmission;
  insurance: string;
  price: number | null;
  km: number | null;
  seoTitle: string;
}

export interface OCRResponse {
  registrationNumber: string | null;
  confidence: number;
}