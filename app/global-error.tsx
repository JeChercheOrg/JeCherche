"use client";

import { useEffect } from "react";

// Rendered only when the root layout itself crashes. It replaces the whole
// document, so it must provide its own <html>/<body> and inline styles.
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#111",
          background: "#fff",
        }}
      >
        <title>Erreur — VendsMoi</title>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: "28rem" }}>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>
            {"Une erreur est survenue"}
          </h1>
          <p style={{ color: "#666", marginBottom: "1.5rem" }}>
            {"Un problème inattendu s'est produit. Veuillez réessayer."}
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              padding: "0.5rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid #ccc",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
              fontSize: "0.875rem",
            }}
          >
            {"Réessayer"}
          </button>
        </div>
      </body>
    </html>
  );
}
