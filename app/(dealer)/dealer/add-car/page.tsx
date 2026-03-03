"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { parseWhatsappDetails } from "@/lib/validators";

type MediaItem = { url: string; order: number };
type ChatMessage = { id: number; role: "user" | "system"; text: string };

type CarForm = {
  title: string;
  brand: string;
  model: string;
  year: string;
  km: string;
  fuel: string;
  ownerCount: string;
  price: string;
  city: string;
  description: string;
};

const initialForm: CarForm = {
  title: "",
  brand: "",
  model: "",
  year: "",
  km: "",
  fuel: "PETROL",
  ownerCount: "1",
  price: "",
  city: "",
  description: "",
};

export default function AddCarPage(): JSX.Element {
  const router = useRouter();
  const [whatsappText, setWhatsappText] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "system", text: "Paste your WhatsApp car details and press Send." },
    { id: 2, role: "system", text: "Use + to add photos before confirming save." },
  ]);
  const [form, setForm] = useState<CarForm>(initialForm);
  const [formDraft, setFormDraft] = useState<CarForm>(initialForm);
  const [plateNumber] = useState("");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [newPhotoUrl, setNewPhotoUrl] = useState("");
  const [media, setMedia] = useState<MediaItem[]>([{ url: "", order: 0 }]);

  const pushMessage = (role: "user" | "system", text: string): void => {
    setMessages((prev) => [...prev, { id: Date.now() + prev.length, role, text }]);
  };

  const applyParsedDetails = (sourceText: string): CarForm => {
    const parsed = parseWhatsappDetails(sourceText);
    const next: CarForm = {
      ...form,
      title: form.title || [parsed.brand, parsed.model, parsed.year].filter(Boolean).join(" "),
      brand: parsed.brand || form.brand,
      model: parsed.model || form.model,
      year: parsed.year ? String(parsed.year) : form.year,
      km: parsed.km ? String(parsed.km) : form.km,
      fuel: parsed.fuel || form.fuel,
      ownerCount: parsed.ownerCount !== undefined ? String(parsed.ownerCount) : form.ownerCount,
      price: parsed.price ? String(parsed.price) : form.price,
      city: parsed.city || form.city,
      description: sourceText.trim(),
    };

    setFormDraft(next);
    return next;
  };

  const normalizedMedia = media.filter((item) => item.url.trim().length > 0).map((item, index) => ({ ...item, order: index }));

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex h-14 w-full max-w-2xl items-center px-4">
          <h1 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">Add Car</h1>
        </div>
      </div>

      <section className="mx-auto flex h-[calc(100vh-56px)] w-full max-w-2xl flex-col">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-yellow-500 text-black"
                    : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}

          {normalizedMedia.length > 0 ? (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                {normalizedMedia.length} photo{normalizedMedia.length > 1 ? "s" : ""} ready to submit.
              </div>
            </div>
          ) : null}
        </div>

        <div className="sticky bottom-0 border-t border-zinc-200 bg-white px-3 py-3 shadow-lg backdrop-blur dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex w-full items-end gap-2">
            <button
              type="button"
              aria-label="Add photos"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-yellow-500 text-xl font-semibold text-black"
              onClick={() => setIsPhotoModalOpen(true)}
            >
              +
            </button>

            <Textarea
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Paste WhatsApp car details"
              className="min-h-[44px] max-h-28 resize-none"
            />

            <Button
              type="button"
              onClick={() => {
                const value = chatInput.trim();
                if (!value) return;
                setWhatsappText(value);
                pushMessage("user", value);
                applyParsedDetails(value);
                setIsDetailsModalOpen(true);
                setChatInput("");
              }}
            >
              Send
            </Button>
          </div>
        </div>
      </section>

      {isPhotoModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            <h2 className="mb-3 text-lg font-semibold">Photo Upload</h2>

            <div className="flex gap-2">
              <Input placeholder="https://image-url" value={newPhotoUrl} onChange={(event) => setNewPhotoUrl(event.target.value)} />
              <Button
                type="button"
                onClick={() => {
                  const nextUrl = newPhotoUrl.trim();
                  if (!nextUrl) return;
                  if (media.length === 1 && media[0].url.trim().length === 0) {
                    setMedia([{ url: nextUrl, order: 0 }]);
                  } else {
                    setMedia((prev) => [...prev, { url: nextUrl, order: prev.length }]);
                  }
                  setNewPhotoUrl("");
                }}
              >
                Add URL
              </Button>
            </div>

            <label className="mt-3 block text-sm text-zinc-900 dark:text-zinc-100">Or upload images</label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                if (files.length === 0) return;
                files.forEach((file) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    const dataUrl = String(reader.result || "");
                    if (!dataUrl) return;
                    setMedia((prev) => {
                      if (prev.length === 1 && prev[0].url.trim().length === 0) {
                        return [{ url: dataUrl, order: 0 }];
                      }
                      return [...prev, { url: dataUrl, order: prev.length }];
                    });
                  };
                  reader.readAsDataURL(file);
                });
                event.target.value = "";
              }}
            />

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {normalizedMedia.length > 0 ? (
                normalizedMedia.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="rounded-xl border border-zinc-200 p-2 dark:border-zinc-800">
                    <img src={item.url} alt={`Car media ${index + 1}`} className="h-20 w-full rounded-lg object-cover" />
                    <div className="mt-2 flex gap-1">
                      <Button
                        type="button"
                        variant={index === 0 ? "default" : "outline"}
                        className="h-8 flex-1 px-2 text-xs"
                        onClick={() => {
                          if (index === 0) return;
                          const next = [...normalizedMedia];
                          const [selected] = next.splice(index, 1);
                          next.unshift(selected);
                          setMedia(next.map((m, i) => ({ ...m, order: i })));
                        }}
                      >
                        {index === 0 ? "Main" : "Set Main"}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-8 px-2 text-xs"
                        onClick={() => {
                          const next = normalizedMedia.filter((_, i) => i !== index).map((m, i) => ({ ...m, order: i }));
                          setMedia(next.length > 0 ? next : [{ url: "", order: 0 }]);
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-100">
                  No photos added yet.
                </div>
              )}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPhotoModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const count = normalizedMedia.length;
                  if (count > 0) pushMessage("system", `${count} photos added 📸`);
                  setIsPhotoModalOpen(false);
                }}
              >
                Save Photos
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDetailsModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
            <h2 className="mb-3 text-lg font-semibold">Review Parsed Details</h2>

            <div className="grid gap-2">
              <Input placeholder="Title" value={formDraft.title} onChange={(event) => setFormDraft((prev) => ({ ...prev, title: event.target.value }))} />
              <Input placeholder="Brand" value={formDraft.brand} onChange={(event) => setFormDraft((prev) => ({ ...prev, brand: event.target.value }))} />
              <Input placeholder="Model" value={formDraft.model} onChange={(event) => setFormDraft((prev) => ({ ...prev, model: event.target.value }))} />
              <Input placeholder="Year" value={formDraft.year} onChange={(event) => setFormDraft((prev) => ({ ...prev, year: event.target.value }))} />
              <Input placeholder="KM" value={formDraft.km} onChange={(event) => setFormDraft((prev) => ({ ...prev, km: event.target.value }))} />
              <Select value={formDraft.fuel} onChange={(event) => setFormDraft((prev) => ({ ...prev, fuel: event.target.value }))}>
                <option value="PETROL">PETROL</option>
                <option value="DIESEL">DIESEL</option>
                <option value="CNG">CNG</option>
                <option value="ELECTRIC">ELECTRIC</option>
                <option value="HYBRID">HYBRID</option>
                <option value="OTHER">OTHER</option>
              </Select>
              <Input placeholder="Owners" value={formDraft.ownerCount} onChange={(event) => setFormDraft((prev) => ({ ...prev, ownerCount: event.target.value }))} />
              <Input placeholder="Price" value={formDraft.price} onChange={(event) => setFormDraft((prev) => ({ ...prev, price: event.target.value }))} />
              <Input placeholder="City" value={formDraft.city} onChange={(event) => setFormDraft((prev) => ({ ...prev, city: event.target.value }))} />
              <Textarea
                placeholder="Description"
                value={formDraft.description}
                onChange={(event) => setFormDraft((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-[110px]"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDetailsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  const title = formDraft.title || [formDraft.brand, formDraft.model, formDraft.year].filter(Boolean).join(" ") || "Draft listing";
                  const payloadMedia = media.filter((item) => item.url.trim().length > 0).map((item, index) => ({ ...item, order: index }));

                  setForm({ ...formDraft, title });
                  setWhatsappText(formDraft.description || whatsappText);

                  await fetch("/api/dealer/cars", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      title,
                      brand: formDraft.brand,
                      model: formDraft.model,
                      year: formDraft.year,
                      km: formDraft.km,
                      fuel: formDraft.fuel,
                      ownerCount: formDraft.ownerCount,
                      price: formDraft.price,
                      city: formDraft.city,
                      plateNumber,
                      media: payloadMedia,
                    }),
                  });

                  pushMessage("system", "Car details saved ✅");
                  setIsDetailsModalOpen(false);
                  setTimeout(() => router.push("/dealer"), 700);
                }}
              >
                Confirm & Save
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
