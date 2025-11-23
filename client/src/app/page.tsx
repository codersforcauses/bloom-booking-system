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
      <Button onClick={() => setClicked(true)}>
        {isLoading ? "Loading" : "Ping"}
      </Button>
      <p>
        Response from server: <span>{data as string}</span>
      </p>
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
      <p className="text-caption">
        {" "}
        This is a paragraph with the text-caption class
      </p>
      <p className="text-caption-link">
        {" "}
        This is a paragraph with the text-caption-link class
      </p>
      <h3 className="mt-8"> Colours </h3>
      <p className="caption">
        {" "}
        (Bloom css colour palette bloom-(color name) ){" "}
      </p>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-primary p-8 text-white">
          Primary
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-secondary p-8">
          Secondary
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-gray p-8">
          bloom-gray
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-red p-8 text-white">
          bloom-red
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-blue p-8">
          bloom-blue
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-blue-light p-8">
          bloom-blue-light
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-blue-community p-8">
          bloom-blue-community
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-yellow p-8">
          bloom-yellow
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-yellow-light p-8">
          bloom-yellow-light
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-orbit p-8">
          bloom-orbit
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-black bg-bloom-orbit-light p-8">
          bloom-orbit-light
        </div>
      </div>
    </main>
  );
}
