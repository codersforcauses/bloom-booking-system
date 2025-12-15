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
      <body
        className={montserrat.variable}
        // The following attributes are injected by browser extensions.
        // This can cause React hydration warnings. They are safe to ignore or remove.
        data-new-gr-c-s-check-loaded="14.1265.0"
        data-gr-ext-installed=""
        data-gr-ext-disabled="forever"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
