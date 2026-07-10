import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalDoc } from "@/components/legal-doc";

const UPDATED = "Dernière mise à jour : 10 juillet 2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Politique de gestion des cookies",
    description: "Quels cookies VendsMoi utilise et comment les gérer.",
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDoc
      locale={locale}
      title="Politique de gestion des cookies"
      updated={UPDATED}
      sections={[
        {
          heading: "Qu'est-ce qu'un cookie ?",
          paragraphs: [
            "Un cookie est un petit fichier déposé sur votre appareil lors de la visite d'un site. Il permet notamment de vous reconnaître d'une page à l'autre et de maintenir votre session.",
          ],
        },
        {
          heading: "Cookies que nous utilisons",
          paragraphs: [
            "VendsMoi utilise uniquement des cookies strictement nécessaires au fonctionnement du service :",
          ],
          bullets: [
            "Cookies d'authentification (session) permettant de vous garder connecté.",
            "Préférence de langue, afin d'afficher le site dans la langue choisie.",
          ],
        },
        {
          heading: "Cookies de mesure d'audience et publicitaires",
          paragraphs: [
            "À ce jour, le site n'utilise aucun cookie de mesure d'audience ni de cookie publicitaire. Si de tels cookies étaient ajoutés à l'avenir, un bandeau de consentement serait mis en place et votre accord préalable serait recueilli, conformément à la réglementation.",
          ],
        },
        {
          heading: "Consentement",
          paragraphs: [
            "Les cookies strictement nécessaires ne requièrent pas votre consentement, car ils sont indispensables à la fourniture du service que vous demandez.",
          ],
        },
        {
          heading: "Gérer les cookies",
          paragraphs: [
            "Vous pouvez à tout moment configurer votre navigateur pour accepter, refuser ou supprimer les cookies. Le blocage des cookies strictement nécessaires peut toutefois empêcher le bon fonctionnement du site (par exemple, l'impossibilité de rester connecté).",
          ],
        },
        {
          heading: "Mise à jour",
          paragraphs: [
            "La présente politique peut être mise à jour pour refléter les évolutions du service ou de la réglementation. La date de dernière mise à jour figure en haut de cette page.",
          ],
        },
      ]}
    />
  );
}
