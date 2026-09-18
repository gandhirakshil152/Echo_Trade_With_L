import { t as getServerFnById } from "./__23tanstack-start-server-fn-resolver-BWTNml0N.js";
import { d as TSS_SERVER_FUNCTION, t as createServerFn } from "./createServerFn-CIHAFgYl.js";
import { t as requireSupabaseAuth } from "./auth-middleware-BpbeoxIM.js";
import { i as cn, r as Button } from "./useAuth-BGH1l0ds.js";
import * as React from "react";
import { useEffect, useState } from "react";
import { Link, isRedirect, useRouter } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { z } from "zod";
import { AudioLines, LogOut, Moon, ShieldCheck, Sun } from "lucide-react";
import { cva } from "class-variance-authority";
//#region node_modules/@tanstack/react-start/dist/esm/useServerFn.js
function useServerFn(serverFn) {
	const router = useRouter();
	return React.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
//#endregion
//#region src/components/ThemeToggle.tsx
var KEY = "echotrade-theme";
function applyTheme(theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
}
function ThemeToggle() {
	const [theme, setTheme] = useState("light");
	useEffect(() => {
		const stored = localStorage.getItem(KEY);
		const initial = stored === "dark" || stored === "light" ? stored : "light";
		setTheme(initial);
		applyTheme(initial);
	}, []);
	const toggle = () => {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		localStorage.setItem(KEY, next);
		applyTheme(next);
	};
	return /* @__PURE__ */ jsxs(Button, {
		variant: "outline",
		size: "sm",
		onClick: toggle,
		"aria-label": theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
		title: theme === "dark" ? "Light mode" : "Dark mode",
		children: [theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "size-4" }) : /* @__PURE__ */ jsx(Moon, { className: "size-4" }), /* @__PURE__ */ jsx("span", {
			className: "hidden sm:inline",
			children: theme === "dark" ? "Light" : "Dark"
		})]
	});
}
//#endregion
//#region src/components/TopBar.tsx
function TopBar({ email, isAdmin, onSignOut, funds }) {
	return /* @__PURE__ */ jsx("header", {
		className: "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4",
			children: [
				/* @__PURE__ */ jsxs(Link, {
					to: "/",
					className: "flex min-w-0 shrink-0 items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "glow-ring flex size-9 items-center justify-center rounded-lg bg-primary/15",
						children: /* @__PURE__ */ jsx(AudioLines, { className: "size-5 text-primary" })
					}), /* @__PURE__ */ jsxs("span", {
						className: "font-display text-lg font-bold tracking-tight",
						children: ["echo", /* @__PURE__ */ jsx("span", {
							className: "text-gradient",
							children: "trade"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("span", {
					className: "hidden shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline",
					children: "NSE · BSE · INR"
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2",
					children: [
						funds ? /* @__PURE__ */ jsxs("span", {
							className: "num hidden rounded-md border border-border/70 bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground md:inline",
							children: ["Funds ", /* @__PURE__ */ jsx("span", {
								className: "text-foreground",
								children: funds
							})]
						}) : null,
						/* @__PURE__ */ jsx(ThemeToggle, {}),
						isAdmin ? /* @__PURE__ */ jsx(Button, {
							asChild: true,
							variant: "outline",
							size: "sm",
							children: /* @__PURE__ */ jsxs(Link, {
								to: "/admin",
								children: [/* @__PURE__ */ jsx(ShieldCheck, { className: "size-4" }), " Admin"]
							})
						}) : null,
						email ? /* @__PURE__ */ jsx("span", {
							className: "hidden max-w-[16ch] truncate text-xs text-muted-foreground lg:inline",
							children: email
						}) : null,
						onSignOut ? /* @__PURE__ */ jsx(Button, {
							variant: "ghost",
							size: "sm",
							onClick: onSignOut,
							"aria-label": "Sign out",
							children: /* @__PURE__ */ jsx(LogOut, { className: "size-4" })
						}) : null
					]
				})
			]
		})
	});
}
//#endregion
//#region src/components/ui/badge.tsx
var badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2", {
	variants: { variant: {
		default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
		secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
		destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
		outline: "text-foreground"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ jsx("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
//#endregion
//#region node_modules/@tanstack/start-server-core/dist/esm/createSsrRpc.js
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
//#endregion
//#region src/lib/trading.functions.ts
var brokerEnum = z.enum([
	"zerodha",
	"upstox",
	"angel_one"
]);
var getWorkspace = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("2994df9aec10d8b9d530ef423d178df090389e311a0939fa48060714fd408c41"));
var verifyBrokerPin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	pin: z.string().min(4).max(6)
}).parse(input)).handler(createSsrRpc("7056c011ce4dfa43d515fbe7cf71e12f168e4df5051fb1efb4a67aa9255279f7"));
var placeOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	symbol: z.string().min(1).max(20),
	exchange: z.enum(["NSE", "BSE"]),
	side: z.enum(["buy", "sell"]),
	quantity: z.number().int().positive().max(1e5),
	price: z.number().positive(),
	orderType: z.enum(["market", "limit"]),
	pin: z.string().min(4).max(6),
	source: z.enum(["voice", "manual"])
}).parse(input)).handler(createSsrRpc("5c7924311a663fb6e413d782896aff9466a5fd36b00810f9e33ce861eefce2b1"));
var toggleWatchlist = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	symbol: z.string().min(1).max(20),
	exchange: z.enum(["NSE", "BSE"]),
	remove: z.boolean()
}).parse(input)).handler(createSsrRpc("d71dbebeaf6cbb06579da82f15a383103d5164d5efe1515b56a2341591e196a0"));
var setBrokerConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	connected: z.boolean()
}).parse(input)).handler(createSsrRpc("75d163c6f2fdd191ae0bf4cf511d38a8b81b24246b3260c45481a54bff3842cc"));
/** Set up (or update) one broker account: holder name, client ID, PIN. Funds are randomised. */
var setupBrokerAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({
	broker: brokerEnum,
	accountName: z.string().trim().min(2).max(60),
	clientCode: z.string().trim().min(3).max(20),
	pin: z.string().regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
}).parse(input)).handler(createSsrRpc("3c6ff3ed6eb0e7e8c6ee3b2fe54366e7021028037093581d6d971dcb18fb9985"));
/** Admin only: every user with their brokers, funds and trading activity. */
var getAdminOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("60d5251e95a57bad598f0fe11aa04d9d7d7ba9457def2a69fa513d4ab654853c"));
//#endregion
export { setupBrokerAccount as a, createSsrRpc as c, ThemeToggle as d, useServerFn as f, setBrokerConnection as i, Badge as l, getWorkspace as n, toggleWatchlist as o, placeOrder as r, verifyBrokerPin as s, getAdminOverview as t, TopBar as u };
