"use client";

import { useState } from "react";
import { CarCard, type PublicCar } from "@/components/cards/car-card";
import { InquiryModal } from "@/components/forms/inquiry-modal";

interface Props {
  cars: PublicCar[];
}

export function DealerCarGrid({ cars }: Props): JSX.Element {
  const [selectedCarId, setSelectedCarId] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {cars.map((car) => (
          <CarCard key={car.id} car={car} onInquire={setSelectedCarId} />
        ))}
      </div>
      <InquiryModal carId={selectedCarId} onClose={() => setSelectedCarId(null)} />
    </>
  );
}
