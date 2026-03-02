"use client";

import type { ChangeEvent, JSX } from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  carId: string | null;
  onClose: () => void;
}

export function InquiryModal({ carId, onClose }: Props) {
  const [form, setForm] = useState({ name: "", mobile: "", message: "" });
  const [loading, setLoading] = useState(false);

  if (!carId) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
      <Card className="w-full max-w-md bg-bgPrimary">
        <h3 className="mb-4 text-lg font-semibold">Send Inquiry</h3>
        <div className="space-y-3">
          <Input placeholder="Name" value={form.name} onChange={(event: ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: event.target.value })} />
          <Input placeholder="Mobile" value={form.mobile} onChange={(event: ChangeEvent<HTMLInputElement>) => setForm({ ...form, mobile: event.target.value })} />
          <Textarea placeholder="Message" value={form.message} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, message: event.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button
              onClick={async (): Promise<void> => {
                setLoading(true);
                await fetch("/api/inquiry", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ carId, ...form }),
                });
                setLoading(false);
                onClose();
              }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Submit"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
