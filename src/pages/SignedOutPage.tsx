import { ArrowRight, BriefcaseBusiness, Building2, ShieldCheck } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { resumeDemoSession, type DemoRole } from "@/lib/auth";

const demoSessions: Array<{
  role: DemoRole;
  title: string;
  description: string;
  icon: typeof ShieldCheck;
}> = [
  {
    role: "ADMIN",
    title: "Admin Workspace",
    description: "Full access to recruitment, leave approvals, analytics, and user promotions.",
    icon: ShieldCheck,
  },
  {
    role: "CANDIDATE",
    title: "Candidate Workspace",
    description: "Jobs landing and personal application status with recruitment data isolation.",
    icon: BriefcaseBusiness,
  },
];

export default function SignedOutPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-100 p-6">
      <div className="w-full max-w-4xl rounded-[2rem] border bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Secure Session Entry</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose how you want to enter Talent Spark</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Employees now use dedicated signup and login pages backed by HR pre-registration. Admin and candidate demo
          entry points are still available for local testing.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border p-5 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Employee Access</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Existing employees can activate their account with an official company email and then sign in securely.
            </p>
            <div className="mt-5 flex gap-2">
              <Button asChild>
                <Link to="/employee/login">Sign In</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/employee/signup">Sign Up</Link>
              </Button>
            </div>
          </div>

          {demoSessions.map((session) => (
            <button
              key={session.role}
              type="button"
              onClick={() => {
                resumeDemoSession(session.role);
                navigate("/");
              }}
              className="rounded-[1.5rem] border p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <session.icon className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-lg font-semibold">{session.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{session.description}</p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">
                Enter workspace
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border bg-slate-50 px-4 py-3 text-sm text-muted-foreground">
          Candidate applications are linked to the signed-in user, and employee auth now uses server-validated session cookies instead of browser local storage.
        </div>
      </div>
    </main>
  );
}
