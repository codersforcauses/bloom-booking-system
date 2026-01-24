import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <div className="min-h-layout-header left-0 top-0 flex w-screen flex-col items-center justify-center space-y-4 bg-white px-8 text-center">
      <div className="relative flex items-center justify-center md:my-20">
        <h1 className="animate-float my-10 text-[120px] font-semibold leading-none text-primary">
          Oops!
        </h1>
        <h1 className="absolute hidden text-[250px] font-bold leading-none text-primary/5 md:block">
          404
        </h1>
      </div>
      <p className="mb-8 mt-4 text-2xl font-bold text-gray-600">
        This page seems to be{" "}
        <span className="italic text-bloom-blue">missing.</span>
      </p>
      <p className="text-sm text-slate-800">
        The page yopu're looking for was either removed, renamed, or perhaps it
        never existed.
      </p>
      <Link
        href="/"
        className="mt-4 flex gap-1 rounded-lg bg-primary px-6 py-3 text-primary-foreground transition-all ease-in-out hover:-translate-y-0.5 hover:shadow-xl"
      >
        <ArrowLeft />
        Back to Safety
      </Link>
    </div>
  );
};

export default NotFound;
