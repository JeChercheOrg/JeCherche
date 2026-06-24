import Link from "next/link";
import clsx from "clsx";

interface LogoProps {
  href?: string;
  className?: string;
}

export function Logo({ href = "/", className }: LogoProps) {
  return (
    <Link
      href={href}
      className={clsx(
        "text-xl font-bold tracking-tight text-text-primary hover:opacity-80 transition-opacity",
        className
      )}
    >
      Vends
      <span className="text-primary-text">Moi</span>
    </Link>
  );
}
