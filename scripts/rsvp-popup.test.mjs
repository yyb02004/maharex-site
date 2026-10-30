import assert from "node:assert/strict";
import test from "node:test";
import {
  RSVP_POPUP_COMPLETED_MS,
  RSVP_POPUP_DAY_MS,
  RSVP_POPUP_STORAGE_KEY,
  shouldShowRsvpPopup,
  suppressRsvpPopup,
} from "../app/love/rsvp-popup.ts";

const NOW = Date.parse("2026-10-30T03:00:00.000Z");
const DAY = 86_400_000;

function memoryStorage(initial = null) {
  const values = new Map();
  if (initial !== null) values.set(RSVP_POPUP_STORAGE_KEY, initial);
  return {
    values,
    getItem(key) { return values.get(key) ?? null; },
    setItem(key, value) { values.set(key, value); },
  };
}

test("a first visit shows the popup without writing storage", () => {
  const storage = memoryStorage();
  assert.equal(shouldShowRsvpPopup(storage, NOW), true);
  assert.equal(storage.values.size, 0);
});

test("hide for a day expires at exactly 24 hours", () => {
  assert.equal(RSVP_POPUP_DAY_MS, DAY);
  const storage = memoryStorage();
  suppressRsvpPopup(storage, RSVP_POPUP_DAY_MS, NOW);
  assert.equal(shouldShowRsvpPopup(storage, NOW), false);
  assert.equal(shouldShowRsvpPopup(storage, NOW + DAY - 1), false);
  assert.equal(shouldShowRsvpPopup(storage, NOW + DAY), true);
  assert.equal(shouldShowRsvpPopup(storage, NOW + DAY + 1), true);
});

test("completed RSVP suppression expires at exactly seven days", () => {
  assert.equal(RSVP_POPUP_COMPLETED_MS, 7 * DAY);
  const storage = memoryStorage();
  suppressRsvpPopup(storage, RSVP_POPUP_COMPLETED_MS, NOW);
  assert.equal(shouldShowRsvpPopup(storage, NOW + DAY), false);
  assert.equal(shouldShowRsvpPopup(storage, NOW + 7 * DAY - 1), false);
  assert.equal(shouldShowRsvpPopup(storage, NOW + 7 * DAY), true);
});

test("a one-day dismissal cannot shorten the completed RSVP suppression", () => {
  const storage = memoryStorage();
  suppressRsvpPopup(storage, RSVP_POPUP_COMPLETED_MS, NOW);
  suppressRsvpPopup(storage, RSVP_POPUP_DAY_MS, NOW + DAY);
  assert.equal(storage.getItem(RSVP_POPUP_STORAGE_KEY), String(NOW + 7 * DAY));
  assert.equal(shouldShowRsvpPopup(storage, NOW + 2 * DAY), false);
});

test("a later successful response extends an existing suppression", () => {
  const storage = memoryStorage();
  suppressRsvpPopup(storage, RSVP_POPUP_COMPLETED_MS, NOW);
  suppressRsvpPopup(storage, RSVP_POPUP_COMPLETED_MS, NOW + DAY);
  assert.equal(storage.getItem(RSVP_POPUP_STORAGE_KEY), String(NOW + 8 * DAY));
  assert.equal(shouldShowRsvpPopup(storage, NOW + 7 * DAY), false);
  assert.equal(shouldShowRsvpPopup(storage, NOW + 8 * DAY), true);
});

test("storage contains only the versioned expiry timestamp", () => {
  const storage = memoryStorage();
  suppressRsvpPopup(storage, RSVP_POPUP_DAY_MS, NOW);
  assert.deepEqual([...storage.values], [[RSVP_POPUP_STORAGE_KEY, String(NOW + DAY)]]);
});

test("missing or malformed timestamps do not hide the popup", () => {
  for (const value of [null, "", " ", "not-a-timestamp", "NaN", "Infinity", "-1", "0", "{}"]) {
    const storage = memoryStorage(value);
    assert.equal(shouldShowRsvpPopup(storage, NOW), true, `stored value: ${String(value)}`);
    suppressRsvpPopup(storage, RSVP_POPUP_DAY_MS, NOW);
    assert.equal(storage.getItem(RSVP_POPUP_STORAGE_KEY), String(NOW + DAY));
  }
});

test("an expired timestamp permits a new dismissal period", () => {
  const storage = memoryStorage(String(NOW - 1));
  assert.equal(shouldShowRsvpPopup(storage, NOW), true);
  suppressRsvpPopup(storage, RSVP_POPUP_DAY_MS, NOW);
  assert.equal(storage.getItem(RSVP_POPUP_STORAGE_KEY), String(NOW + DAY));
});

test("a blocked storage read does not interrupt display or suppression", () => {
  const writes = [];
  const storage = {
    getItem() { throw new Error("Storage unavailable"); },
    setItem(key, value) { writes.push([key, value]); },
  };
  assert.equal(shouldShowRsvpPopup(storage, NOW), true);
  assert.doesNotThrow(() => suppressRsvpPopup(storage, RSVP_POPUP_COMPLETED_MS, NOW));
  assert.deepEqual(writes, [[RSVP_POPUP_STORAGE_KEY, String(NOW + 7 * DAY)]]);
});

test("a failed storage write does not interrupt an RSVP", () => {
  const storage = {
    getItem() { return null; },
    setItem() { throw new Error("Storage quota exceeded"); },
  };
  assert.doesNotThrow(() => suppressRsvpPopup(storage, RSVP_POPUP_COMPLETED_MS, NOW));
  assert.equal(shouldShowRsvpPopup(storage, NOW), true);
});

test("fully unavailable storage remains safe", () => {
  const blockedStorage = {
    getItem() { throw new Error("Read denied"); },
    setItem() { throw new Error("Write denied"); },
  };
  for (const storage of [null, blockedStorage]) {
    assert.equal(shouldShowRsvpPopup(storage, NOW), true);
    assert.doesNotThrow(() => suppressRsvpPopup(storage, RSVP_POPUP_DAY_MS, NOW));
  }
});
