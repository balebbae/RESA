"use client";

import React from "react";
import { motion } from "framer-motion";
import Link from "next/link";

const motionConfig = {
  whileHover: { scale: 1.2 },
  whileTap: { scale: 0.8 },
  tranistion: { type: "spring", stiffness: 400, damping: 10 },
};

const NavbarNoLinks = () => {
  return (
    <nav className="flex flex-col items-center border-b mb-5 px-5 py-3">
      <div className="max-w-6xl w-full ">
        <div className="flex justify-between">
          <motion.div {...motionConfig} className="hover:cursor-pointer">
            <Link href={"/"} legacyBehavior passHref>
              <span className="text-3xl font-bold ">RESA</span>
            </Link>
          </motion.div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarNoLinks;
