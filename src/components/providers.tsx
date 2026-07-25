"use client";

import { useEffect } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The app remains fully functional when service workers are unavailable.
      });
    }
  }, []);

  return (
    <>
      {children}
      <Toaster
        richColors
        position="top-right"
        toastOptions={{
          className: "!rounded-2xl !border-white/60 !bg-white/85 !shadow-xl !backdrop-blur-xl",
        }}
      />
    </>
  );
}
