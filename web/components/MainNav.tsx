import React from "react";
import MainNavLinks from "./MainNavLinks";
import Image from "next/image";
import Link from "next/link";

const MainNav = () => {
  return (
    <div className="flex justify-between">
      <Link href={"/"}>
        <Image src="/assets/resa.png" alt="RESA Logo" width={110} height={60} />
      </Link>
      <div className="flex items-center gap-4">
        <MainNavLinks />
      </div>
    </div>
  );
};

export default MainNav;
