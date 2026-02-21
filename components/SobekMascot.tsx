"use client";

import Image from "next/image";

export function SobekMascot({ className = "" }: { className?: string }) {
  return (
    <div className={`sobek-mascot ${className}`}>
      <Image
        src="/sobek.png"
        alt="Sobek mascot"
        width={140}
        height={140}
        priority
      />

      <style>{`
        .sobek-mascot {
          display: inline-block;
          filter: drop-shadow(0 0 18px rgba(221, 194, 135, 0.3)) drop-shadow(0 0 40px rgba(221, 194, 135, 0.15));
        }
      `}</style>
    </div>
  );
}
