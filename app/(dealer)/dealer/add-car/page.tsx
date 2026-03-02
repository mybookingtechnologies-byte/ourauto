"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseWhatsappDetails } from "@/lib/validators";

type MediaItem = { url: string; order: number };

export default function AddCarPage(): JSX.Element {
  const router = useRouter();
  const [whatsappText, setWhatsappText] = useState("");
  const [title, setTitle] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [km, setKm] = useState("");
  const [fuel, setFuel] = useState("PETROL");
  const [ownerCount, setOwnerCount] = useState("1");
  const [price, setPrice] = useState("");
  const [city, setCity] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([{ url: "", order: 0 }]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Add Car</h1>
      <div className="grid gap-6 rounded-2xl bg-bgSecondary p-6 shadow-lg">
        <Textarea
          placeholder="Paste WhatsApp Car Details"
          value={whatsappText}
          onChange={(event) => setWhatsappText(event.target.value)}
        />
        <Button
          type="button"
          onClick={() => {
            const parsed = parseWhatsappDetails(whatsappText);
            if (parsed.brand) setBrand(parsed.brand);
            if (parsed.model) setModel(parsed.model);
            if (parsed.year) setYear(String(parsed.year));
            if (parsed.km) setKm(String(parsed.km));
            if (parsed.fuel) setFuel(parsed.fuel);
            if (parsed.ownerCount !== undefined) setOwnerCount(String(parsed.ownerCount));
            if (parsed.price) setPrice(String(parsed.price));
            if (parsed.city) setCity(parsed.city);
          }}
        >
          Parse Details
        </Button>

        <Input placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} />
        <Input placeholder="Brand" value={brand} onChange={(event) => setBrand(event.target.value)} />
        <Input placeholder="Model" value={model} onChange={(event) => setModel(event.target.value)} />
        <Input placeholder="Year" value={year} onChange={(event) => setYear(event.target.value)} />
        <Input placeholder="KM" value={km} onChange={(event) => setKm(event.target.value)} />
        <Select value={fuel} onChange={(event) => setFuel(event.target.value)}>
          <option value="PETROL">PETROL</option>
          <option value="DIESEL">DIESEL</option>
          <option value="CNG">CNG</option>
          <option value="ELECTRIC">ELECTRIC</option>
          <option value="HYBRID">HYBRID</option>
          <option value="OTHER">OTHER</option>
        </Select>
        <Input placeholder="Owner Count" value={ownerCount} onChange={(event) => setOwnerCount(event.target.value)} />
        <Input placeholder="Price" value={price} onChange={(event) => setPrice(event.target.value)} />
        <Input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
        <Input placeholder="Manual Plate Number (optional)" value={plateNumber} onChange={(event) => setPlateNumber(event.target.value)} />

        <div className="space-y-2">
          <h2 className="font-semibold">Image URLs (First image is main)</h2>
          {media.map((item, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder={`Image URL ${index + 1}`}
                value={item.url}
                onChange={(event) => {
                  const next = [...media];
                  next[index] = { ...next[index], url: event.target.value };
                  setMedia(next);
                }}
              />
              {index > 0 ? (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    const next = media.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i }));
                    setMedia(next);
                  }}
                >
                  Remove
                </Button>
              ) : (
                <span className="rounded-2xl bg-accent px-3 py-2 text-sm font-semibold text-black">Main</span>
              )}
              {index > 0 ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const next = [...media];
                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                    setMedia(next.map((m, i) => ({ ...m, order: i })));
                  }}
                >
                  Up
                </Button>
              ) : null}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setMedia([...media, { url: "", order: media.length }])}>Add Image</Button>
        </div>

        <Button
          onClick={async () => {
            await fetch("/api/dealer/cars", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title,
                brand,
                model,
                year,
                km,
                fuel,
                ownerCount,
                price,
                city,
                plateNumber,
                media: media.filter((item) => item.url.trim().length > 0).map((item, index) => ({ ...item, order: index })),
              }),
            });
            router.push("/dealer");
          }}
        >
          Submit Car
        </Button>
      </div>
    </main>
  );
}
