import React from "react";
import NotFound from "@/assets/notfound.svg";
import "@/app/styles/style.css";

const Error = () => {
  return (
    <div className="h-screen w-screen flex items-center justify-center gradient-bg-error">
      <div className="mx-auto">
        <NotFound />
      </div>
    </div>
  );
};

export default Error;
