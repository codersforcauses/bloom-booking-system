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
        Ping
      </Button>
      <p>
        Response from server:{" "}
        <span className="font-bold">{data as string}</span>
      </p>
    </main>
  );
}
