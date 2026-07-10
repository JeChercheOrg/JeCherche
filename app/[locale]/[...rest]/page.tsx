import { notFound } from "next/navigation";

// Catch-all for unmatched paths under a locale: triggers the localized
// not-found.tsx UI (a segment not-found only renders on an explicit
// notFound() call, not for unmatched child routes).
export default function CatchAllNotFound() {
  notFound();
}
