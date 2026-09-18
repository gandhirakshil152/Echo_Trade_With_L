import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AudioLines, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — EchoTrade Voice Trading Terminal" },
      {
        name: "description",
        content:
          "Create your EchoTrade account to trade NSE and BSE stocks by voice across three linked Indian brokers.",
      },
      { property: "og:title", content: "Sign in — EchoTrade" },
      { property: "og:description", content: "Voice-first NSE & BSE trading across three brokers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user, loading, supabaseError, enterDemoMode } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate({ to: "/" });
  }, [loading, user, navigate]);

  const signIn = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("fetch")) {
          toast.error("Cannot reach Supabase. Use demo mode to explore the app.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Welcome back to EchoTrade");
      navigate({ to: "/" });
    } catch {
      toast.error("Connection failed. Try demo mode.");
    } finally {
      setBusy(false);
    }
  };

  const signUp = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) {
        if (error.message.toLowerCase().includes("network") || error.message.toLowerCase().includes("fetch")) {
          toast.error("Cannot reach Supabase. Use demo mode to explore the app.");
        } else {
          toast.error(error.message);
        }
        return;
      }
      toast.success("Account created — check your email to confirm");
      navigate({ to: "/" });
    } catch {
      toast.error("Connection failed. Try demo mode.");
    } finally {
      setBusy(false);
    }
  };

  const handleDemoMode = () => {
    enterDemoMode();
    toast.success("Demo mode active — explore EchoTrade freely!");
    navigate({ to: "/" });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="panel w-full max-w-md p-6">
        <div className="flex items-center gap-2">
          <span className="glow-ring flex size-9 items-center justify-center rounded-lg bg-primary/15">
            <AudioLines className="size-5 text-primary" />
          </span>
          <span className="font-display text-xl font-bold">
            echo<span className="text-gradient">trade</span>
          </span>
        </div>
        <h1 className="font-display mt-5 text-2xl font-semibold">Voice trading, NSE & BSE</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          One login, three linked broker accounts, all funds in rupees.
        </p>

        {supabaseError && (
          <div className="mt-4 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-600 dark:text-yellow-400">
            ⚠️ Cannot connect to Supabase backend. You can still use{" "}
            <strong>Demo Mode</strong> to explore the app locally.
          </div>
        )}

        {/* ── Demo Mode CTA (always visible) ── */}
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex items-center gap-2">
            <Zap className="size-4 text-primary" />
            <span className="text-sm font-semibold">Demo Mode — no account needed</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Explore live prices, voice commands in English, Hindi & Gujarati, charts and all features.
            No data is saved.
          </p>
          <Button className="mt-3 w-full" onClick={handleDemoMode}>
            <Zap className="mr-1.5 size-4" /> Continue as Guest (Demo)
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or sign in <span className="h-px flex-1 bg-border" />
        </div>

        <Tabs defaultValue="signin">
          <TabsList className="w-full">
            <TabsTrigger value="signin" className="flex-1">
              Sign in
            </TabsTrigger>
            <TabsTrigger value="signup" className="flex-1">
              Create account
            </TabsTrigger>
          </TabsList>

          <TabsContent value="signin" className="space-y-3 pt-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && signIn()}
              />
            </div>
            <Button className="w-full" onClick={signIn} disabled={busy || !email || !password}>
              {busy ? "Signing in…" : "Sign in"}
            </Button>
          </TabsContent>

          <TabsContent value="signup" className="space-y-3 pt-4">
            <div>
              <Label htmlFor="name">Full name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="email2">Email</Label>
              <Input id="email2" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="password2">Password</Label>
              <Input
                id="password2"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button className="w-full" onClick={signUp} disabled={busy || !email || !password}>
              {busy ? "Creating…" : "Create account"}
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
