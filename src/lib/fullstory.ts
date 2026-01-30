import { init, FullStory } from "@fullstory/browser";
import { User } from "./types";

let initialized = false;

export function initFullStory(): void {
  if (typeof window === "undefined") return;
  if (initialized) return;

  const orgId = process.env.NEXT_PUBLIC_FULLSTORY_ORG_ID;
  if (!orgId) {
    console.warn("[FullStory] NEXT_PUBLIC_FULLSTORY_ORG_ID is not set. Skipping initialization.");
    return;
  }

  // Clear cached FullStory session data so each demo run starts fresh
  document.cookie.split(";").forEach((cookie) => {
    const name = cookie.split("=")[0].trim();
    if (name.startsWith("_fs_")) {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith("_fs_") || key.startsWith("fs_")) {
      localStorage.removeItem(key);
    }
  });

  init({ orgId });
  initialized = true;

  FullStory("setProperties", {
    type: "page",
    properties: {
      app_str: "LearnIT",
    },
  });
}

export function identifyUser(user: User): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;

  FullStory("setIdentity", {
    uid: user.id,
    properties: {
      displayName: user.name,
      email: user.email,
      role_str: user.role,
    },
  });
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!initialized) return;

  FullStory("trackEvent", {
    name,
    properties: properties ?? {},
  });
}
