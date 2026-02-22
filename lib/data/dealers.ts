import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Dealer } from "@/types/domain";

const demoDealer: Dealer = {
  id: "dealer-1",
  name: "Prime Wheels",
  city: "Bengaluru",
  state: "Karnataka",
  profilePhotoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
  coverImageUrl: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7",
  badge: "Pro",
  rating: 4.6,
  totalListings: 122,
  soldRatio: 0.42,
  responseTimeMinutes: 12,
};

export async function getDealerById(dealerId: string) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("dealers")
      .select("*")
      .eq("id", dealerId)
      .single();

    if (error || !data) return null;

    const dealer: Dealer = {
      id: String(data.id),
      name: String(data.name),
      city: String(data.city),
      state: String(data.state),
      profilePhotoUrl: data.profile_photo_url ? String(data.profile_photo_url) : null,
      coverImageUrl: data.cover_image_url ? String(data.cover_image_url) : null,
      badge: data.badge as Dealer["badge"],
      rating: Number(data.rating ?? 0),
      totalListings: Number(data.total_listings ?? 0),
      soldRatio: Number(data.sold_ratio ?? 0),
      responseTimeMinutes: Number(data.response_time_minutes ?? 0),
    };

    return dealer;
  } catch {
    return demoDealer;
  }
}