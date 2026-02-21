import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000091",
};

export const metadata: Metadata = {
  title: "RDVPriority.fr — Prendre RDV Préfecture | Alertes Créneaux en Temps Réel",
  description:
    "Prenez votre RDV préfecture en 24h ! Surveillance automatique 24/7 de 101 préfectures. Alertes instantanées dès qu'un créneau se libère. Titre de séjour, naturalisation, visa.",
  keywords: [
    "prendre rdv préfecture",
    "rdv préfecture",
    "rendez-vous préfecture",
    "créneau préfecture",
    "urgence rdv préfecture",
    "alerte préfecture",
    "titre de séjour rdv",
    "naturalisation préfecture",
    "visa préfecture",
    "préfecture france",
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "RDVPriority",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={inter.variable}>
      <body className="font-sans antialiased overscroll-none">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
