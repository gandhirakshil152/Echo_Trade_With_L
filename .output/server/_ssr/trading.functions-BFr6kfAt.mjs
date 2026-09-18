import { i as __toESM } from "../_runtime.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-BWTNml0N.mjs";
import { D as isRedirect, _ as useRouter, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
import { t as requireSupabaseAuth } from "./auth-middleware-BpbeoxIM.mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { r as cn, t as Button } from "./useAuth-BGH1l0ds.mjs";
import { a as objectType, i as numberType, n as booleanType, o as stringType, r as enumType } from "../_libs/zod.mjs";
import { N as AudioLines, f as ShieldCheck, s as Sun, v as Moon, x as LogOut } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/trading.functions-BFr6kfAt.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
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
var KEY = "echotrade-theme";
function applyTheme(theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
}
function ThemeToggle() {
	const [theme, setTheme] = (0, import_react.useState)("light");
	(0, import_react.useEffect)(() => {
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
		variant: "outline",
		size: "sm",
		onClick: toggle,
		"aria-label": theme === "dark" ? "Switch to light theme" : "Switch to dark theme",
		title: theme === "dark" ? "Light mode" : "Dark mode",
		children: [theme === "dark" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: theme === "dark" ? "Light" : "Dark"
		})]
	});
}
function TopBar({ email, isAdmin, onSignOut, funds }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
		className: "sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto flex max-w-7xl items-center gap-2 px-3 py-3 sm:gap-4 sm:px-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/",
					className: "flex min-w-0 shrink-0 items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "glow-ring flex size-9 items-center justify-center rounded-lg bg-primary/15",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AudioLines, { className: "size-5 text-primary" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-display text-lg font-bold tracking-tight",
						children: ["echo", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-gradient",
							children: "trade"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden shrink-0 rounded-full border border-border/70 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground sm:inline",
					children: "NSE · BSE · INR"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2",
					children: [
						funds ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "num hidden rounded-md border border-border/70 bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground md:inline",
							children: ["Funds ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: funds
							})]
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeToggle, {}),
						isAdmin ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "outline",
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
								to: "/admin",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-4" }), " Admin"]
							})
						}) : null,
						email ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden max-w-[16ch] truncate text-xs text-muted-foreground lg:inline",
							children: email
						}) : null,
						onSignOut ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: onSignOut,
							"aria-label": "Sign out",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-4" })
						}) : null
					]
				})
			]
		})
	});
}
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
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
var brokerEnum = enumType([
	"zerodha",
	"upstox",
	"angel_one"
]);
var getWorkspace = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("2994df9aec10d8b9d530ef423d178df090389e311a0939fa48060714fd408c41"));
var verifyBrokerPin = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	broker: brokerEnum,
	pin: stringType().min(4).max(6)
}).parse(input)).handler(createSsrRpc("7056c011ce4dfa43d515fbe7cf71e12f168e4df5051fb1efb4a67aa9255279f7"));
var placeOrder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	broker: brokerEnum,
	symbol: stringType().min(1).max(20),
	exchange: enumType(["NSE", "BSE"]),
	side: enumType(["buy", "sell"]),
	quantity: numberType().int().positive().max(1e5),
	price: numberType().positive(),
	orderType: enumType(["market", "limit"]),
	pin: stringType().min(4).max(6),
	source: enumType(["voice", "manual"])
}).parse(input)).handler(createSsrRpc("5c7924311a663fb6e413d782896aff9466a5fd36b00810f9e33ce861eefce2b1"));
var toggleWatchlist = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	symbol: stringType().min(1).max(20),
	exchange: enumType(["NSE", "BSE"]),
	remove: booleanType()
}).parse(input)).handler(createSsrRpc("d71dbebeaf6cbb06579da82f15a383103d5164d5efe1515b56a2341591e196a0"));
var setBrokerConnection = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	broker: brokerEnum,
	connected: booleanType()
}).parse(input)).handler(createSsrRpc("75d163c6f2fdd191ae0bf4cf511d38a8b81b24246b3260c45481a54bff3842cc"));
/** Set up (or update) one broker account: holder name, client ID, PIN. Funds are randomised. */
var setupBrokerAccount = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => objectType({
	broker: brokerEnum,
	accountName: stringType().trim().min(2).max(60),
	clientCode: stringType().trim().min(3).max(20),
	pin: stringType().regex(/^\d{4,6}$/, "PIN must be 4-6 digits")
}).parse(input)).handler(createSsrRpc("3c6ff3ed6eb0e7e8c6ee3b2fe54366e7021028037093581d6d971dcb18fb9985"));
/** Admin only: every user with their brokers, funds and trading activity. */
var getAdminOverview = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(createSsrRpc("60d5251e95a57bad598f0fe11aa04d9d7d7ba9457def2a69fa513d4ab654853c"));
//#endregion
export { getAdminOverview as a, setBrokerConnection as c, useServerFn as d, verifyBrokerPin as f, createSsrRpc as i, setupBrokerAccount as l, ThemeToggle as n, getWorkspace as o, TopBar as r, placeOrder as s, Badge as t, toggleWatchlist as u };
