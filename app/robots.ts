import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/*/account",
          "/*/my-listings",
          "/*/messages",
          "/*/login",
          "/*/signup",
          "/*/listings/create",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
