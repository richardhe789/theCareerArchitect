"use client";

import { useEffect } from "react";

const STYLE_SELECTOR = [
  "style[wxt-shadow-root-document-styles]",
  "style[data-wxt-shadow-root]",
  "style[data-shadow-root]",
  "style[data-shadowroot]",
  "style[data-extension-root]",
  "style[data-extension-id]",
].join(",");

const HOST_SELECTOR = [
  "bettercanvas-reminders",
  "[data-wxt-shadow-root]",
  "[data-shadow-root]",
  "[data-shadowroot]",
  "[data-extension-root]",
  "[data-extension-id]",
].join(",");

const containsTailwindV4Props = (styleText: string) =>
  styleText.includes("@property --tw-");

const removeInjectedArtifacts = () => {
  document.querySelectorAll(STYLE_SELECTOR).forEach((node) => node.remove());
  document.querySelectorAll(HOST_SELECTOR).forEach((node) => node.remove());

  document.querySelectorAll("style").forEach((node) => {
    if (containsTailwindV4Props(node.textContent ?? "")) {
      node.remove();
    }
  });
};

export default function ExtensionStyleGuard() {
  useEffect(() => {
    removeInjectedArtifacts();

    const observer = new MutationObserver(() => {
      removeInjectedArtifacts();
    });

    observer.observe(document.head, { childList: true });
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}