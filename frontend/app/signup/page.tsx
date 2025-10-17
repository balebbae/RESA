import { GalleryVerticalEnd } from "lucide-react"
import { Livvic } from "next/font/google";

import { SignupForm } from "@/components/marketing/SignupForm"

const livvic = Livvic({ subsets: ["latin"], weight: ["600"] });

export default function SignupPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="/" className="flex items-center gap-2 font-medium">
            <span className={`${livvic.className} text-3xl font-bold`}>
              RESA
            </span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/signup.png"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover opacity-70 dark:brightness-[0.5] dark:grayscale "
        />
      </div>
    </div>
  )
}
