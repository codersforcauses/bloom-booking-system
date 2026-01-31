import { ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-layout-header left-0 top-0 flex w-screen flex-col items-center justify-center space-y-4 bg-white px-8 text-center">
      <div className="relative flex items-center justify-center md:my-20">
        <h1 className="animate-float my-10 text-[120px] font-semibold leading-none text-primary">
          Oops!
        </h1>
        <div
          className="absolute hidden text-[250px] font-bold leading-none text-primary/5 md:block"
          aria-hidden="true"
        >
          404
        </div>
      </div>
      <p className="mb-8 mt-4 text-2xl font-bold text-gray-600">
        This page seems to be{" "}
        <span className="italic text-bloom-blue">missing.</span>
      </p>
      <p className="text-sm text-slate-800">
        The page you're looking for was either removed, renamed, or perhaps it
        never existed.
      </p>
      <Link href="/">
        <Button className="flex gap-2">
          <ArrowLeft />
          Back to homppage
        </Button>
      </Link>
    </div>
  );
};

export default NotFound;
