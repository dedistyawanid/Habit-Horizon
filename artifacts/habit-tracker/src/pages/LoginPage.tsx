import { useState } from "react";
import { Eye, EyeOff, Leaf } from "lucide-react";
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
      style={{ background: "linear-gradient(160deg, #F5F4F0 0%, #EDE9E0 60%, #E4DDD0 100%)" }}
    >
      {/* Logo mark */}
      <div className="mb-8 flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-[22px] flex items-center justify-center shadow-md"
          style={{ background: "linear-gradient(135deg, #556B2F 0%, #6B8A3A 100%)" }}
        >
          <Leaf className="w-7 h-7 text-white" strokeWidth={1.8} />
        </div>
        <div className="text-center">
          <h1
            className="text-4xl font-black tracking-tight text-gray-900"
            style={{ fontFamily: "'Georgia', 'Times New Roman', serif", letterSpacing: "-0.03em" }}
          >
            Habit Horizon
          </h1>
          <p className="text-sm text-gray-500 mt-1 tracking-wide">Your personal growth companion</p>
        </div>
      </div>

      {/* Card */}
      <div
        className="w-full max-w-sm p-7"
        style={{
          background: "rgba(255,255,255,0.9)",
          borderRadius: 28,
          border: "1px solid #E5E0D8",
          backdropFilter: "blur(10px)",
        }}
      >
        {/* Mode toggle */}
        <div
          className="flex mb-6 p-1"
          style={{ background: "#F5F4F0", borderRadius: 14 }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); setSuccess(null); }}
              className="flex-1 py-2 text-sm font-semibold transition-all"
              style={{
                borderRadius: 10,
                background: mode === m ? "#fff" : "transparent",
                color:   mode === m ? "#556B2F" : "#9CA3AF",
                boxShadow: mode === m ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 text-sm text-gray-900 focus:outline-none"
              style={{
                background: "#F5F4F0",
                borderRadius: 14,
                border: "1px solid #E5E0D8",
              }}
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPwd ? "text" : "password"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 text-sm text-gray-900 focus:outline-none pr-12"
                style={{
                  background: "#F5F4F0",
                  borderRadius: 14,
                  border: "1px solid #E5E0D8",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error / Success */}
          {error   && <p className="text-xs text-red-500 font-medium bg-red-50 rounded-xl px-3 py-2">{error}</p>}
          {success && <p className="text-xs text-emerald-600 font-medium bg-emerald-50 rounded-xl px-3 py-2">{success}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold text-white transition-all mt-1"
            style={{
              background: loading ? "#9CA3AF" : "linear-gradient(135deg, #556B2F 0%, #6B8A3A 100%)",
              borderRadius: 14,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-xs text-center text-gray-400 mt-5">
          {mode === "signin" ? (
            <>No account? <button onClick={() => setMode("signup")} className="text-primary font-semibold hover:underline">Create one</button></>
          ) : (
            <>Already have one? <button onClick={() => setMode("signin")} className="text-primary font-semibold hover:underline">Sign in</button></>
          )}
        </p>
      </div>

      <p className="text-xs text-gray-400 mt-6">Offline-first · Cloud-synced · Private</p>
    </div>
  );
}
