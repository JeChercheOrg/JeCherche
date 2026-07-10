import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SITE_NAME } from "@/lib/constants";

export interface LegalSection {
  heading?: string;
  paragraphs?: string[];
  bullets?: string[];
}

interface LegalDocProps {
  locale: string;
  title: string;
  updated: string;
  intro?: string;
  sections: LegalSection[];
}

// Legal content is authored in French only (the pages describe a French entity
// and are governed by French law); it is rendered on every locale route.
export function LegalDoc({ locale, title, updated, intro, sections }: LegalDocProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <Link
        href={`/${locale}`}
        className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        {SITE_NAME}
      </Link>

      <h1 className="mt-6 text-2xl font-bold text-text-primary">{title}</h1>
      <p className="mt-1 text-sm text-text-tertiary">{updated}</p>

      {intro && (
        <p className="mt-6 text-sm leading-relaxed text-text-secondary">{intro}</p>
      )}

      <div className="mt-8 space-y-8">
        {sections.map((section, i) => (
          <section key={i}>
            {section.heading && (
              <h2 className="mb-3 text-lg font-semibold text-text-primary">
                {section.heading}
              </h2>
            )}
            {section.paragraphs?.map((paragraph, j) => (
              <p
                key={j}
                className="mb-3 text-sm leading-relaxed text-text-secondary"
              >
                {paragraph}
              </p>
            ))}
            {section.bullets && (
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-text-secondary">
                {section.bullets.map((bullet, k) => (
                  <li key={k}>{bullet}</li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
