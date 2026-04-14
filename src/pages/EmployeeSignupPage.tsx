import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";

function passwordChecks(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export default function EmployeeSignupPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signup } = useEmployeeAuth();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirm_password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const checks = useMemo(() => passwordChecks(form.password), [form.password]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.full_name.trim()) {
      nextErrors.full_name = "Full name is required.";
    }
    if (!form.email.trim()) {
      nextErrors.email = "Official email is required.";
    }
    if (!checks.length || !checks.uppercase || !checks.number || !checks.special) {
      nextErrors.password = "Password does not meet the strength requirements.";
    }
    if (form.password !== form.confirm_password) {
      nextErrors.confirm_password = "Passwords do not match.";
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const message = await signup(form);
      toast({
        title: "Account created",
        description: message,
      });
      navigate("/employee/login");
    } catch (error) {
      toast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Unable to create the employee account.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-emerald-100 p-6">
      <div className="w-full max-w-xl rounded-[2rem] border bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Employee Signup</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Activate your employee account</h1>
          </div>
        </div>

        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Only employees already registered by HR can complete signup. Use your official company email exactly as provided by HR.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="text-sm font-medium">Full Name</label>
            <Input
              value={form.full_name}
              onChange={(event) => setForm((current) => ({ ...current, full_name: event.target.value }))}
              placeholder="Raj Patel"
            />
            {errors.full_name && <p className="text-xs text-destructive">{errors.full_name}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Official Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
              placeholder="raj.patel@talentspark.dev"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={form.password}
              onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              placeholder="Create a strong password"
            />
            <div className="grid gap-2 rounded-2xl border bg-muted/20 p-3 text-xs text-muted-foreground sm:grid-cols-2">
              <p className={checks.length ? "text-emerald-700" : ""}>At least 8 characters</p>
              <p className={checks.uppercase ? "text-emerald-700" : ""}>One uppercase letter</p>
              <p className={checks.number ? "text-emerald-700" : ""}>One number</p>
              <p className={checks.special ? "text-emerald-700" : ""}>One special character</p>
            </div>
            {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Confirm Password</label>
            <Input
              type="password"
              value={form.confirm_password}
              onChange={(event) => setForm((current) => ({ ...current, confirm_password: event.target.value }))}
              placeholder="Re-enter your password"
            />
            {errors.confirm_password && <p className="text-xs text-destructive">{errors.confirm_password}</p>}
          </div>

          <Button className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already activated?{" "}
          <Link to="/employee/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
