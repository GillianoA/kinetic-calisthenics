import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DemoReadOnlyBoundary } from "@/components/demo/demo-read-only-boundary";
import { currentUser } from "@/lib/demo-data";

export const metadata: Metadata = {
  title: {
    default: "Interactive demo",
    template: "%s · Kinetic demo",
  },
  description:
    "Explore Kinetic's private calisthenics tracking, progress, and accountability experience with realistic sample data.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell
      basePath="/demo"
      readOnly
      user={{
        name: currentUser.displayName,
        initials: currentUser.initials,
        email: "Preview account",
      }}
    >
      <DemoReadOnlyBoundary>{children}</DemoReadOnlyBoundary>
    </AppShell>
  );
}
