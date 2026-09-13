import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Radar, Sparkles, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import api, { formatApiErrorDetail } from "../lib/api";
import { Button, Input, Spinner } from "../components/ui";

export default function Login() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login | signup | forgot
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (user) navigate("/", { replace: true }); }, [user, navigate]);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") { await login(form.email, form.password); toast.success("Welcome back"); }
      else if (mode === "signup") { await register(form.email, form.password, form.name); toast.success("Account created"); }
      else { await api.post("/auth/forgot-password", { email: form.email }); toast.success("If that email exists, a reset link was sent (check server logs in demo)."); setMode("login"); }
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left brand panel */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden grain border-r border-line">
        <div className="absolute inset-0 bg-gradient-to-br from-brand/20 via-canvas to-violet/20" />
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand/20 border border-brand/40 flex items-center justify-center"><Radar className="text-accent" /></div>
          <span className="font-heading font-bold text-lg">Competitor IQ</span>
        </div>
        <div className="relative">
          <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-4">Know where you win,<br />where you lose,<br /><span className="text-accent">and what to do next.</span></h1>
          <p className="text-tsecondary max-w-md text-lg">AI-powered competitive intelligence. Analyze any competitor's website, benchmark against your product, and turn data into action.</p>
        </div>
        <div className="relative flex gap-3 text-xs text-tsecondary">
          <span className="flex items-center gap-1.5"><Sparkles size={14} className="text-violet" /> Powered by GPT-5.4</span>
          <span>•</span><span>Live website analysis</span><span>•</span><span>Evidence-based</span>
        </div>
      </div>

      {/* Right form */}
      <div className="flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
            <div className="w-9 h-9 rounded-lg bg-brand/20 border border-brand/40 flex items-center justify-center"><Radar size={18} className="text-accent" /></div>
            <span className="font-heading font-bold">Competitor IQ</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">
            {mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
          </h2>
          <p className="text-sm text-tsecondary mb-6">
            {mode === "login" ? "Welcome back to your intelligence hub." : mode === "signup" ? "Start benchmarking in minutes." : "Enter your email to receive a reset link."}
          </p>
          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            {mode === "signup" && <Input label="Name" placeholder="Alex Rivera" value={form.name} onChange={set("name")} data-testid="input-name" />}
            <Input label="Email" type="email" placeholder="you@company.com" value={form.email} onChange={set("email")} data-testid="input-email" required />
            {mode !== "forgot" && <Input label="Password" type="password" placeholder="••••••••" value={form.password} onChange={set("password")} data-testid="input-password" required />}
            <Button type="submit" size="lg" className="w-full" disabled={loading} data-testid="auth-submit">
              {loading ? <Spinner className="w-4 h-4" /> : <>{mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"} <ArrowRight size={16} /></>}
            </Button>
          </form>
          <div className="mt-6 text-sm text-tsecondary space-y-2 text-center">
            {mode === "login" && <>
              <div>New here? <button onClick={() => setMode("signup")} className="text-accent hover:underline" data-testid="switch-signup">Create an account</button></div>
              <div><button onClick={() => setMode("forgot")} className="text-tmuted hover:text-accent hover:underline" data-testid="switch-forgot">Forgot password?</button></div>
            </>}
            {mode === "signup" && <div>Already have an account? <button onClick={() => setMode("login")} className="text-accent hover:underline" data-testid="switch-login">Sign in</button></div>}
            {mode === "forgot" && <div><button onClick={() => setMode("login")} className="text-accent hover:underline">Back to sign in</button></div>}
          </div>
          <div className="mt-8 p-3 rounded-lg bg-surface-2/60 border border-line text-xs text-tsecondary text-center">
            Demo account — <span className="font-mono text-accent">admin@example.com</span> / <span className="font-mono text-accent">admin123</span>
          </div>
        </div>
      </div>
    </div>
  );
}
