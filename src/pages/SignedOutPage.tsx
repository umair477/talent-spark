import { ArrowRight, BriefcaseBusiness, Building2, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
    role: "EMPLOYEE",
    title: "Employee Workspace",
    description: "Chatbot access plus personal leave balance and history only.",
    icon: Building2,
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
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Choose a Talent Spark role to continue</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          This session chooser lets you test the new RBAC architecture. Candidates go to jobs, employees get chatbot
          and leave access, and admins unlock the full dashboard.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
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
          Candidate applications are linked to the signed-in user, and candidate chat/sidebar access is intentionally
          restricted until promotion to employee.
        </div>
      </div>
    </main>
  );
}
