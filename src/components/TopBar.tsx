import { Link } from "@tanstack/react-router";
import { AudioLines, LogOut, ShieldCheck } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export function TopBar({
  email,
  isAdmin,
  onSignOut,
  funds,
}: {
  email?: string | undefined;
  isAdmin?: boolean | undefined;
  onSignOut?: (() => void) | undefined;
  funds?: string | undefined;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4">
        <Link to="/" className="flex min-w-0 shrink-0 items-center gap-2">
          <span className="glow-ring flex size-9 items-center justify-center rounded-lg bg-primary/15">
            <AudioLines className="size-5 text-primary" />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">
            echo<span className="text-gradient">trade</span>
          </span>
        </Link>

        <span className="hidden shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline">
          NSE · BSE · INR
        </span>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          {funds ? (
            <span className="num hidden rounded-md border border-border/70 bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground md:inline">
              Funds <span className="text-foreground">{funds}</span>
            </span>
          ) : null}
          <ThemeToggle />
          {isAdmin ? (
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <ShieldCheck className="size-4" /> Admin
              </Link>
            </Button>
          ) : null}
          {email ? (
            <span className="hidden max-w-[16ch] truncate text-xs text-muted-foreground lg:inline">{email}</span>
          ) : null}
          {onSignOut ? (
            <Button variant="ghost" size="sm" onClick={onSignOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
