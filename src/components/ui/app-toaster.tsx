"use client";

import { Toaster } from "sonner";

export function KineticToaster() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-2xl !border-white/60 !bg-white/90 !shadow-2xl !backdrop-blur-2xl dark:!border-white/10 dark:!bg-[#102039]/92",
          title: "!text-slate-950 dark:!text-white",
          description: "!text-slate-500 dark:!text-slate-300",
        },
      }}
    />
  );
}

