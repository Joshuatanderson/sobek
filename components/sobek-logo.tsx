import Link from "next/link";
import Image from "next/image";

export function SobekLogo() {
  return (
    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <Image src="/sobek-small.png" alt="Sobek" width={32} height={32} />
      <span className="text-lg font-bold text-sobek-gold hidden sm:inline">Sobek</span>
    </Link>
  );
}
