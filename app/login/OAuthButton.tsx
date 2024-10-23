"use client";

import { FcGoogle } from "react-icons/fc";
import { Button } from "@/components/ui/button";

export const OAuthButton = () => {
  return (
    <Button
      variant="outline"
      className="width-full flex items-center justify-center gap-2"
    >
      <FcGoogle className="size-5" />
      Login with Google
    </Button>
  );
};

export default OAuthButton;
