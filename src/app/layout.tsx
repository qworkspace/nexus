import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { GlobalDialogs } from "@/components/command/GlobalDialogs";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        <KeyboardShortcutsProvider>
          <div className="flex h-screen bg-white dark:bg-zinc-950">
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
