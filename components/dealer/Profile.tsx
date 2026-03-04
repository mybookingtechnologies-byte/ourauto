"use client";

import { FormEvent, useEffect, useState } from "react";
import { withCsrfHeaders } from "@/lib/csrf-client";

type ProfileForm = {
  dealerName: string;
  phone: string;
  city: string;
  businessAddress: string;
  aboutDealer: string;
};

const initialForm: ProfileForm = {
  dealerName: "",
  phone: "",
  city: "",
  businessAddress: "",
  aboutDealer: "",
};

export default function Profile() {
  const [form, setForm] = useState<ProfileForm>(initialForm);
  const [deleteReason, setDeleteReason] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [sendingDeleteRequest, setSendingDeleteRequest] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/dealer/profile", { signal: controller.signal, cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load profile");
        }

        const data = await response.json();
        setForm({
          dealerName: data?.data?.profile?.dealerName || "",
          phone: data?.data?.profile?.phone || "",
          city: data?.data?.profile?.city || "",
          businessAddress: data?.data?.profile?.businessAddress || "",
          aboutDealer: data?.data?.profile?.aboutDealer || "",
        });
      })
      .catch(() => {
        setForm(initialForm);
      })
      .finally(() => {
        setLoadingProfile(false);
      });

    return () => controller.abort();
  }, []);

  const onChangeField = (field: keyof ProfileForm, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProfileMessage("");
    setSavingProfile(true);

    try {
      const response = await fetch("/api/dealer/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setProfileMessage(data.error || "Unable to update profile");
        return;
      }

      setProfileMessage("Profile updated successfully.");
      setForm({
        dealerName: data?.data?.profile?.dealerName || "",
        phone: data?.data?.profile?.phone || "",
        city: data?.data?.profile?.city || "",
        businessAddress: data?.data?.profile?.businessAddress || "",
        aboutDealer: data?.data?.profile?.aboutDealer || "",
      });
    } catch {
      setProfileMessage("Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDeleteRequest = async () => {
    setDeleteMessage("");
    setSendingDeleteRequest(true);

    try {
      const response = await fetch("/api/dealer/delete-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...Object.fromEntries(withCsrfHeaders().entries()),
        },
        body: JSON.stringify({ reason: deleteReason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteMessage(data.error || "Unable to submit deletion request");
        return;
      }

      setDeleteMessage("Your deletion request has been submitted. Admin will review.");
      setDeleteReason("");
    } catch {
      setDeleteMessage("Unable to submit deletion request");
    } finally {
      setSendingDeleteRequest(false);
    }
  };

  return (
    <section className="space-y-6">
      <article className="rounded-xl border border-zinc-200 bg-white p-6 shadow dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {form.dealerName || "Dealer Profile"}
              </h2>
              <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-semibold text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                Silver
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Verified Dealer Profile</p>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Profile Photo Placeholder
            </div>
            <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
              Cover Photo Placeholder
            </div>
          </div>
        </div>
      </article>

      <form
        className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-200 bg-white p-6 shadow dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-2"
        onSubmit={handleProfileSubmit}
      >
        <div>
          <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="dealer-name">
            Dealer Name
          </label>
          <input
            id="dealer-name"
            value={form.dealerName}
            onChange={(event) => onChangeField("dealerName", event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={loadingProfile || savingProfile}
          />
        </div>
        <div>
          <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="dealer-phone">
            Phone
          </label>
          <input
            id="dealer-phone"
            value={form.phone}
            onChange={(event) => onChangeField("phone", event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={loadingProfile || savingProfile}
          />
        </div>
        <div>
          <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="dealer-city">
            City
          </label>
          <input
            id="dealer-city"
            value={form.city}
            onChange={(event) => onChangeField("city", event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={loadingProfile || savingProfile}
          />
        </div>
        <div>
          <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="dealer-address">
            Business Address
          </label>
          <input
            id="dealer-address"
            value={form.businessAddress}
            onChange={(event) => onChangeField("businessAddress", event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={loadingProfile || savingProfile}
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="dealer-about">
            About Dealer
          </label>
          <textarea
            id="dealer-about"
            rows={4}
            value={form.aboutDealer}
            onChange={(event) => onChangeField("aboutDealer", event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={loadingProfile || savingProfile}
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-zinc-500 dark:text-zinc-400" htmlFor="delete-reason">
            Delete Request Reason
          </label>
          <textarea
            id="delete-reason"
            rows={3}
            value={deleteReason}
            onChange={(event) => setDeleteReason(event.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:ring-2 focus:ring-[var(--primary-yellow)] dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
            disabled={sendingDeleteRequest}
            placeholder="Tell us why you want to request account deletion"
          />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            disabled={loadingProfile || savingProfile}
          >
            {savingProfile ? "Saving..." : "EDIT PROFILE"}
          </button>
          <button
            type="button"
            onClick={handleDeleteRequest}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:text-[var(--primary-yellow)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-yellow)] disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-200"
            disabled={sendingDeleteRequest}
          >
            {sendingDeleteRequest ? "Submitting..." : "REQUEST ACCOUNT DELETE"}
          </button>
        </div>

        {profileMessage ? (
          <p className="md:col-span-2 text-sm text-zinc-600 dark:text-zinc-300">{profileMessage}</p>
        ) : null}
        {deleteMessage ? (
          <p className="md:col-span-2 text-sm text-zinc-600 dark:text-zinc-300">{deleteMessage}</p>
        ) : null}
      </form>
    </section>
  );
}