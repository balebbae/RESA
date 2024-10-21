import React from "react";
import MainNavLinks from "./MainNavLinks";
import Link from "next/link";

const MainNav = () => {
  return (
    <div className="flex justify-between">
      <Link href={"/"}>
        <span className="text-3xl font-bold">RESA</span>
      </Link>
      <div className="flex items-center gap-5">
        <MainNavLinks />
      </div>
    </div>
  );
};

export default MainNav;
