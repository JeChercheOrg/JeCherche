import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { LegalDoc } from "@/components/legal-doc";

const UPDATED = "Dernière mise à jour : 10 juillet 2026";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Politique de confidentialité",
    description:
      "Comment VendsMoi collecte, utilise et protège vos données personnelles (RGPD).",
  };
}

export default async function ConfidentialitePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <LegalDoc
      locale={locale}
      title="Politique de confidentialité"
      updated={UPDATED}
      intro="La présente politique décrit comment VendsMoi collecte, utilise et protège vos données personnelles, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés."
      sections={[
        {
          heading: "Responsable du traitement",
          paragraphs: [
            "Le responsable du traitement est l'éditeur du site (voir les mentions légales). Pour toute question relative à vos données, vous pouvez écrire à [lefevreanto57@gmail.com].",
          ],
        },
        {
          heading: "Données que nous collectons",
          bullets: [
            "Données de compte : adresse e-mail, mot de passe (stocké de façon chiffrée / hachée), pseudonyme, photo de profil et bio (facultatives).",
            "Contenus que vous publiez : annonces, offres, messages, favoris et les images associées.",
            "Données de localisation : ville et code postal saisis, coordonnées géographiques approximatives de l'annonce.",
            "Données techniques : journaux de connexion et cookies strictement nécessaires au fonctionnement du service.",
          ],
        },
        {
          heading: "Finalités et bases légales",
          bullets: [
            "Fournir le service et permettre la mise en relation entre acheteurs et vendeurs : exécution du contrat (nos conditions d'utilisation).",
            "Gérer votre compte et vous authentifier : exécution du contrat.",
            "Vous envoyer des notifications par e-mail (nouvelle offre, message, etc.) : votre consentement, que vous pouvez retirer à tout moment depuis votre compte.",
            "Assurer la sécurité et prévenir les abus : notre intérêt légitime.",
          ],
        },
        {
          heading: "Destinataires et sous-traitants",
          paragraphs: [
            "Vos données ne sont jamais vendues. Elles sont traitées par des prestataires techniques agissant en tant que sous-traitants :",
          ],
          bullets: [
            "Supabase — base de données, authentification et stockage des fichiers.",
            "Resend — envoi des e-mails transactionnels.",
            "Vercel — hébergement de l'application.",
          ],
        },
        {
          heading: "Transferts hors Union européenne",
          paragraphs: [
            "Certains prestataires (notamment Vercel et Resend) peuvent être situés aux États-Unis. Ces transferts sont encadrés par des garanties appropriées, telles que les clauses contractuelles types de la Commission européenne.",
          ],
        },
        {
          heading: "Durée de conservation",
          paragraphs: [
            "Vos données sont conservées tant que votre compte est actif. Lorsque vous supprimez votre compte, vos données personnelles (profil, annonces, offres, conversations, messages, favoris) sont supprimées. Certaines données peuvent être conservées de façon limitée lorsque la loi l'impose.",
          ],
        },
        {
          heading: "Vos droits",
          paragraphs: [
            "Conformément au RGPD, vous disposez des droits d'accès, de rectification, d'effacement, de limitation, de portabilité et d'opposition, ainsi que du droit de retirer votre consentement.",
            "Vous pouvez supprimer votre compte et l'ensemble des données associées à tout moment depuis votre espace « Mon compte ». Pour exercer vos autres droits, contactez [lefevreanto57@gmail.com].",
            "Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).",
          ],
        },
        {
          heading: "Cookies",
          paragraphs: [
            "Le site utilise uniquement des cookies strictement nécessaires à son fonctionnement. Pour en savoir plus, consultez notre politique de gestion des cookies.",
          ],
        },
      ]}
    />
  );
}
