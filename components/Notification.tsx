"use client";

import { useEffect, useState } from "react";

type NotificationType = "success" | "error" | "info";

type NotificationState = {
  message: string;
  type: NotificationType;
  visible: boolean;
};

const HIDE_AFTER_MS = 4000;

let state: NotificationState = {
  message: "",
  type: "info",
  visible: false,
};

const listeners = new Set<(nextState: NotificationState) => void>();
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const emit = () => {
  for (const listener of listeners) {
    listener(state);
  }
};

const show = (type: NotificationType, message: string) => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
  }

  state = {
    message,
    type,
    visible: true,
  };
  emit();

  dismissTimer = setTimeout(() => {
    state = { ...state, visible: false };
    emit();
  }, HIDE_AFTER_MS);
};

export function useNotification() {
  const [notification, setNotification] = useState(state);

  useEffect(() => {
    listeners.add(setNotification);
    return () => {
      listeners.delete(setNotification);
    };
  }, []);

  return {
    ...notification,
    showSuccess: (message: string) => show("success", message),
    showError: (message: string) => show("error", message),
    showInfo: (message: string) => show("info", message),
  };
}

const colorClasses: Record<NotificationType, string> = {
  success:
    "border-green-500 bg-green-50 text-green-900 dark:bg-green-950/60 dark:text-green-100",
  error:
    "border-red-500 bg-red-50 text-red-900 dark:bg-red-950/60 dark:text-red-100",
  info:
    "border-[var(--primary-yellow)] bg-[var(--primary-yellow)]/10 text-[var(--primary-yellow)] dark:bg-[var(--primary-yellow)]/15 dark:text-[var(--primary-yellow)]",
};

export default function Notification() {
  const { message, type, visible } = useNotification();

  return (
    <div className="pointer-events-none fixed right-5 top-5 z-50">
      <div
        className={[
          "w-[320px] rounded-lg border p-4 shadow-lg transition-all duration-300",
          visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
          colorClasses[type],
        ].join(" ")}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  );
}