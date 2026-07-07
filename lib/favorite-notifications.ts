import { createClient } from "@/utils/supabase/server";
import { sendNotificationEmail } from "@/lib/email";
import {
  favoritePriceChangedEmail,
  favoriteStatusChangedEmail,
} from "@/lib/email-templates";
import { SITE_URL } from "@/lib/constants";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getFavoriterEmails(
  supabase: SupabaseServerClient,
  listingId: string,
  excludeUserId: string
): Promise<string[]> {
  const { data } = await supabase.rpc("get_favoriter_emails_for_listing", {
    listing_uuid: listingId,
    exclude_user_uuid: excludeUserId,
  });
  if (!data || !Array.isArray(data)) return [];
  return data.map((row: { email: string }) => row.email);
}

export function notifyFavoritersOfPriceChange(
  supabase: SupabaseServerClient,
  locale: string,
  listingId: string,
  excludeUserId: string,
  listingTitle: string,
  oldPrice: number,
  newPrice: number
) {
  const listingUrl = `${SITE_URL}/${locale}/listings/${listingId}`;
  const email = favoritePriceChangedEmail(
    listingTitle,
    oldPrice,
    newPrice,
    listingUrl
  );
  getFavoriterEmails(supabase, listingId, excludeUserId).then((emails) => {
    for (const to of emails) {
      sendNotificationEmail({ to, ...email });
    }
  });
}

export function notifyFavoritersOfStatusChange(
  supabase: SupabaseServerClient,
  locale: string,
  listingId: string,
  excludeUserId: string,
  listingTitle: string,
  newStatus: "found" | "active"
) {
  const listingUrl = `${SITE_URL}/${locale}/listings/${listingId}`;
  const email = favoriteStatusChangedEmail(listingTitle, newStatus, listingUrl);
  getFavoriterEmails(supabase, listingId, excludeUserId).then((emails) => {
    for (const to of emails) {
      sendNotificationEmail({ to, ...email });
    }
  });
}
