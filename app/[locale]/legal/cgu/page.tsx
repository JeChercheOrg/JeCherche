import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalDoc } from "@/components/legal-doc";

const UPDATED = "Dernière mise à jour : 10 juillet 2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Conditions générales d'utilisation",
    description: "Conditions générales d'utilisation du service VendsMoi.",
  };
}

export default async function CguPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDoc
      locale={locale}
      title="Conditions générales d'utilisation"
      updated={UPDATED}
      intro="Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation du service VendsMoi. En utilisant le site, vous acceptez ces conditions."
      sections={[
        {
          heading: "1. Objet",
          paragraphs: [
            "Les CGU ont pour objet de définir les modalités de mise à disposition du service et les conditions d'utilisation par l'utilisateur.",
          ],
        },
        {
          heading: "2. Description du service",
          paragraphs: [
            "VendsMoi est une place de marché « inversée » : les acheteurs publient une demande décrivant ce qu'ils recherchent, et les vendeurs leur proposent des offres. Les offres reçues sur une annonce sont visibles publiquement, dans un objectif de transparence.",
            "VendsMoi n'est pas partie aux transactions conclues entre utilisateurs et n'intervient ni dans le paiement, ni dans la livraison des biens.",
          ],
        },
        {
          heading: "3. Inscription et compte",
          paragraphs: [
            "La publication d'une annonce ou d'une offre nécessite la création d'un compte avec une adresse e-mail valide et un pseudonyme unique. Le pseudonyme n'est pas modifiable après l'inscription.",
            "Vous êtes responsable de la confidentialité de vos identifiants et de toute activité réalisée depuis votre compte.",
          ],
        },
        {
          heading: "4. Règles de publication",
          paragraphs: [
            "Vous vous engagez à ne publier que des contenus licites et exacts. Sont notamment interdits : les contenus illégaux, contrefaits, trompeurs, diffamatoires, haineux, ou portant atteinte aux droits de tiers, ainsi que la vente de biens ou services dont la commercialisation est réglementée ou interdite.",
          ],
        },
        {
          heading: "5. Offres et mise en relation",
          paragraphs: [
            "Les offres constituent des propositions entre utilisateurs. L'acceptation d'une offre par l'auteur de l'annonce n'engage que les parties concernées. VendsMoi facilite la mise en relation mais ne garantit ni la conclusion, ni la bonne exécution des transactions.",
          ],
        },
        {
          heading: "6. Contenus des utilisateurs et modération",
          paragraphs: [
            "Vous conservez la propriété de vos contenus et êtes seul responsable de ceux-ci. VendsMoi, en qualité d'hébergeur au sens de la LCEN, se réserve le droit de retirer tout contenu manifestement illicite ou contraire aux présentes CGU, et de suspendre ou supprimer un compte en cas de manquement.",
          ],
        },
        {
          heading: "7. Responsabilité",
          paragraphs: [
            "Le service est fourni « en l'état ». VendsMoi ne saurait être tenu responsable des dommages résultant de l'utilisation du service, du comportement des utilisateurs ou de l'indisponibilité temporaire du site.",
          ],
        },
        {
          heading: "8. Données personnelles",
          paragraphs: [
            "Le traitement de vos données personnelles est décrit dans la politique de confidentialité.",
          ],
        },
        {
          heading: "9. Résiliation",
          paragraphs: [
            "Vous pouvez cesser d'utiliser le service et supprimer votre compte à tout moment depuis votre espace « Mon compte ».",
          ],
        },
        {
          heading: "10. Droit applicable et litiges",
          paragraphs: [
            "Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en priorité. Conformément à la réglementation, le consommateur peut recourir à un médiateur de la consommation. À défaut d'accord, les tribunaux français seront compétents.",
          ],
        },
      ]}
    />
  );
}
