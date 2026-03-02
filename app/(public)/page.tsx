import { PublicListings } from "@/components/forms/public-listings";
import { Header } from "@/components/layout/header";

export default function PublicHomePage(): JSX.Element {
  return (
    <main>
      <Header />
      <PublicListings />
    </main>
  );
}
