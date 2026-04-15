import { ArrowRight, BriefcaseBusiness, LockKeyhole, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function SignedOutPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-sky-100 p-6">
      <div className="w-full max-w-3xl rounded-[2rem] border bg-white/90 p-8 shadow-2xl shadow-slate-200/60 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.24em] text-muted-foreground">Secure Session</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">You are signed out</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Continue to the public landing page and sign in from the top-right corner. Employees can still activate a new
          account through signup when invited by HR.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border p-5 text-left md:col-span-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Unified Sign-In</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Admin and employee users sign in from the landing page modal and are redirected automatically by role.
            </p>
            <Button asChild className="mt-5 gap-2">
              <Link to="/">
                Go to Landing Page
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="rounded-[1.5rem] border p-5 text-left">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-lg font-semibold">Employee Tools</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Need account activation first? Use the signup flow.</p>
            <div className="mt-5 flex gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/employee/login">
                  <LockKeyhole className="h-4 w-4" />
                  Login
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/employee/signup">
                  <UserPlus className="h-4 w-4" />
                  Signup
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
