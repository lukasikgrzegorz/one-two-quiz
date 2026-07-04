import type { Metadata } from "next";
import { Dancing_Script, Geist, Oswald, Source_Serif_4 } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  title: "RaspdwaQUIZ",
  description: "Lekka aplikacja do quizów na żywo — jak Kahoot",
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  display: "swap",
  subsets: ["latin"],
});

const raspFont = Dancing_Script({
  variable: "--font-rasp",
  display: "swap",
  subsets: ["latin"],
  weight: "700",
});

const dwaFont = Source_Serif_4({
  variable: "--font-dwa",
  display: "swap",
  subsets: ["latin"],
  weight: "400",
});

const quizFont = Oswald({
  variable: "--font-quiz",
  display: "swap",
  subsets: ["latin"],
  weight: "700",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" suppressHydrationWarning>
      <body
        className={`${geistSans.className} ${raspFont.variable} ${dwaFont.variable} ${quizFont.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
