"use client";

import { useEffect } from "react";

// Content stays visible in HTML; animation is a progressive enhancement on entry.
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.getElementById("top");
    if (!root || !("IntersectionObserver" in window) || !Element.prototype.animate) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observed = new WeakSet<HTMLElement>();
    const completed = new WeakSet<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();

    const finish = (element: HTMLElement) => {
      completed.add(element);
      observer.unobserve(element);
      animations.get(element)?.cancel();
      animations.delete(element);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        if (completed.has(element)) continue;
        completed.add(element);
        if (preference.matches || element.contains(document.activeElement)) continue;

        const animation = element.animate([
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 720, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
        animations.set(element, animation);
        animation.addEventListener("finish", () => animations.delete(element), { once: true });
      }
    }, { threshold: 0 });

    const register = (element: HTMLElement) => {
      if (observed.has(element) || element.closest("dialog") || element.parentElement?.closest("[data-reveal]")) return;
      observed.add(element);
      // Never make already-visible content disappear during hydration or scroll restoration.
      if (preference.matches || element.getBoundingClientRect().top < window.innerHeight) {
        completed.add(element);
      } else {
        observer.observe(element);
      }
    };

    const registerWithin = (node: Element) => {
      if (node instanceof HTMLElement && node.matches("[data-reveal]")) register(node);
      node.querySelectorAll<HTMLElement>("[data-reveal]").forEach(register);
    };

    const revealDestination = () => {
      let destination: HTMLElement | null = null;
      try { destination = document.getElementById(decodeURIComponent(window.location.hash.slice(1))); } catch { return; }
      if (!destination || !root.contains(destination)) return;
      const ancestor = destination.closest<HTMLElement>("[data-reveal]");
      if (ancestor) finish(ancestor);
      destination.querySelectorAll<HTMLElement>("[data-reveal]").forEach(finish);
    };

    const revealFocus = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      const element = event.target.closest<HTMLElement>("[data-reveal]");
      if (element) finish(element);
    };

    const reduceMotion = () => {
      if (!preference.matches) return;
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach(finish);
    };

    registerWithin(root);
    revealDestination();
    // RSVP and guest sections may mount after their availability check completes.
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) registerWithin(node);
        }
      }
    });
    mutations.observe(root, { childList: true, subtree: true });
    root.addEventListener("focusin", revealFocus);
    window.addEventListener("hashchange", revealDestination);
    preference.addEventListener("change", reduceMotion);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      root.removeEventListener("focusin", revealFocus);
      window.removeEventListener("hashchange", revealDestination);
      preference.removeEventListener("change", reduceMotion);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return null;
}
