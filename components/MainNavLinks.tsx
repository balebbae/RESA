"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

const motionConfig = {
  whileHover: { scale: 1.2 },
  whileTap: { scale: 0.8 },
  tranistion: { type: "spring", stiffness: 400, damping: 10 },
};

export function MainNavLinks() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="space-x-3">
        <NavigationMenuItem>
          <motion.div {...motionConfig}>
            <Link href="/about" legacyBehavior passHref>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-transparent`}
              >
                About Us
              </NavigationMenuLink>
            </Link>
          </motion.div>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <motion.div {...motionConfig}>
            <Link href="/help" legacyBehavior passHref>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-transparent`}
              >
                Help
              </NavigationMenuLink>
            </Link>
          </motion.div>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <motion.div {...motionConfig}>
            <Link href="/login" legacyBehavior passHref>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} bg-transparent hover:bg-transparent`}
              >
                Login
              </NavigationMenuLink>
            </Link>
          </motion.div>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <motion.div {...motionConfig}>
            <Link href="/start" legacyBehavior passHref>
              <NavigationMenuLink
                className={`${navigationMenuTriggerStyle()} bg-black text-white hover:outline `}
              >
                Getting Started
              </NavigationMenuLink>
            </Link>
          </motion.div>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

export default MainNavLinks;
