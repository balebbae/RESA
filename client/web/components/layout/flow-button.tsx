"use client";
import { ArrowRight } from "lucide-react";

interface FlowButtonProps {
  text?: string;
  onClick?: () => void;
  disabled?: boolean;
}

export function FlowButton({
  text = "Modern Button",
  onClick,
  disabled = false,
}: FlowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group/flowbutton relative flex items-center gap-1 overflow-hidden rounded-[100px] border-[1.5px] border-[#333333]/40 bg-transparent px-8 py-3 text-sm font-semibold text-[#111111] cursor-pointer transition-all duration-[600ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:border-transparent hover:text-white hover:rounded-[12px] active:scale-[0.95] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[#333333]/40 disabled:hover:text-[#111111] disabled:hover:rounded-[100px]">
      {/* Left arrow (arr-2) */}
      <ArrowRight className="absolute w-4 h-4 left-[-25%] stroke-[#111111] fill-none z-[9] group-hover/flowbutton:left-4 group-hover/flowbutton:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />

      {/* Text */}
      <span className="relative z-[1] -translate-x-3 group-hover/flowbutton:translate-x-3 transition-all duration-[800ms] ease-out">
        {text}
      </span>

      {/* Circle */}
      <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-[#111111] rounded-[50%] opacity-0 group-hover/flowbutton:w-[220px] group-hover/flowbutton:h-[220px] group-hover/flowbutton:opacity-100 transition-all duration-[800ms] ease-[cubic-bezier(0.19,1,0.22,1)]"></span>

      {/* Right arrow (arr-1) */}
      <ArrowRight className="absolute w-4 h-4 right-4 stroke-[#111111] fill-none z-[9] group-hover/flowbutton:right-[-25%] group-hover/flowbutton:stroke-white transition-all duration-[800ms] ease-[cubic-bezier(0.34,1.56,0.64,1)]" />
    </button>
  );
}
