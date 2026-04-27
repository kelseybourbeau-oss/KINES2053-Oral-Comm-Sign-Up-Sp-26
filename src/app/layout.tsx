import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Oral Communication Final Scheduler",
  description: "Scheduling system for evaluator availability, student sign-ups, and instructor assignments.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
