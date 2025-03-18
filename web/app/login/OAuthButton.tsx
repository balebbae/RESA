"use client";

import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

export const OAuthButton = ({ text }: { text: string }) => {
  return (
    <Button
      variant="outline"
      className="width-full flex items-center justify-center gap-2"
    >
      <FcGoogle className="size-5" />
      {text} with Google
    </Button>
  );
};

export default OAuthButton;
