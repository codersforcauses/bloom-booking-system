"use client";

import Image from "next/image";
import Link from "next/link";
import { SetStateAction, useEffect, useState } from "react";
import { HiOutlineUser } from "react-icons/hi";

import { cn } from "@/lib/utils";

import { Button } from "./button";

const NavbarLinks = ({
  loggedIn = false,
  setOpen,
}: {
  loggedIn: boolean;
  setOpen: (bool: boolean) => void;
}) => {
  if (loggedIn) {
    return (
      <>
        <Link href="/dashboard">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Dashboard
          </Button>
        </Link>
        <Link href="/meeting-rooms">
          <Button variant="text" onClick={() => setOpen(false)}>
            Meeting Rooms
          </Button>
        </Link>
        <Link href="/settings">
          <Button variant="login" onClick={() => setOpen(false)}>
            <HiOutlineUser className="h-5 w-5" />
            Settings
          </Button>
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/">
        <Button variant="outline" onClick={() => setOpen(false)}>
          Book room
        </Button>
      </Link>
      <Link href="/find-my-booking">
        <Button variant="text" onClick={() => setOpen(false)}>
          Find my booking
        </Button>
      </Link>
      <Link href="/login">
        <Button variant="login" onClick={() => setOpen(false)}>
          <HiOutlineUser className="h-5 w-5" />
          Admin login
        </Button>
      </Link>
    </>
  );
};

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  useEffect(() => {
    const checkAuth = async () => {
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        setIsLoggedIn(false);
        return;
      }
      try {
        const res = await fetch("/api/check-auth", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ accessToken }),
        });
        if (res.ok) {
          setIsLoggedIn(true);
        }
      } catch (err) {
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);
  console.log(isLoggedIn);

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
          <NavbarLinks loggedIn={isLoggedIn} setOpen={setOpen} />
        </div>
      </div>

      {/* mobile hamburger */}
      {open && (
        <div className="absolute left-0 top-full min-h-screen w-full overflow-y-auto bg-white md:hidden">
          <div className="flex min-h-screen flex-col items-center gap-6 px-8 py-6">
            <NavbarLinks loggedIn={isLoggedIn} setOpen={setOpen} />
          </div>
        </div>
      )}
    </nav>
  );
}
