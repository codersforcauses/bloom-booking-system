"use client";

import { useState } from "react";
import { HiOutlineUser } from "react-icons/hi";

import { usePings } from "@/hooks/pings";
import { cn } from "@/lib/utils";

import { Button } from "../components/ui/button";

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const { data, isLoading } = usePings({
    enabled: clicked,
  });

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center gap-4 p-24 font-montserrat",
      )}
    >
      <Button variant="login" onClick={() => setClicked(true)}>
        <HiOutlineUser className="text-xl" />
        Admin login
      </Button>
      <Button variant="outline" onClick={() => setClicked(true)}>
        {isLoading ? "Hover" : "Outline"}
      </Button>
      <Button variant="link" onClick={() => setClicked(true)}>
        {isLoading ? "Hover" : "Text"}
      </Button>
      <Button variant="confirm">
        <span className="mr-1 text-xl leading-none">+</span> Confirm
      </Button>
      <Button variant="warning" onClick={() => setClicked(true)}>
        {isLoading ? "Hover" : "Warning"}
      </Button>
      <Button variant="booking" onClick={() => setClicked(true)}>
        {isLoading ? "Hover" : "View bookings"}
      </Button>
      <p>
        Response from server: <span>{data as string}</span>
      </p>
    </main>
  );
}
