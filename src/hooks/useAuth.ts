import type { Session, User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";

/** A synthetic demo user when Supabase is unreachable or the user picks guest mode */
export const DEMO_USER: User = {
  id: "demo-user-local",
  app_metadata: {},
  user_metadata: { full_name: "Demo Trader" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
  email: "demo@echotrade.local",
  role: "authenticated",
  updated_at: new Date().toISOString(),
  identities: [],
  factors: [],
};

const DEMO_KEY = "echotrade_demo_mode";

export const isDemoModeActive = () =>
  typeof localStorage !== "undefined" && localStorage.getItem(DEMO_KEY) === "1";

export const enableDemoMode = () => {
  if (typeof localStorage !== "undefined") localStorage.setItem(DEMO_KEY, "1");
};

export const disableDemoMode = () => {
  if (typeof localStorage !== "undefined") localStorage.removeItem(DEMO_KEY);
};

export const useAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [supabaseError, setSupabaseError] = useState(false);

  useEffect(() => {
    // Check demo mode first
    if (isDemoModeActive()) {
      setUser(DEMO_USER);
      setIsDemoMode(true);
      setLoading(false);
      return;
    }

    let subCleanup: (() => void) | undefined;

    const initAuth = async () => {
      try {
        // Try Supabase — give it 4s before falling back
        const timeoutId = setTimeout(() => {
          console.warn("[Auth] Supabase timeout — enabling demo mode");
          setSupabaseError(true);
          setLoading(false);
        }, 4000);

        const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
          clearTimeout(timeoutId);
          setSession(next);
          setUser(next?.user ?? null);
          setIsDemoMode(false);
          setLoading(false);
        });

        subCleanup = () => sub.subscription.unsubscribe();

        const { data, error } = await supabase.auth.getSession();
        if (error) {
          clearTimeout(timeoutId);
          console.warn("[Auth] getSession error:", error.message);
          setSupabaseError(true);
          setLoading(false);
          return;
        }
        clearTimeout(timeoutId);
        setSession(data.session);
        setUser(data.session?.user ?? null);
        setLoading(false);
      } catch (err) {
        console.warn("[Auth] Supabase initialization failed:", err);
        setSupabaseError(true);
        setLoading(false);
      }
    };

    initAuth();

    return () => {
      subCleanup?.();
    };
  }, []);

  const signOut = async () => {
    if (isDemoMode) {
      disableDemoMode();
      setUser(null);
      setIsDemoMode(false);
      return;
    }
    await supabase.auth.signOut();
  };

  const enterDemoMode = () => {
    enableDemoMode();
    setUser(DEMO_USER);
    setIsDemoMode(true);
    setLoading(false);
  };

  return { session, user, loading, isDemoMode, supabaseError, signOut, enterDemoMode };
};
