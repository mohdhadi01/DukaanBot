import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "DukaanBot — WhatsApp Chatbot Builder for Small Shops",
  description: "No-code WhatsApp auto-reply & order management for kirana stores, tailors, tutors and small businesses. Set up your menu, design your flow, take orders on WhatsApp.",
  keywords: ["WhatsApp", "chatbot", "kirana", "small business", "no-code", "India", "WeChat mini-program"],
  authors: [{ name: "DukaanBot" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "DukaanBot — WhatsApp Chatbot Builder for Small Shops",
    description: "No-code WhatsApp auto-reply & order management for small businesses.",
    siteName: "DukaanBot",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="antialiased bg-background text-foreground"
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
