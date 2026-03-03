"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function DealerSettingsPage(): JSX.Element {
  const [dealerName, setDealerName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [bio, setBio] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [uploadingProfileImage, setUploadingProfileImage] = useState(false);
  const [uploadingCoverImage, setUploadingCoverImage] = useState(false);

  useEffect(() => {
    const load = async (): Promise<void> => {
      const response = await fetch("/api/dealer/profile");
      if (!response.ok) return;
      const data = (await response.json()) as {
        user?: {
          dealerName?: string | null;
          businessName?: string | null;
          city?: string | null;
          profileImage?: string | null;
          coverImage?: string | null;
          bio?: string | null;
        };
      };
      setDealerName(data.user?.dealerName || "");
      setBusinessName(data.user?.businessName || "");
      setCity(data.user?.city || "");
      setProfileImage(data.user?.profileImage || "");
      setCoverImage(data.user?.coverImage || "");
      setBio(data.user?.bio || "");
    };
    void load();
  }, []);

  async function handleUpload(file: File, type: "profile" | "cover"): Promise<void> {
    if (type === "profile") {
      setUploadingProfileImage(true);
    } else {
      setUploadingCoverImage(true);
    }
    setProfileMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/dealer/profile/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setProfileMessage(data.error || "Image upload failed");
        return;
      }

      if (type === "profile") {
        setProfileImage(data.url);
      } else {
        setCoverImage(data.url);
      }
    } finally {
      if (type === "profile") {
        setUploadingProfileImage(false);
      } else {
        setUploadingCoverImage(false);
      }
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Dealer Settings</h1>
      <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold">Profile Settings</h2>
        <Input aria-label="Dealer name" placeholder="Dealer Name" value={dealerName} onChange={(event) => setDealerName(event.target.value)} />
        <Input aria-label="Business name" placeholder="Business Name" value={businessName} onChange={(event) => setBusinessName(event.target.value)} />
        <Input aria-label="City" placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />

        <div className="space-y-2">
          <label className="text-sm font-medium">Profile Photo</label>
          <Input
            aria-label="Profile photo upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void handleUpload(file, "profile");
            }}
          />
          {profileImage ? <Image src={profileImage} alt="Profile preview" width={80} height={80} className="h-20 w-20 rounded-full object-cover" /> : null}
          {uploadingProfileImage ? <p className="text-xs text-zinc-500">Uploading profile photo...</p> : null}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Cover Photo</label>
          <Input
            aria-label="Cover photo upload"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void handleUpload(file, "cover");
            }}
          />
          {coverImage ? <Image src={coverImage} alt="Cover preview" width={1200} height={96} className="h-24 w-full rounded-xl object-cover" /> : null}
          {uploadingCoverImage ? <p className="text-xs text-zinc-500">Uploading cover photo...</p> : null}
        </div>

        <Textarea aria-label="Dealer bio" placeholder="Bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={4} maxLength={500} />

        <Button
          onClick={async () => {
            setSavingProfile(true);
            setProfileMessage("");
            const response = await fetch("/api/dealer/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dealerName, businessName, city, profileImage, coverImage, bio }),
            });
            setSavingProfile(false);
            setProfileMessage(response.ok ? "Profile saved" : "Failed to save profile");
          }}
          disabled={savingProfile || uploadingProfileImage || uploadingCoverImage}
        >
          {savingProfile ? "Saving..." : "Save"}
        </Button>
        {profileMessage ? <p className="text-sm text-zinc-500">{profileMessage}</p> : null}
      </div>

      <div className="mt-6 space-y-3 rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <Input aria-label="Current password" placeholder="Current Password" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        <Input aria-label="New password" placeholder="New Password" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
        <Button
          onClick={async () => {
            await fetch("/api/dealer/profile", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ currentPassword, newPassword }),
            });
            setCurrentPassword("");
            setNewPassword("");
          }}
        >
          Change Password
        </Button>
      </div>
    </main>
  );
}
