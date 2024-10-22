"use client";
import React from "react";
import { ContainerScroll } from "@/components/ui/container-scoll-animation";
import Image from "next/image";
import DashBoard from "@/assets/dashboard.png";
import { Badge } from "./ui/badge";
import { FaCheck } from "react-icons/fa6";

const Hero = () => {
  return (
    <div className="-mt-60 flex flex-col overflow-hidden">
      <ContainerScroll
        titleComponent={
          <>
            <div className="text-center pt-20 pb-4">
              <h1 className="text-3xl">
                <span className="font-bold">R</span>esturant
              </h1>
              <h1 className="text-3xl">
                <span className="font-bold">E</span>mployee{" "}
                <span className="font-bold">Scheduling</span>
              </h1>
              <h1 className="text-3xl">
                <span className="font-bold">A</span>pplication
              </h1>
            </div>
            <Badge className="mt-5 w-1/2 mx-auto flex items-center justify-center py-2 bg-white text-black rounded-3xl space-x-3 text-md hover:bg-white">
              <FaCheck className="text-green-500 " />
              <div className="flex items-center justify-center">
                Notifications
              </div>
              <FaCheck className=" text-green-500 " />

              <div className="flex items-center justify-center">
                AI Schedule Creation
              </div>
              <FaCheck className="text-green-500 " />
              <div className="flex items-center justify-center space-x-2">
                Simplicity
              </div>
            </Badge>
          </>
        }
      >
        <Image
          src={DashBoard}
          alt="hero"
          height={720}
          width={1400}
          className="mx-auto rounded-2xl object-cover h-full object-left-top"
          draggable={false}
        />
      </ContainerScroll>
    </div>
  );
};

export default Hero;
