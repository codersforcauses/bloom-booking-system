"use client";

import { Inter as FontSans } from "next/font/google";
import { useState } from "react";

import { usePings } from "@/hooks/pings";
import { cn } from "@/lib/utils";

import { Button } from "../components/ui/button";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function Home() {
  const [clicked, setClicked] = useState(false);
  const { data, isLoading } = usePings({
    enabled: clicked,
  });

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center gap-4 p-24",
        fontSans.variable,
      )}
    >
      <h1 className="">Header Tag 1</h1>
      <h2 className="">Header Tag 2</h2>
      <h3 className="">Header Tag 3</h3>
      <label> This is a label </label>
      <p> This is a paragraph </p>
      <p className="text-bold"> This is a paragraph with the text-bold class</p>
      <p className="text-bold-sm">
        {" "}
        This is a paragraph with the text-bold-sm class
      </p>
      <p className="text-helper">
        {" "}
        This is a paragraph with the text-helper class
      </p>
      <p className="caption"> This is a paragraph with the caption class</p>
      <p className="caption-link">
        {" "}
        This is a paragraph with the caption-link class
      </p>
      <p className="border-preset border-purple-500 px-4 py-2">
        {" "}
        border-preset{" "}
      </p>

      <Button onClick={() => setClicked(true)}>
        {isLoading ? "Loading" : "Ping"}
      </Button>
      <p>
        Response from server: <span>{data as string}</span>
      </p>
    </main>
  );
}
