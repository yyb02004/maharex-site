// Only an expiry timestamp is stored; guest names and answers stay out of browser storage.
export const RSVP_POPUP_STORAGE_KEY = "love:rsvp-popup:20270306:v1";
export const RSVP_POPUP_DAY_MS = 24 * 60 * 60 * 1000;
export const RSVP_POPUP_COMPLETED_MS = 7 * RSVP_POPUP_DAY_MS;

type PopupStorage = Pick<Storage, "getItem" | "setItem">;

function hiddenUntil(storage: PopupStorage | null): number {
  try {
    const value = Number(storage?.getItem(RSVP_POPUP_STORAGE_KEY));
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

export function shouldShowRsvpPopup(storage: PopupStorage | null, now = Date.now()): boolean {
  return hiddenUntil(storage) <= now;
}

export function suppressRsvpPopup(storage: PopupStorage | null, duration: number, now = Date.now()): boolean {
  if (!storage) return false;
  const until = Math.max(hiddenUntil(storage), now + duration);
  try { storage.setItem(RSVP_POPUP_STORAGE_KEY, String(until)); return true; }
  catch { return false; /* Private browsing or full storage must never interrupt an RSVP. */ }
}
