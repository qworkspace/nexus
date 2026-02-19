import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { CommandPalette } from "@/components/command-palette";
import { GlobalDialogs } from "@/components/command/GlobalDialogs";
import { KeyboardShortcuts } from "@/components/KeyboardShortcuts";
import { KeyboardShortcutsProvider } from "@/components/KeyboardShortcutsProvider";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
    <html lang="en">
      <body className={`${spaceGrotesk.className} antialiased`}>
        <KeyboardShortcutsProvider>
          <div className="flex h-screen bg-background weavy-grid">
            <Sidebar />
            <main className="flex-1 overflow-auto md:ml-0 relative z-10">
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
