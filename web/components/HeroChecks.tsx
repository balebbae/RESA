import React from "react";
import { FaCheck } from "react-icons/fa6";

const HeroChecks = () => {
  return (
    <div className="mt-5 w-1/2 mx-auto flex items-center justify-center py-2 bg-white  rounded-3xl space-x-3 text-md font-bold">
      <Checks text="Notifications" />
      <Checks text="AI Schedule Creation" />
      <Checks text="Simplicity" />
    </div>
  );
};

export default HeroChecks;

function Checks({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center">
      <FaCheck className=" text-green-500 size-5" />
      <div className="flex items-center justify-center pl-2">{text}</div>
    </div>
  );
}
