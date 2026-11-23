"use client";

import { useEffect, useState } from "react";
import { NotificationBell } from "@/components/layout/notification-bell";
import { createClient } from "@/utils/supabase/client";
import { isSupabaseConfigured } from "@/utils/supabase/config";

export function GlobalNotificationBell() {
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (active) setProfileId(data.user?.id ?? null);
    });
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setProfileId(session?.user.id ?? null);
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return profileId ? <NotificationBell profileId={profileId} variant="global" /> : null;
}
