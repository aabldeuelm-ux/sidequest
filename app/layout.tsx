import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navigation } from "@/components/Navigation";
import { OnboardingGuard } from "@/components/OnboardingGuard";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SideQuest | Your Life Operating System",
  description: "A premium life dashboard to track memories, sleep, grass, decisions, and time capsules.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                if (theme === 'light') {
                  document.documentElement.classList.add('light');
                } else {
                  document.documentElement.classList.remove('light');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-200">
        <OnboardingGuard>
          <div className="flex-1 flex flex-col md:flex-row min-h-screen">
            <Navigation />
            <main className="flex-1 md:pl-64 pb-20 md:pb-8 px-4 md:px-8 py-6 max-w-7xl mx-auto w-full">
              {children}
            </main>
          </div>
        </OnboardingGuard>
      </body>
    </html>
  );
}
