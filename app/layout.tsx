import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "HargaKu — Hitung HPP UMKM Akurat",
    description: "Bantu UMKM hitung Harga Pokok Produksi (HPP) dan harga jual secara akurat dan efisien.",
    manifest: "/manifest.json",
    themeColor: "#10b981",
    appleWebApp: {
        capable: true,
        statusBarStyle: "default",
        title: "HargaKu",
    },
    viewport: "width=device-width, initial-scale=1, viewport-fit=cover",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="id">
            <body className={inter.className}>
                {children}
            </body>
        </html>
    );
}
