import { i as __toESM } from "../_runtime.mjs";
import { g as useNavigate, h as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { u as require_react } from "../_libs/@floating-ui/react-dom+[...].mjs";
import { o as require_jsx_runtime } from "../_libs/@radix-ui/react-collection+[...].mjs";
import { a as useAuth, n as Input, t as Button } from "./useAuth-BPCYffQM.mjs";
import { F as BadgeIndianRupee, R as Activity, i as Users, p as ShieldCheck, x as Mic } from "../_libs/lucide-react.mjs";
import { a as getAdminOverview, d as useServerFn, r as TopBar, t as Badge } from "./trading.functions-BfN3p8_i.mjs";
import { a as brokerLabel, s as formatINR } from "./stocks-ey59sCnf.mjs";
import { t as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/admin-D2-doDrN.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AdminPage() {
	const { user, loading, signOut } = useAuth();
	const navigate = useNavigate();
	const fetchOverview = useServerFn(getAdminOverview);
	const [search, setSearch] = (0, import_react.useState)("");
	const { data, isError, isLoading } = useQuery({
		queryKey: ["admin-overview"],
		queryFn: () => fetchOverview(),
		enabled: !!user,
		retry: false
	});
	(0, import_react.useEffect)(() => {
		if (!loading && !user) navigate({ to: "/auth" });
	}, [
		loading,
		user,
		navigate
	]);
	const users = (data?.users ?? []).filter((u) => (u.email + (u.full_name ?? "")).toLowerCase().includes(search.trim().toLowerCase()));
	const orders = data?.orders ?? [];
	const totalFunds = (data?.users ?? []).reduce((s, u) => s + u.funds, 0);
	const voiceShare = orders.length ? Math.round(orders.filter((o) => o.source === "voice").length / orders.length * 100) : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TopBar, {
			email: user?.email,
			isAdmin: true,
			onSignOut: signOut
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
			className: "mx-auto max-w-7xl space-y-6 px-4 py-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
							className: "font-display flex items-center gap-2 text-2xl font-bold",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, { className: "size-6 text-primary" }), " Admin control room"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							children: "restricted"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							asChild: true,
							variant: "ghost",
							size: "sm",
							className: "ml-auto",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/",
								children: "Back to terminal"
							})
						})
					]
				}),
				isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground",
					children: "Loading platform data…"
				}) : null,
				isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
					className: "panel p-6",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-lg font-semibold",
						children: "Admin access required"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-sm text-muted-foreground",
						children: "This account isn't an EchoTrade admin. Sign in with the admin email to view every user."
					})]
				}) : null,
				data ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
						children: [
							{
								icon: Users,
								label: "Users",
								value: String(data.users.length)
							},
							{
								icon: BadgeIndianRupee,
								label: "Funds under platform",
								value: formatINR(totalFunds, 0)
							},
							{
								icon: Activity,
								label: "Orders",
								value: String(orders.length)
							},
							{
								icon: Mic,
								label: "Voice-placed",
								value: `${voiceShare}%`
							}
						].map((k) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "panel p-5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(k.icon, { className: "size-5 text-primary" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "num mt-3 text-2xl font-semibold",
									children: k.value
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs uppercase tracking-[0.16em] text-muted-foreground",
									children: k.label
								})
							]
						}, k.label))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-3 border-b border-border/60 p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
								className: "font-display text-lg font-semibold",
								children: "All users"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
								value: search,
								onChange: (e) => setSearch(e.target.value),
								placeholder: "Search by email or name",
								className: "max-w-xs"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "divide-y divide-border/50",
							children: users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-3 p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex flex-wrap items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0 flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-display text-sm font-semibold",
												children: u.full_name ?? "Unnamed trader"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "num text-xs text-muted-foreground",
												children: u.email
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "num text-right text-xs text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm text-foreground",
													children: formatINR(u.funds, 0)
												}),
												u.orderCount,
												" orders · ",
												u.voiceOrders,
												" by voice · turnover ",
												formatINR(u.turnover, 0)
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: u.brokers.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "num rounded-md border border-border/70 bg-surface-2/50 px-2 py-1 text-[11px]",
											children: [
												brokerLabel(b.broker),
												" · ",
												b.client_code,
												" · ",
												formatINR(Number(b.balance_inr), 0),
												" ·",
												" ",
												b.is_connected ? "live" : "off"
											]
										}, b.id))
									}),
									u.holdings.length ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-2",
										children: u.holdings.map((h) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "num rounded-md bg-primary/10 px-2 py-1 text-[11px] text-primary",
											children: [
												h.symbol,
												" × ",
												h.quantity,
												" @ ",
												formatINR(Number(h.avg_price))
											]
										}, h.id))
									}) : null
								]
							}, u.id))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
						className: "panel overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "font-display border-b border-border/60 p-4 text-lg font-semibold",
							children: "Platform order flow"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "divide-y divide-border/50",
							children: orders.slice(0, 60).map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-wrap items-center gap-3 px-4 py-2.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: o.side === "buy" ? "default" : "destructive",
										children: o.side.toUpperCase()
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-display text-sm font-semibold",
										children: o.symbol
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "num text-xs text-muted-foreground",
										children: [
											o.quantity,
											" @ ",
											formatINR(Number(o.price)),
											" · ",
											brokerLabel(o.broker),
											" · ",
											o.exchange,
											" ·",
											" ",
											o.source
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "num ml-auto text-sm",
										children: formatINR(Number(o.total_inr))
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "num text-[11px] text-muted-foreground",
										children: new Date(o.created_at).toLocaleString("en-IN")
									})
								]
							}, o.id))
						})]
					})
				] }) : null
			]
		})]
	});
}
//#endregion
export { AdminPage as component };
