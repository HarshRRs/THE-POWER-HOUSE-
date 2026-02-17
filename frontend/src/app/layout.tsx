import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RDVPriority.fr — Alertes Créneaux Préfecture en Temps Réel",
  description:
    "Surveillance automatique 24/7 de 101 préfectures françaises. Recevez une alerte instantanée dès qu'un créneau se libère pour votre titre de séjour, naturalisation ou visa.",
  keywords: [
    "rdv préfecture",
    "rendez-vous préfecture",
    "titre de séjour",
    "naturalisation",
    "créneau préfecture",
    "alerte préfecture",
    "France visa",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
