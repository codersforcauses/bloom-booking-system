"use client";
import React from "react";

export default function TestAdminPage() {
  return (
    <div className="min-h-screen bg-red-200 p-8">
      <div className="mx-auto my-5 flex w-full max-w-lg flex-col items-center justify-center">
        <p>Only admins can enter here.</p>
      </div>
    </div>
  );
}
