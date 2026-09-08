"use client";

import { Analytics } from "@vercel/analytics/next";

export function SiteAnalytics() {
  return (
    <Analytics
      beforeSend={(event) => {
        const { pathname } = new URL(event.url);
        return /\/admin(?:\/|$)/.test(pathname) ? null : event;
      }}
    />
  );
}
