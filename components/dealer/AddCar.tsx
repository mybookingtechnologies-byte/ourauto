"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseWhatsappDescription } from "@/lib/whatsappParser";
import { withCsrfHeaders } from "@/lib/csrf-client";
import { pollJobStatus } from "@/lib/jobs/pollClient";

type DuplicateListing = {
  id: string;
  title: string;
  price: number;
  city: string;
};

type DuplicateState = {
  score: number;
  listing: DuplicateListing | null;
};

type EditablePreview = {
  title: string;
  price: string;
  fuel: string;
  km: string;
  owner: string;
  insurance: string;
  transmission: "Manual" | "Automatic";
  colour: string;
  remarks: string;
};

const fuelOptions = ["Petrol", "Diesel", "CNG", "Electric", "Hybrid"];
const ownerOptions = ["1st", "2nd", "3rd", "4th+"];
const insuranceOptions = ["None", "Third Party", "Full Insurance", "Running"];

const statusBadgeClasses: Record<"pending" | "processing" | "completed" | "failed", string> = {
  pending:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  processing:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/20 dark:text-blue-300",
  completed:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
  failed:
    "border-red-300 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300",
};

const statusBadgeLabel: Record<"pending" | "processing" | "completed" | "failed", string> = {
  pending: "Pending",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

function sanitizeDigits(value: string) {
  return value.replace(/[^\d]/g, "");
}

function normalizeFuel(value: string) {
  const clean = value.trim().toLowerCase();
  const option = fuelOptions.find((item) => item.toLowerCase() === clean);
  return option || "Petrol";
}

function normalizeInsurance(parsedInsurance: string, sourceDescription: string) {
  if (parsedInsurance === "Third Party") {
    return "Third Party";
  }

  if (parsedInsurance === "Full" || /\b(till|valid|expiry|exp)\b/i.test(sourceDescription)) {
    return "Full Insurance";
  }

  if (/\brunning\b/i.test(sourceDescription)) {
    return "Running";
  }

  return "None";
}

function asInteger(value: string) {
  const normalized = Number(value.replace(/[^\d]/g, ""));
  return Number.isFinite(normalized) ? normalized : NaN;
}

function formatPrice(value: number | null) {
  if (!value || value <= 0) {
    return "-";
  }

  return new Intl.NumberFormat("en-IN").format(value);
}

export default function AddCar() {
  const activePollAbort = useRef<AbortController | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [photoWarning, setPhotoWarning] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState("");
  const [duplicateState, setDuplicateState] = useState<DuplicateState>({ score: 0, listing: null });
  const [editablePreview, setEditablePreview] = useState<EditablePreview>({
    title: "",
    price: "",
    fuel: "Petrol",
    km: "",
    owner: "1st",
    insurance: "None",
    transmission: "Manual",
    colour: "",
    remarks: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [mediaJobStatus, setMediaJobStatus] = useState<"" | "pending" | "processing" | "completed" | "failed">("");

  useEffect(() => {
    return () => {
      activePollAbort.current?.abort();
    };
  }, []);

  const parsed = useMemo(() => parseWhatsappDescription(description), [description]);

  const openPreviewIfValid = useCallback(() => {
    if (photos.length < 3) {
      setError("Please upload at least 3 photos");
      setShowPreview(false);
      return;
    }

    if (photos.length > 10) {
      setError("Maximum 10 photos allowed");
      setShowPreview(false);
      return;
    }

    if (!description || description.trim() === "") {
      setError("Please paste the car description");
      setShowPreview(false);
      return;
    }

    setError("");
    setShowPreview(true);
  }, [description, photos]);

  useEffect(() => {
    if (!description.trim() && photos.length === 0) {
      setShowPreview(false);
      return;
    }

    openPreviewIfValid();
  }, [description, photos, openPreviewIfValid]);

  const onPhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextPhotos = Array.from(event.target.files || []);
    if (nextPhotos.length > 10) {
      setPhotoWarning("Maximum 10 photos allowed");
      setPhotos(nextPhotos.slice(0, 10));
      return;
    }

    setPhotoWarning("");
    setPhotos(nextPhotos);
    setDuplicateState({ score: 0, listing: null });
  };

  const resetForm = () => {
    setPhotos([]);
    setImages([]);
    setMainPhotoIndex(0);
    setDescription("");
    setCity("");
    setShowPreview(false);
    setDuplicateState({ score: 0, listing: null });
    setMediaJobStatus("");
  };

  useEffect(() => {
    if (!showPreview) {
      return;
    }

    setEditablePreview({
      title: parsed.title || "",
      price: parsed.price ? String(parsed.price) : "",
      fuel: normalizeFuel(parsed.fuel || ""),
      km: sanitizeDigits(parsed.km || ""),
      owner: ownerOptions.includes(parsed.owner) ? parsed.owner : "1st",
      insurance: normalizeInsurance(parsed.insuranceType || "", description),
      transmission: parsed.transmission || "Manual",
      colour: parsed.colour || "",
      remarks: parsed.remarks || "",
    });
  }, [showPreview, parsed, description]);

  useEffect(() => {
    if (!showPreview) {
      return;
    }

    if (!parsed.title || !parsed.price || !city.trim() || photos.length < 1) {
      setDuplicateState({ score: 0, listing: null });
      return;
    }

    const firstImage = photos[0];
    const duplicatePayload = new FormData();
    duplicatePayload.append("title", parsed.title);
    duplicatePayload.append("price", String(parsed.price));
    duplicatePayload.append("city", city.trim());
    duplicatePayload.append("plateNumber", parsed.regNo || "");
    duplicatePayload.append("firstImage", firstImage);

    let cancelled = false;
    setIsCheckingDuplicate(true);

    fetch("/api/listings/duplicate-check", {
      method: "POST",
      headers: Object.fromEntries(withCsrfHeaders().entries()),
      body: duplicatePayload,
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || cancelled) {
          return;
        }

        const listing = data?.data?.duplicateListing && typeof data.data.duplicateListing === "object"
          ? {
              id: String(data.data.duplicateListing.id || ""),
              title: String(data.data.duplicateListing.title || ""),
              price: Number(data.data.duplicateListing.price || 0),
              city: String(data.data.duplicateListing.city || ""),
            }
          : null;

        setDuplicateState({
          score: Number(data?.data?.duplicateScore) || 0,
          listing,
        });
      })
      .catch(() => {
        if (!cancelled) {
          setDuplicateState({ score: 0, listing: null });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCheckingDuplicate(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [showPreview, parsed.title, parsed.price, parsed.regNo, city, photos]);

  const onPostListing = async () => {
    setMessage("");
    setError("");
    setDuplicateWarning("");

    if (photos.length < 3) {
      setError("Minimum 3 photos are required");
      return;
    }

    if (photos.length > 10) {
      setError("Maximum 10 photos are allowed");
      return;
    }

    if (!description.trim()) {
      setError("Paste WhatsApp description first");
      return;
    }

    const kmValue = asInteger(editablePreview.km);
    const normalizedPrice = Number(sanitizeDigits(editablePreview.price));

    if (!editablePreview.title.trim() || Number.isNaN(normalizedPrice) || normalizedPrice <= 0 || !city.trim()) {
      setError("Parsed title, parsed price and city are required");
      return;
    }

    setIsUploading(true);

    try {
      const uploadPayload = new FormData();
      photos.forEach((photo) => uploadPayload.append("images", photo));

      const uploadResponse = await fetch("/api/listings/upload", {
        method: "POST",
        headers: Object.fromEntries(withCsrfHeaders().entries()),
        body: uploadPayload,
      });

      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) {
        setError(uploadData.error || "Unable to upload photos");
        return;
      }

      const uploadedImages: string[] = Array.isArray(uploadData?.data?.images) ? uploadData.data.images : [];
      const mediaAnalysisJobId = typeof uploadData?.data?.jobId === "string" ? uploadData.data.jobId : "";
      const apiMainPhotoIndex = Number(uploadData?.data?.mainPhotoIndex);
      const normalizedMainPhotoIndex = Number.isInteger(apiMainPhotoIndex)
        && apiMainPhotoIndex >= 0
        && apiMainPhotoIndex < uploadedImages.length
        ? apiMainPhotoIndex
        : 0;
      const firstImageHash = typeof uploadData?.data?.firstImageHash === "string" ? uploadData.data.firstImageHash : "";

      setImages(uploadedImages);
      setMainPhotoIndex(normalizedMainPhotoIndex);

      if (mediaAnalysisJobId) {
        setMediaJobStatus("pending");
        activePollAbort.current?.abort();
        const abortController = new AbortController();
        activePollAbort.current = abortController;

        void pollJobStatus(mediaAnalysisJobId, {
          intervalMs: 1500,
          timeoutMs: 120_000,
          signal: abortController.signal,
          onUpdate: (state) => {
            setMediaJobStatus(state.status);
            if (state.status === "failed") {
              setDuplicateWarning("Photo analysis job failed. You can continue using the listing.");
            }
          },
        }).catch(() => {
          setMediaJobStatus("");
          // no-op: polling is best effort and should never block listing creation
        });
      } else {
        setMediaJobStatus("");
      }

      if (uploadedImages.length < 3) {
        setError("Minimum 3 uploaded photos are required");
        return;
      }

      const orderedUploadedImages = [...uploadedImages];
      if (normalizedMainPhotoIndex > 0) {
        const [mainImage] = orderedUploadedImages.splice(normalizedMainPhotoIndex, 1);
        if (mainImage) {
          orderedUploadedImages.unshift(mainImage);
        }
      }

      setIsUploading(false);
      setIsSubmitting(true);

      const response = await fetch("/api/listings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify({
          title: editablePreview.title.trim(),
          description: description.trim(),
          city: city.trim(),
          price: normalizedPrice,
          fuel: editablePreview.fuel || null,
          km: Number.isNaN(kmValue) ? null : kmValue,
          owner: editablePreview.owner || null,
          colour: editablePreview.colour.trim() || null,
          transmission: editablePreview.transmission,
          insuranceType:
            editablePreview.insurance === "None"
              ? null
              : editablePreview.insurance === "Full Insurance"
                ? "Full"
                : editablePreview.insurance,
          insuranceTill: parsed.insuranceTill || null,
          remarks: editablePreview.remarks.trim() || null,
          images: orderedUploadedImages,
          plateNumber: parsed.regNo || null,
          imageHash: firstImageHash || null,
          boostType: "NORMAL",
          status: "LIVE",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to create listing");
        return;
      }

      if (data?.data?.duplicateWarning) {
        setDuplicateWarning(data.data.duplicateMessage || "Possible duplicate listing");
      }

      setMessage("Listing posted successfully and is now LIVE.");
      resetForm();
    } catch {
      setError("Unable to post listing");
    } finally {
      setIsUploading(false);
      setIsSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Add Car</h2>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Upload photos, paste WhatsApp description and post in seconds.
        </p>

        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-800/60">
          <div className="flex items-center gap-4">
            <div className="w-56 shrink-0">
              <label className="inline-flex cursor-pointer items-center rounded-xl border px-4 py-2 text-sm font-medium hover:bg-neutral-800 dark:border-zinc-600 dark:text-zinc-100">
                + Upload Photos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={onPhotoChange}
                />
              </label>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Minimum 3, Maximum 10 photos</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">First photo should clearly show number plate</p>
              <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">Selected: {photos.length}</p>
              {images.length > 0 ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Auto main photo: #{mainPhotoIndex + 1}</p>
              ) : null}
              {photoWarning ? (
                <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">{photoWarning}</p>
              ) : null}
            </div>

            <div className="w-full">
              <textarea
                id="whatsapp-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={8}
                placeholder={"Paste WhatsApp car details like this:\n\nReg.No :- GJ-13\nYear :- 2019\nMake :- Hyundai\nModel :- i10 Grand\nVersion :- Sportz\nTransmission :- Manual\nFuel :- Petrol\nColour :- Grey\nOwner :- 1st\nInsurance :- Running\nKM :- 71500\nPrice :- 450000 Negotiable"}
                className="w-full min-h-[160px] rounded-xl border border-neutral-700 bg-neutral-900 p-4 text-sm text-zinc-100 outline-none placeholder:text-neutral-400"
              />
            </div>

            <div className="self-end">
              <button
                type="button"
                onClick={openPreviewIfValid}
                className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-yellow)] text-xl font-semibold text-black"
                aria-label="Open preview"
              >
                →
              </button>
            </div>
          </div>
        </div>

        {error ? <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p> : null}
        {duplicateWarning ? (
          <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">{duplicateWarning}</p>
        ) : null}
        {message ? <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{message}</p> : null}
        {mediaJobStatus ? (
          <div className="mt-2 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <span>Photo analysis status:</span>
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
                statusBadgeClasses[mediaJobStatus],
              ].join(" ")}
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-80"
                aria-hidden="true"
              />
              {statusBadgeLabel[mediaJobStatus]}
            </span>
          </div>
        ) : null}

        {showPreview ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/50 px-4">
            <div className="w-full max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Auto Preview Popup</h3>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className="rounded-lg border border-zinc-200 px-3 py-1 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Close
                </button>
              </div>

              <div className="space-y-2 text-sm text-zinc-700 dark:text-zinc-200">
                <div className="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
                  <h4 className="mb-4 text-base font-semibold text-zinc-100">Auto Preview</h4>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <label className="text-xs text-zinc-300">
                      Title
                      <input
                        type="text"
                        value={editablePreview.title}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, title: event.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      />
                    </label>

                    <label className="text-xs text-zinc-300">
                      Price
                      <input
                        type="number"
                        value={editablePreview.price}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, price: sanitizeDigits(event.target.value) }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      />
                    </label>

                    <label className="text-xs text-zinc-300">
                      Fuel
                      <select
                        value={editablePreview.fuel}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, fuel: event.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      >
                        {fuelOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs text-zinc-300">
                      KM
                      <input
                        type="number"
                        value={editablePreview.km}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, km: sanitizeDigits(event.target.value) }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      />
                    </label>

                    <label className="text-xs text-zinc-300">
                      Owner
                      <select
                        value={editablePreview.owner}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, owner: event.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      >
                        {ownerOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs text-zinc-300">
                      Insurance
                      <select
                        value={editablePreview.insurance}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, insurance: event.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      >
                        {insuranceOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="text-xs text-zinc-300">
                      Transmission
                      <select
                        value={editablePreview.transmission}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({
                            ...prev,
                            transmission: event.target.value === "Automatic" ? "Automatic" : "Manual",
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      >
                        <option value="Manual">Manual</option>
                        <option value="Automatic">Automatic</option>
                      </select>
                    </label>

                    <label className="text-xs text-zinc-300">
                      Colour
                      <input
                        type="text"
                        value={editablePreview.colour}
                        onChange={(event) =>
                          setEditablePreview((prev) => ({ ...prev, colour: event.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block text-xs text-zinc-300">
                    Remarks
                    <textarea
                      rows={4}
                      value={editablePreview.remarks}
                      onChange={(event) =>
                        setEditablePreview((prev) => ({ ...prev, remarks: event.target.value }))
                      }
                      className="mt-1 w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-zinc-100"
                    />
                  </label>

                  <p className="mt-2 text-xs text-zinc-400">Final Price Preview: ₹{formatPrice(Number(editablePreview.price) || null)}</p>
                </div>
              </div>

              {isCheckingDuplicate ? (
                <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/60 dark:text-zinc-300">
                  Checking duplicate listing...
                </div>
              ) : null}

              {duplicateState.score >= 60 && duplicateState.listing ? (
                <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                  <p className="font-semibold">⚠ Possible duplicate car detected</p>
                  <p className="mt-1">Existing listing:</p>
                  <p className="mt-1">{duplicateState.listing.title}</p>
                  <p>Price: ₹{formatPrice(duplicateState.listing.price)}</p>
                  <p>City: {duplicateState.listing.city}</p>
                  <p className="mt-1">Duplicate score: {duplicateState.score}</p>
                  <p className="mt-2">Do you still want to post?</p>
                </div>
              ) : null}

              <div className="mt-5 flex justify-end gap-2">
                {duplicateState.score >= 60 ? (
                  <button
                    type="button"
                    onClick={() => setShowPreview(false)}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={onPostListing}
                  disabled={isSubmitting || isUploading || isCheckingDuplicate}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-yellow)] text-xl font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Post listing"
                >
                  {isSubmitting || isUploading ? "…" : "→"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </article>
    </section>
  );
}