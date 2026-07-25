import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Kinetic — Calisthenics progress, together",
    short_name: "Kinetic",
    description:
      "Track calisthenics workouts, skills, goals, and consistency with a trusted partner.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#eaf5ff",
    theme_color: "#1677ff",
    orientation: "portrait-primary",
    categories: ["fitness", "health", "lifestyle"],
    icons: [
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "any",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
