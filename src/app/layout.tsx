import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { GlobalDialogs } from "@/components/command/GlobalDialogs";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Nexus",
  description: "Q's Activity Dashboard for PJ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${dmSans.variable}`}>
      <body className={`${dmSans.className} antialiased`}>
        <KeyboardShortcutsProvider>
          <div className="flex h-screen bg-background">
            <Sidebar />
            <main className="flex-1 overflow-auto md:ml-0">
              {children}
            </main>
          </div>
          <CommandPalette />
          <GlobalDialogs />
          <KeyboardShortcuts />
        </KeyboardShortcutsProvider>
      </body>
    </html>
  );
}
