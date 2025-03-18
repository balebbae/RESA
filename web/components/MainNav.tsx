"use client";

import React from "react";
import MainNavLinks from "./MainNavLinks";
import Link from "next/link";
import { motion } from "framer-motion";

const motionConfig = {
  whileHover: { scale: 1.2 },
  whileTap: { scale: 0.8 },
  tranistion: { type: "spring", stiffness: 400, damping: 10 },
};

const MainNav = () => {
  return (
    <div className="flex justify-between">
      <motion.div {...motionConfig} className="hover:cursor-pointer">
        <Link href={"/"} legacyBehavior passHref>
          <span className="text-3xl font-bold ">RESA</span>
        </Link>
      </motion.div>
      <div className="flex items-center gap-5">
        <MainNavLinks />
      </div>
    </div>
  );
};

export default MainNav;
