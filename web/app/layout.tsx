import type { Metadata } from "next";
import { Golos_Text } from "next/font/google";
import "./globals.css";

const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-golos",
});

export const metadata: Metadata = {
  title: "Phuket Unit Benchmark",
  description: "Сравнение юнита с рынком Phuket off-plan / ready",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={golos.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
