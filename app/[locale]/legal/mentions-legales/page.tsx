import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalDoc } from "@/components/legal-doc";

const UPDATED = "Dernière mise à jour : 10 juillet 2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Mentions légales",
    description: "Mentions légales du site VendsMoi.",
  };
}

export default async function MentionsLegalesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDoc
      locale={locale}
      title="Mentions légales"
      updated={UPDATED}
      sections={[
        {
          heading: "Éditeur du site",
          paragraphs: [
            "Le site VendsMoi (accessible à l'adresse https://vendsmoi.fr) est édité par LEFEVRE Antony, entrepreneur individuel.",
            "Adresse e-mail de contact : contact@vendsmoi.fr.",
          ],
        },
        {
          heading: "Directeur de la publication",
          paragraphs: [
            "LEFEVRE Antony.",
          ],
        },
        {
          heading: "Hébergeur",
          paragraphs: [
            "Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis — https://vercel.com.",
            "Les données (base de données, authentification, fichiers) sont gérées via Supabase. Les e-mails transactionnels sont envoyés via Resend.",
          ],
        },
        {
          heading: "Propriété intellectuelle",
          paragraphs: [
            "La structure générale du site, ainsi que les textes, éléments graphiques, logos et logiciels qui le composent, sont la propriété de l'éditeur ou font l'objet d'une autorisation d'utilisation. Toute reproduction ou représentation, totale ou partielle, sans autorisation préalable est interdite.",
            "Les contenus publiés par les utilisateurs (annonces, offres, images, messages) restent la propriété de leurs auteurs, qui accordent à VendsMoi une licence d'utilisation aux seules fins de fonctionnement du service.",
          ],
        },
        {
          heading: "Responsabilité",
          paragraphs: [
            "VendsMoi agit en qualité d'hébergeur des contenus publiés par les utilisateurs au sens de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN). L'éditeur n'est pas partie aux transactions conclues entre utilisateurs et ne saurait être tenu responsable du contenu des annonces et des offres.",
            "L'éditeur s'efforce d'assurer l'exactitude et la mise à jour des informations, sans garantie. L'accès au service peut être interrompu pour maintenance ou pour des raisons techniques.",
          ],
        },
        {
          heading: "Signalement de contenu illicite",
          paragraphs: [
            "Tout contenu manifestement illicite peut être signalé à l'adresse contact@vendsmoi.fr. L'éditeur se réserve le droit de retirer sans préavis tout contenu contraire à la loi ou aux présentes conditions.",
          ],
        },
      ]}
    />
  );
}
