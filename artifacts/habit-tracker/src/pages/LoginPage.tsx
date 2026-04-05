import { useState } from "react";
import { Eye, EyeOff, Rocket } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const { signIn, signUp } = useAuth();
  const [mode,     setMode]     = useState<"signin" | "signup">("signin");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [success,  setSuccess]  = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!email.trim() || !password.trim()) { setError("Please enter your email and password."); return; }
    setLoading(true);
    const err = mode === "signin"
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);
    setLoading(false);
    if (err) {
      setError(err);
    } else if (mode === "signup") {
      setSuccess("Account created! Check your email to confirm, then sign in.");
      setMode("signin");
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "#161819" }}
    >
      {/* Brand mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-[22px] flex items-center justify-center shadow-lg"
          style={{ background: "#ac6e5c" }}
        >
          <Rocket className="w-7 h-7 text-white" strokeWidth={1.8} />
        </div>
        <div className="text-center">
          <h1
            className="text-3xl font-black tracking-tight"
            style={{ color: "#f2f0e6", letterSpacing: "-0.03em" }}
          >
            Horizon Hub
          </h1>
          <p className="text-sm mt-1 tracking-wide" style={{ color: "#9c8b7a" }}>
            Your Personal Earth-Tone Journal
          </p>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm p-7"
        style={{
          background: "#211f1d",
          borderRadius: 28,
          border: "1px solid rgba(172,110,92,0.18)",
        }}
      >
        {/* Mode toggle */}
        <div
          className="flex mb-6 p-1"
          style={{ background: "rgba(255,255,255,0.05)", borderRadius: 14 }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className="flex-1 py-2 text-sm font-semibold transition-all"
              style={{
                borderRadius: 10,
                background: mode === m ? "#ac6e5c" : "transparent",
                color: mode === m ? "#f2f0e6" : "#9c8b7a",
                boxShadow: mode === m ? "0 2px 8px rgba(172,110,92,0.35)" : "none",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "#9c8b7a" }}
            >
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm focus:outline-none transition-all"
              style={{
                background: "#181c1e",
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.09)",
                color: "#f2f0e6",
              }}
              onFocus={(e) => (e.currentTarget.style.border = "1px solid #5c7c6c")}
              onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)")}
            />
          </div>

          {/* Password */}
          <div>
            <label
              className="text-xs font-semibold uppercase tracking-wider mb-1.5 block"
              style={{ color: "#9c8b7a" }}
            >
              Password
            </label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm focus:outline-none pr-12 transition-all"
                style={{
                  background: "#181c1e",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.09)",
                  color: "#f2f0e6",
                }}
                onFocus={(e) => (e.currentTarget.style.border = "1px solid #5c7c6c")}
                onBlur={(e)  => (e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)")}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                style={{ color: "#9c8b7a" }}
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error && (
            <p className="text-xs font-medium px-3 py-2 rounded-xl"
              style={{ color: "#f87171", background: "rgba(248,113,113,0.10)" }}>
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs font-medium px-3 py-2 rounded-xl"
              style={{ color: "#6ee7b7", background: "rgba(110,231,183,0.10)" }}>
              {success}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold transition-all mt-1"
            style={{
              background: loading ? "#6b5047" : "#ac6e5c",
              borderRadius: 14,
              color: "#f2f0e6",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 16px rgba(172,110,92,0.40)",
            }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Footer link */}
        <p className="text-xs text-center mt-5" style={{ color: "#9c8b7a" }}>
          {mode === "signin" ? (
            <>No account?{" "}
              <button
                onClick={() => setMode("signup")}
                className="font-semibold hover:underline"
                style={{ color: "#ac6e5c" }}
              >
                Create one
              </button>
            </>
          ) : (
            <>Already have one?{" "}
              <button
                onClick={() => setMode("signin")}
                className="font-semibold hover:underline"
                style={{ color: "#ac6e5c" }}
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>

      <p className="text-xs mt-6" style={{ color: "#6b5f55" }}>
        Offline-first · Cloud-synced · Private
      </p>
    </div>
  );
}
