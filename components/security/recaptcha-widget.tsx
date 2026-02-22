"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    grecaptcha?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
        }
      ) => number;
      reset?: (widgetId?: number) => void;
    };
  }
}

export function RecaptchaWidget({
  siteKey,
  onToken,
}: {
  siteKey?: string;
  onToken: (token: string) => void;
}) {
  const widgetRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<number | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const resolvedSiteKey = siteKey ?? process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

  useEffect(() => {
    try {
      if (!scriptLoaded) {
        return;
      }
      if (!resolvedSiteKey) {
        return;
      }
      if (typeof window === "undefined") {
        return;
      }
      if (!widgetRef.current) {
        return;
      }
      if (widgetIdRef.current !== null) {
        return;
      }
      const grecaptcha = window.grecaptcha;
      if (!grecaptcha) {
        return;
      }
      if (typeof grecaptcha.render !== "function") {
        return;
      }

      widgetIdRef.current = grecaptcha.render(widgetRef.current, {
        sitekey: resolvedSiteKey,
        callback: (token: string) => {
          onToken(token);
        },
        "expired-callback": () => {
          onToken("");
        },
      });
    } catch {
      return;
    }
  }, [onToken, resolvedSiteKey, scriptLoaded]);

  useEffect(() => {
    return () => {
      try {
        if (typeof window === "undefined") {
          return;
        }
        const grecaptcha = window.grecaptcha;
        if (!grecaptcha) {
          return;
        }
        if (typeof grecaptcha.reset !== "function") {
          return;
        }
        if (widgetIdRef.current === null) {
          return;
        }
        grecaptcha.reset(widgetIdRef.current);
      } catch {
        return;
      }
    };
  }, []);

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            setScriptLoaded(true);
          } catch {
            return;
          }
        }}
        onError={() => {
          try {
            setScriptLoaded(false);
          } catch {
            return;
          }
        }}
      />
      <div ref={widgetRef} />
    </>
  );
}