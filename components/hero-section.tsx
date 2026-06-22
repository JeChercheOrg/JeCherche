import Link from "next/link";
import { Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  locale: string;
  translations: {
    title: string;
    subtitle: string;
    cta: string;
  };
}

export function HeroSection({ locale, translations }: HeroSectionProps) {
  return (
    <section className="bg-surface border-b border-border">
      <div className="mx-auto max-w-7xl px-4 py-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 rounded-full bg-primary-light flex items-center justify-center">
            <Megaphone className="h-6 w-6 text-primary-text" />
          </div>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-2">
          {translations.title}
        </h1>
        <p className="text-text-secondary text-base sm:text-lg mb-6 max-w-md mx-auto">
          {translations.subtitle}
        </p>
        <Link href={`/${locale}/listings/create`}>
          <Button size="lg">{translations.cta}</Button>
        </Link>
      </div>
    </section>
  );
}
