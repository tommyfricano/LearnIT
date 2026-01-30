"use client";

import { useEffect } from "react";
import { initFullStory, identifyUser } from "@/lib/fullstory";
import { getUser } from "@/lib/storage";

export default function FullStoryProvider() {
  useEffect(() => {
    initFullStory();

    const user = getUser();
    if (user) {
      identifyUser(user);
    }
  }, []);

  return null;
}
