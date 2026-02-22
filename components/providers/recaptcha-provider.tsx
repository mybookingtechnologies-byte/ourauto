"use client";

import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";

export default function RecaptchaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

  if (!siteKey) {
    return <>{children}</>; // Fail safe — don't block UI
  }

  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={siteKey}
      scriptProps={{ async: true, defer: true }}
    >
      {children}
    </GoogleReCaptchaProvider>
  );
}
