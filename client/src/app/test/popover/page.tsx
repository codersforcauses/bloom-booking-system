"use client";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function PopoverTestPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="w-[360px] rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">Popover Test</h2>

        <div className="flex justify-end">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="bg-yellow-400 font-semibold text-black hover:bg-yellow-500">
                Filter
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-64">
              <div className="space-y-2">
                <p className="text-sm font-medium">Popover Content</p>
                <p className="text-sm text-muted-foreground">
                  This verifies that the popover component is implemented
                  correctly.
                </p>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
