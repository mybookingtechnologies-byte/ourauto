import type { Metadata } from "next";
import { PublicListings } from "@/components/forms/public-listings";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Used Car Marketplace | OurAuto",
  description: "Discover verified used car listings from approved dealers across India.",
};

export default function PublicHomePage(): JSX.Element {
  return (
    <main>
      <Header />
      <PublicListings />
    </main>
  );
}
