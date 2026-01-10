"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { HiOutlineUser } from "react-icons/hi";

import { cn } from "@/lib/utils";

import { Button } from "./button";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 border-black bg-white">
      <div className="max-w-8xl mx-auto flex items-center justify-between px-12 py-3">
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
              open && "translate-y-1.5 rotate-45",
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
              open && "-translate-y-1.5 -rotate-45",
            )}
          />
        </button>

        {/* desktop */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/">
            <Button variant="outline">Book room</Button>
          </Link>
          <Link href="/bookings">
            <Button variant="text">Find my booking</Button>
          </Link>
          <Link href="/admin">
            <Button variant="login">
              <HiOutlineUser className="h-5 w-5" />
              Admin login
            </Button>
          </Link>
        </div>
      </div>

      {/* mobile hamburger */}
      {open && (
        <div className="absolute left-0 top-full max-h-screen w-full overflow-y-auto bg-white md:hidden">
          <div className="flex h-full flex-col items-end gap-6 px-8 py-6">
            <Link href="/">
              <Button variant="outline">Book room</Button>
            </Link>
            <Link href="/bookings" className="-mx-4 mt-4 hover:text-primary">
              <Button variant="text">Find my booking</Button>
            </Link>
            <div className="-mx-2 mt-20">
              <Link href="/admin">
                <Button variant="login">
                  <HiOutlineUser className="h-5 w-5" />
                  Admin login
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
