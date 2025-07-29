"use client";

import { useEffect } from "react";

export default function PerformanceOptimizer() {
  useEffect(() => {
    // Preload critical resources
    const preloadLinks = [
      {
        rel: "preload",
        href: "/api/health",
        as: "fetch",
        crossorigin: "anonymous",
      },
    ];

    preloadLinks.forEach(({ rel, href, as, crossorigin }) => {
      const link = document.createElement("link");
      link.rel = rel;
      link.href = href;
      if (as) link.setAttribute("as", as);
      if (crossorigin) link.setAttribute("crossorigin", crossorigin);
      document.head.appendChild(link);
    });

    // Add service worker for PWA capabilities
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("SW registered: ", registration);
          })
          .catch((registrationError) => {
            console.log("SW registration failed: ", registrationError);
          });
      });
    }

    // Optimize images for mobile
    const images = document.querySelectorAll("img");
    images.forEach((img) => {
      img.loading = "lazy";
      img.decoding = "async";
    });

    // Add touch-friendly interactions
    const buttons = document.querySelectorAll("button, a");
    buttons.forEach((button) => {
      button.addEventListener("touchstart", () => {
        button.style.transform = "scale(0.98)";
      });
      button.addEventListener("touchend", () => {
        button.style.transform = "scale(1)";
      });
    });

    return () => {
      // Cleanup
      buttons.forEach((button) => {
        button.removeEventListener("touchstart", () => {});
        button.removeEventListener("touchend", () => {});
      });
    };
  }, []);

  return null;
}
