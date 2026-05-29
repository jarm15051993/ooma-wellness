import type { Metadata } from "next";
import { Playfair_Display, Jost } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
  weight: ["400", "500"],
});

const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500"],
});

export const metadata: Metadata = {
  title: "OOMA Wellness Club — Tortosa",
  description: "Movimiento consciente. Bienestar real. Comunidad. Pilates Reformer y Yoga en Tortosa, Terres de l'Ebre.",
  verification: {
    google: "a0mkXEiEArC3niOmqgtiOqFzAdEKrHOv5FnDvRGDO_4",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${playfair.variable} ${jost.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
