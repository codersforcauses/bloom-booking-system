"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "./button";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full border-b bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* logo */}
        <Link href="/" className="text-xl font-semibold">
          <Image src="/logo.png" width={50} height={50} alt="logo" />
        </Link>

        {/* mobile */}
        <button
          className="flex flex-col items-center justify-center space-y-1 md:hidden"
          onClick={() => setOpen(!open)}
        >
          <span
            className={cn(
              "block h-0.5 w-6 bg-black transition-all",
              open && "translate-y-1 rotate-45",
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-6 bg-black transition-all",
              open && "opacity-0",
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-6 bg-black transition-all",
              open && "-translate-y-1 -rotate-45",
            )}
          />
        </button>

        {/* desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className="hover:text-primary">
            <Button variant="outline">Book room</Button>
          </Link>
          <Link href="/bookings" className="hover:text-primary">
            <Button variant="">Find my booking</Button>
          </Link>
          <Link href="/about" className="hover:text-primary">
            <Button variant="login">Admin login</Button>
          </Link>
        </div>
      </div>

      {/* mobile hamburger */}
      {open && (
        <div className="flex flex-col space-y-2 px-4 pb-4 md:hidden">
          <Link href="/" onClick={() => setOpen(false)} className="py-2">
            Home
          </Link>
          <Link
            href="/bookings"
            onClick={() => setOpen(false)}
            className="py-2"
          >
            Bookings
          </Link>
          <Link href="/about" onClick={() => setOpen(false)} className="py-2">
            About
          </Link>
        </div>
      )}
    </nav>
  );
}
