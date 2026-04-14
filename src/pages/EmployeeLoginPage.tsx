import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";

export default function EmployeeLoginPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useEmployeeAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast({
        title: "Signed in",
        description: "Your employee session is ready.",
      });
      navigate("/employee/dashboard");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid email or password.";
      setError(message);
      toast({
        title: "Sign-in failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-100 p-6">
      <div className="w-full max-w-lg rounded-[2rem] border bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <LockKeyhole className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Employee Login</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sign in with your official account</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Use the credentials you created during employee signup. Your session is stored securely in an httpOnly cookie.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Official Email</label>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="raj.patel@talentspark.dev"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Password</label>
              <span className="text-xs text-muted-foreground">Forgot Password? Coming soon.</span>
            </div>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Need to activate your account first?{" "}
          <Link to="/employee/signup" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
