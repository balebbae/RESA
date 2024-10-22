import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import MainNav from "@/components/MainNav";
import "@/app/styles/style.css";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "RESA",
  description: "Created by Caleb Bae",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased gradient-bg`}
      >
        <nav className="flex flex-col items-center border-b mb-5 px-5 py-3">
          <div className="max-w-6xl w-full ">
            <MainNav />
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
