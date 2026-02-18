import "@/styles/globals.css";

import { Montserrat } from "next/font/google";
import { ReactNode } from "react";

import BreadcrumbLayout from "@/components/breadcrumb-layout";
import Navbar from "@/components/ui/navbar";

import Providers from "./providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.variable} min-h-screen bg-background text-foreground`}
      >
        <Providers>
          <Navbar />
          <BreadcrumbLayout />
          {children}
        </Providers>
      </body>
    </html>
  );
}
