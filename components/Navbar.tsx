import React from "react";
import MainNav from "./MainNav";

const Navbar = () => {
  return (
    <nav className="flex flex-col items-center border-b mb-5 px-5 py-3">
      <div className="max-w-6xl w-full ">
        <MainNav />
      </div>
    </nav>
  );
};

export default Navbar;
