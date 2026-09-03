import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "../context/auth-context";

export const metadata: Metadata = {
  title: "Performance Reporting System",
  description:
    "Executive Performance Management and Reporting System — Balanced Scorecard based performance evaluation",
  icons: {
    icon: "/favicon.ico",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
