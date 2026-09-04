import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FitTrack Pro | Train with intention",
  description: "A focused fitness dashboard for planning workouts, logging sets, and tracking progress.",
};

export const viewport: Viewport = {
  themeColor: "#0b0e0c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
