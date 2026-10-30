"use client";

import { useEffect } from "react";

// HTML stays visible without JavaScript; only unseen content is prepared for animation.
export default function ScrollReveal() {
  useEffect(() => {
    const root = document.getElementById("top");
    if (!root || !("IntersectionObserver" in window) || !Element.prototype.animate) return;

    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const observed = new WeakSet<HTMLElement>();
    const completed = new WeakSet<HTMLElement>();
    const pending = new Set<HTMLElement>();
    const animations = new Map<HTMLElement, Animation>();

    const finish = (element: HTMLElement) => {
      completed.add(element);
      observer.unobserve(element);
      animations.get(element)?.cancel();
      animations.delete(element);
      element.removeAttribute("data-reveal-state");
      pending.delete(element);
    };

    const observer = new IntersectionObserver((entries) => {
      let stagger = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const element = entry.target as HTMLElement;
        observer.unobserve(element);
        if (completed.has(element)) continue;
        if (preference.matches || element.contains(document.activeElement)) {
          finish(element);
          continue;
        }
        completed.add(element);

        const animation = element.animate([
          { opacity: 0, transform: "translateY(32px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], {
          duration: 1400,
          easing: "cubic-bezier(0.25, 0.1, 0.25, 1)",
          delay: Math.min(stagger++ * 90, 180),
          fill: "backwards",
        });
        element.removeAttribute("data-reveal-state");
        pending.delete(element);
        animations.set(element, animation);
        animation.addEventListener("finish", () => animations.delete(element), { once: true });
      }
    }, { threshold: 0, rootMargin: "0px 0px -64px 0px" });

    const register = (element: HTMLElement) => {
      if (observed.has(element) || element.closest("dialog") || element.parentElement?.closest("[data-reveal]")) return;
      observed.add(element);
      // Never make already-visible content disappear during hydration or scroll restoration.
      if (preference.matches || element.getBoundingClientRect().top < window.innerHeight) {
        completed.add(element);
      } else {
        element.setAttribute("data-reveal-state", "pending");
        pending.add(element);
        observer.observe(element);
      }
    };

    const registerWithin = (node: Element) => {
      const isTarget = node instanceof HTMLElement && node.matches("[data-reveal]");
      if (isTarget) register(node);
      const descendants = node.querySelectorAll<HTMLElement>("[data-reveal]");
      descendants.forEach(register);
      return isTarget || descendants.length > 0;
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
      let addedTargets = false;
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) addedTargets = registerWithin(node) || addedTargets;
        }
      }
      if (addedTargets) revealDestination();
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
      pending.forEach((element) => element.removeAttribute("data-reveal-state"));
    };
  }, []);

  return null;
}
