import "@/styles/globals.css";

import { Montserrat } from "next/font/google";
import { ReactNode } from "react";

import Providers from "./providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={montserrat.variable}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
