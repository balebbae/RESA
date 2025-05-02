import { LoginForm } from "@/components/login-form";
// Removed Button import
import Link from "next/link";

export default function Page() {
  return (
    <div className="relative flex min-h-svh w-full flex-col items-center justify-center p-6 md:p-10">
      <Link href="/" className="absolute top-10 left-10 md:top-10 md:left-10">
        {/* Replaced Button with an SVG arrow */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor" // Using currentColor to inherit text color (can be black)
          className="h-6 w-6 text-black" // Added size and text color
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
          />
        </svg>
      </Link>
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
