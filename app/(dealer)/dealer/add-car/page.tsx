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
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
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

  const applyParsedDetails = (sourceText: string): void => {
    const parsed = parseWhatsappDetails(sourceText);
    if (parsed.brand) setBrand(parsed.brand);
    if (parsed.model) setModel(parsed.model);
    if (parsed.year) setYear(String(parsed.year));
    if (parsed.km) setKm(String(parsed.km));
    if (parsed.fuel) setFuel(parsed.fuel);
    if (parsed.ownerCount !== undefined) setOwnerCount(String(parsed.ownerCount));
    if (parsed.price) setPrice(String(parsed.price));
    if (parsed.city) setCity(parsed.city);
  };

  const listingSummary = [brand, model, year].filter(Boolean).join(" ") || "Draft listing";

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="mb-6 text-2xl font-bold">Add Car</h1>

      <div className="space-y-5 rounded-2xl bg-bgSecondary p-4 shadow-lg sm:p-6">
        <div className="message-fade-in flex justify-start">
          <div className="max-w-[90%] rounded-2xl bg-background px-4 py-3 text-sm leading-relaxed sm:max-w-[80%]">
            Start with WhatsApp details or fill fields manually. Use <span className="font-semibold">+</span> to add photos.
          </div>
        </div>

        <div className="message-fade-in flex justify-end">
          <div className="max-w-[90%] rounded-2xl bg-primary/20 px-4 py-3 text-sm leading-relaxed sm:max-w-[80%]">
            {listingSummary}
          </div>
        </div>

        <div className="message-fade-in rounded-2xl bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">WhatsApp Source</h2>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDescriptionDraft(whatsappText);
                setIsDescriptionModalOpen(true);
              }}
            >
              Edit Text
            </Button>
          </div>
          <Textarea
            placeholder="Paste WhatsApp Car Details"
            value={whatsappText}
            onChange={(event) => setWhatsappText(event.target.value)}
            onPaste={(event) => {
              const pasted = event.clipboardData.getData("text");
              if (!pasted.trim()) return;
              setTimeout(() => {
                setDescriptionDraft(pasted);
                setIsDescriptionModalOpen(true);
              }, 0);
            }}
          />
          <div className="mt-3">
            <Button type="button" onClick={() => applyParsedDetails(whatsappText)}>
              Parse Details
            </Button>
          </div>
        </div>

        <div className="message-fade-in grid gap-3 rounded-2xl bg-background p-4 md:grid-cols-2">
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
        </div>

        <div className="message-fade-in rounded-2xl bg-background p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold">Photos</h2>
            <button
              type="button"
              aria-label="Add photo"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-xl font-semibold text-black shadow-md"
              onClick={() => setIsPhotoModalOpen(true)}
            >
              +
            </button>
          </div>

          <div className="space-y-2.5">
            {media.map((item, index) => (
              <div key={index} className="message-fade-in flex flex-col gap-2 sm:flex-row">
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
                    className="sm:self-start"
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
                    className="sm:self-start"
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
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 border-t border-white/10 bg-bgSecondary/95 px-4 py-3 shadow-lg backdrop-blur-sm sm:-mx-6 sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-end">
            <Button
              className="w-full sm:w-auto"
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
        </div>
      </div>

      {isPhotoModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="message-fade-in w-full max-w-lg rounded-2xl bg-background p-5">
            <h2 className="mb-3 text-lg font-semibold">Add Photo URL</h2>
            <Input placeholder="https://..." value={newPhotoUrl} onChange={(event) => setNewPhotoUrl(event.target.value)} />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPhotoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (newPhotoUrl.trim().length === 0) return;
                  if (media.length === 1 && media[0].url.trim().length === 0) {
                    setMedia([{ url: newPhotoUrl.trim(), order: 0 }]);
                  } else {
                    setMedia([...media, { url: newPhotoUrl.trim(), order: media.length }]);
                  }
                  setNewPhotoUrl("");
                  setIsPhotoModalOpen(false);
                }}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDescriptionModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="message-fade-in w-full max-w-2xl rounded-2xl bg-background p-5">
            <h2 className="mb-3 text-lg font-semibold">Edit WhatsApp Description</h2>
            <Textarea
              value={descriptionDraft}
              onChange={(event) => setDescriptionDraft(event.target.value)}
              className="min-h-[220px]"
            />
            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDescriptionModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setWhatsappText(descriptionDraft);
                  applyParsedDetails(descriptionDraft);
                  setIsDescriptionModalOpen(false);
                }}
              >
                Save & Parse
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <style jsx>{`
        .message-fade-in {
          animation: messageFadeIn 240ms ease-out;
        }

        @keyframes messageFadeIn {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </main>
  );
}
