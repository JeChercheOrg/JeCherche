import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { createClient } from "@/utils/supabase/server";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ToastProvider } from "@/components/toast";
import { getUnreadCount } from "@/app/actions/messages";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Layout" });
  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s — ${SITE_NAME}`,
    },
    description: t("description"),
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, `${SITE_URL}/${l}`])
      ),
    },
    openGraph: {
      siteName: SITE_NAME,
      locale,
      type: "website",
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let displayName: string | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_path, display_name")
      .eq("id", user.id)
      .single();

    if (profile?.avatar_path) {
      avatarUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${profile.avatar_path}`;
    }
    displayName = profile?.display_name || null;
  }

  const tAuth = await getTranslations("Auth");
  const tLayout = await getTranslations("Layout");
  const tMyListings = await getTranslations("MyListings");
  const tMessages = await getTranslations("Messages");

  const unreadCount = user ? await getUnreadCount() : 0;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background">
        <Header
          user={user}
          locale={locale}
          avatarUrl={avatarUrl}
          displayName={displayName}
          unreadCount={unreadCount}
          translations={{
            login: tAuth("login"),
            signup: tAuth("signup"),
            publish: tLayout("publish"),
            myListings: tMyListings("myListings"),
            messages: tMessages("messages"),
            listings: tLayout("listings"),
            searchPlaceholder: tLayout("searchPlaceholder"),
          }}
        />
        <main className="flex-1">
          <NextIntlClientProvider>
            <ToastProvider>{children}</ToastProvider>
          </NextIntlClientProvider>
        </main>
        <Footer
          locale={locale}
          translations={{
            listings: tLayout("listings"),
            publish: tLayout("publish"),
          }}
        />
      </body>
    </html>
  );
}
