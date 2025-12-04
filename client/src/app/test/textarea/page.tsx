"use client";
import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import Textarea from "@/components/ui/textarea";

export default function TextareaTestPage() {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert(`Submitted text: ${message}`);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="mx-auto my-5 flex w-full max-w-lg flex-col items-center justify-center">
        <form onSubmit={handleSubmit} className="w-full rounded-md border p-4">
          <Textarea // basic textarea
            name="message"
            value={message}
            onChange={setMessage}
          />
          {/* <Textarea           // with customization
            id="message"
            name="message"
            label="Additional message"
            placeholder="This is an textarea with customization"
            rows={6}
            value={message}
            onChange={setMessage}
            required={true}
            requiredText=" (required)"
            labelClassName="text-blue-800 text-center"
            requiredTextClassName="text-purple-600"
            divClassName="w-[90%] mx-auto bg-green-100"
            textareaClassName="bg-green-100 placeholder:text-gray-600"
          /> */}
          <Button type="submit" className="mx-auto mt-4">
            Submit
          </Button>
        </form>
        <p className="mt-4">Current value message: {message}</p>
      </div>
    </div>
  );
}
