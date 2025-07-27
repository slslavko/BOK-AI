import React from "react";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={
        "animate-pulse bg-gradient-to-r from-white/10 via-white/20 to-white/10 rounded " +
        (className || "")
      }
    />
  );
}
export default Skeleton; 