import { n as Input, r as Button, t as useAuth } from "./useAuth-BGH1l0ds.js";
import { t as supabase } from "./client-BwL7Prxy.js";
import { a as Label, i as TabsTrigger, n as TabsContent, r as TabsList, t as Tabs } from "./tabs-Dd9YRrJs.js";
import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { jsx, jsxs } from "react/jsx-runtime";
import { toast } from "sonner";
import { AudioLines } from "lucide-react";
import { createLovableAuth } from "@lovable.dev/cloud-auth-js";
//#region src/integrations/lovable/index.ts
var lovableAuth = createLovableAuth();
var lovable = { auth: { signInWithOAuth: async (provider, opts) => {
	const result = await lovableAuth.signInWithOAuth(provider, {
		...opts,
		extraParams: { ...opts?.extraParams }
	});
	if (result.redirected) return result;
	if (result.error) return result;
	try {
		await supabase.auth.setSession(result.tokens);
	} catch (e) {
		return { error: e instanceof Error ? e : new Error(String(e)) };
	}
	return result;
} } };
//#endregion
//#region src/routes/auth.tsx?tsr-split=component
function AuthPage() {
	const navigate = useNavigate();
	const { user, loading } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [fullName, setFullName] = useState("");
	const [busy, setBusy] = useState(false);
	useEffect(() => {
		if (!loading && user) navigate({ to: "/" });
	}, [
		loading,
		user,
		navigate
	]);
	const signIn = async () => {
		setBusy(true);
		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});
		setBusy(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Welcome back to EchoTrade");
		navigate({ to: "/" });
	};
	const signUp = async () => {
		setBusy(true);
		const { error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				data: { full_name: fullName },
				emailRedirectTo: window.location.origin
			}
		});
		setBusy(false);
		if (error) {
			toast.error(error.message);
			return;
		}
		toast.success("Account created — three broker accounts linked");
		navigate({ to: "/" });
	};
	const google = async () => {
		const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
		if (result.error) {
			toast.error("Google sign-in failed");
			return;
		}
		if (result.redirected) return;
		navigate({ to: "/" });
	};
	return /* @__PURE__ */ jsx("main", {
		className: "flex min-h-screen items-center justify-center px-4 py-12",
		children: /* @__PURE__ */ jsxs("div", {
			className: "panel w-full max-w-md p-6",
			children: [
				/* @__PURE__ */ jsxs("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ jsx("span", {
						className: "glow-ring flex size-9 items-center justify-center rounded-lg bg-primary/15",
						children: /* @__PURE__ */ jsx(AudioLines, { className: "size-5 text-primary" })
					}), /* @__PURE__ */ jsxs("span", {
						className: "font-display text-xl font-bold",
						children: ["echo", /* @__PURE__ */ jsx("span", {
							className: "text-gradient",
							children: "trade"
						})]
					})]
				}),
				/* @__PURE__ */ jsx("h1", {
					className: "font-display mt-5 text-2xl font-semibold",
					children: "Voice trading, NSE & BSE"
				}),
				/* @__PURE__ */ jsx("p", {
					className: "mt-1 text-sm text-muted-foreground",
					children: "One login, three linked broker accounts, all funds in rupees."
				}),
				/* @__PURE__ */ jsxs(Tabs, {
					defaultValue: "signin",
					className: "mt-6",
					children: [
						/* @__PURE__ */ jsxs(TabsList, {
							className: "w-full",
							children: [/* @__PURE__ */ jsx(TabsTrigger, {
								value: "signin",
								className: "flex-1",
								children: "Sign in"
							}), /* @__PURE__ */ jsx(TabsTrigger, {
								value: "signup",
								className: "flex-1",
								children: "Create account"
							})]
						}),
						/* @__PURE__ */ jsxs(TabsContent, {
							value: "signin",
							className: "space-y-3 pt-4",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "email",
									children: "Email"
								}), /* @__PURE__ */ jsx(Input, {
									id: "email",
									type: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value)
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "password",
									children: "Password"
								}), /* @__PURE__ */ jsx(Input, {
									id: "password",
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value)
								})] }),
								/* @__PURE__ */ jsx(Button, {
									className: "w-full",
									onClick: signIn,
									disabled: busy,
									children: "Sign in"
								})
							]
						}),
						/* @__PURE__ */ jsxs(TabsContent, {
							value: "signup",
							className: "space-y-3 pt-4",
							children: [
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "name",
									children: "Full name"
								}), /* @__PURE__ */ jsx(Input, {
									id: "name",
									value: fullName,
									onChange: (e) => setFullName(e.target.value)
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "email2",
									children: "Email"
								}), /* @__PURE__ */ jsx(Input, {
									id: "email2",
									type: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value)
								})] }),
								/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(Label, {
									htmlFor: "password2",
									children: "Password"
								}), /* @__PURE__ */ jsx(Input, {
									id: "password2",
									type: "password",
									value: password,
									onChange: (e) => setPassword(e.target.value)
								})] }),
								/* @__PURE__ */ jsx(Button, {
									className: "w-full",
									onClick: signUp,
									disabled: busy,
									children: "Create account"
								})
							]
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", {
					className: "my-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground",
					children: [
						/* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-border" }),
						" or ",
						/* @__PURE__ */ jsx("span", { className: "h-px flex-1 bg-border" })
					]
				}),
				/* @__PURE__ */ jsx(Button, {
					variant: "outline",
					className: "w-full",
					onClick: google,
					children: "Continue with Google"
				})
			]
		})
	});
}
//#endregion
export { AuthPage as component };
