"use client";

import Script from "next/script";
import { useEffect, useId, useMemo, useRef } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark";
        }
      ) => number;
      reset: (widgetId?: number) => void;
    };
  }
}

export function RecaptchaWidget({
  onToken,
  theme = "light",
}: {
  onToken: (token: string) => void;
  theme?: "light" | "dark";
}) {
  const id = useId().replace(/:/g, "_");
  const elementId = `recaptcha_${id}`;
  const widgetRef = useRef<number | null>(null);
  const siteKey = useMemo(() => process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "", []);

  useEffect(() => {
    if (!siteKey) {
      onToken("");
      return;
    }

    const interval = setInterval(() => {
      if (!window.grecaptcha || widgetRef.current !== null) {
        return;
      }
      widgetRef.current = window.grecaptcha.render(elementId, {
        sitekey: siteKey,
        callback: onToken,
        "expired-callback": () => onToken(""),
        theme,
      });
    }, 150);

    return () => {
      clearInterval(interval);
      if (window.grecaptcha && widgetRef.current !== null) {
        window.grecaptcha.reset(widgetRef.current);
      }
    };
  }, [elementId, onToken, siteKey, theme]);

  return (
    <>
      <Script src="https://www.google.com/recaptcha/api.js?render=explicit" strategy="afterInteractive" />
      <div id={elementId} />
    </>
  );
}