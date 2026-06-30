"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  saveDraftText,
  loadDraftText,
  saveDraftImages,
  loadDraftImages,
  clearDraft as clearDraftStorage,
} from "./draft-storage";

const DEBOUNCE_MS = 500;

// Ties a form's state to persistent storage so the user never loses their
// input when a mobile browser discards the backgrounded tab (e.g. while they
// switch apps to pick a photo).
//
// - On mount: silently restores any saved draft via `onRestore`.
// - On change: persists text (debounced) and images.
// - On tab hide / pagehide: persists immediately — the reliable hook on mobile,
//   where `beforeunload` is not fired.
//
// `clearDraft` should be called after a successful submit; `saveDraft` forces
// an immediate save (used to keep the draft when a submit fails).
export function useListingDraft<T extends Record<string, unknown>>(
  key: string,
  text: T,
  images: File[],
  onRestore: (text: T | null, images: File[]) => void
): { clearDraft: () => void; saveDraft: () => void } {
  const hydrated = useRef(false);

  // Keep latest values in refs so event handlers always read fresh data.
  const textRef = useRef(text);
  const imagesRef = useRef(images);
  const onRestoreRef = useRef(onRestore);

  // Sync refs after every render (refs must not be written during render).
  useEffect(() => {
    textRef.current = text;
    imagesRef.current = images;
    onRestoreRef.current = onRestore;
  });

  // 1. Restore any saved draft once, on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const savedText = loadDraftText<T>(key);
      const savedImages = await loadDraftImages(key);
      if (!cancelled && (savedText || savedImages.length > 0)) {
        onRestoreRef.current(savedText, savedImages);
      }
      hydrated.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [key]);

  // 2. Persist text (debounced) whenever it changes, after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    const id = setTimeout(() => saveDraftText(key, text), DEBOUNCE_MS);
    return () => clearTimeout(id);
  }, [key, text]);

  // 3. Persist images whenever they change, after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    void saveDraftImages(key, images);
  }, [key, images]);

  // 4. Persist immediately when the tab is hidden or unloaded (mobile).
  useEffect(() => {
    function flush() {
      saveDraftText(key, textRef.current);
      void saveDraftImages(key, imagesRef.current);
    }
    function onVisibility() {
      if (document.visibilityState === "hidden") flush();
    }
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", flush);
    };
  }, [key]);

  const clearDraft = useCallback(() => {
    void clearDraftStorage(key);
  }, [key]);

  const saveDraft = useCallback(() => {
    saveDraftText(key, textRef.current);
    void saveDraftImages(key, imagesRef.current);
  }, [key]);

  return { clearDraft, saveDraft };
}
