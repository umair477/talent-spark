import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Eye, EyeOff, X } from "lucide-react";
import { fetchPublicJobListings, unifiedLogin } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useEmployeeAuth } from "@/hooks/use-employee-auth";
import { useSessionProfile } from "@/hooks/use-session-profile";
import { clearExpiredStoredTokens, dashboardPathForRole, persistSessionFromLogin, signOutDemoSession } from "@/lib/auth";

function summarizeDescription(text: string, maxLength = 150) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength).trim()}...`;
}

export default function PublicLandingPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const jobsSectionRef = useRef<HTMLElement | null>(null);
  const employeeAuth = useEmployeeAuth();
  const { data: sessionProfile, isError: sessionError } = useSessionProfile();

  const [isSigninOpen, setIsSigninOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signinError, setSigninError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    clearExpiredStoredTokens();
  }, []);

  useEffect(() => {
    if (sessionError && !employeeAuth.isAuthenticated) {
      signOutDemoSession();
    }
  }, [employeeAuth.isAuthenticated, sessionError]);

  const resolvedProfile = employeeAuth.employee
    ? {
        full_name: employeeAuth.employee.full_name,
        role: employeeAuth.employee.role,
      }
    : sessionProfile
      ? {
          full_name: sessionProfile.full_name,
          role: sessionProfile.role,
        }
      : null;

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ["public-job-listings"],
    queryFn: fetchPublicJobListings,
    retry: false,
  });

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSigninError("");

    if (!email.trim() || !password.trim()) {
      setSigninError("Please enter both email and password.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await unifiedLogin({ email, password });
      const role = persistSessionFromLogin(response.access_token);
      setIsSigninOpen(false);
      setPassword("");
      toast({
        title: "Signed in",
        description: `Welcome back, ${response.full_name}.`,
      });
      navigate(dashboardPathForRole(role));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid email or password.";
      setSigninError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_#e0f2fe_0%,_#ffffff_45%,_#ecfdf5_100%)]">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 md:px-6">
          <div className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <BriefcaseBusiness className="h-4 w-4" />
            </span>
            Talent Spark Careers
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => jobsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              View Open Positions
            </Button>
            {resolvedProfile ? (
              <>
                <span className="hidden rounded-full border bg-muted/40 px-3 py-1 text-xs text-muted-foreground md:inline-flex">
                  {resolvedProfile.full_name}
                </span>
                <Button onClick={() => navigate(dashboardPathForRole(resolvedProfile.role as "ADMIN" | "EMPLOYEE" | "CANDIDATE"))}>
                  Go to Dashboard
                </Button>
              </>
            ) : (
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => setIsSigninOpen(true)}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-12 pt-8 md:px-6 md:pt-14">
        <section className="rounded-[2.25rem] border bg-white/80 p-8 shadow-sm md:p-12">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Now Hiring</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Join Our Team - We&apos;re Hiring Talented People
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Build meaningful products with a collaborative team. Explore current opportunities and apply in minutes
            through our AI-powered application assistant.
          </p>
          <Button
            className="mt-7 gap-2"
            size="lg"
            onClick={() => jobsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
          >
            View Open Positions
            <ArrowRight className="h-4 w-4" />
          </Button>
        </section>

        <section ref={jobsSectionRef} id="open-positions" className="mt-12 space-y-5">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Open Positions</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">Find a role that fits your strengths</h2>
          </div>

          {isLoading ? (
            <div className="rounded-3xl border bg-white p-8 text-sm text-muted-foreground shadow-sm">Loading open positions...</div>
          ) : jobs.length === 0 ? (
            <div className="rounded-3xl border bg-white p-8 text-sm text-muted-foreground shadow-sm">
              No open positions at the moment. Check back soon!
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {jobs.map((job) => (
                <article key={job.job_id} className="flex h-full flex-col rounded-3xl border bg-white p-6 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-xl font-semibold leading-7">{job.title}</h3>
                    <Badge variant="outline">{job.employment_type}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{job.experience_years}+ years experience</p>
                  <p className="mt-4 text-sm leading-6 text-muted-foreground">
                    {summarizeDescription(job.description)}
                  </p>
                  <Button
                    className="mt-6 gap-2"
                    onClick={() =>
                      navigate(`/apply/${job.job_id}`, {
                        state: {
                          job_id: job.job_id,
                          job_title: job.title,
                        },
                      })
                    }
                  >
                    Apply Now
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>

      <Dialog open={isSigninOpen} onOpenChange={setIsSigninOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>Welcome Back</DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsSigninOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription>Sign in with your company credentials to continue.</DialogDescription>
          </DialogHeader>

          <form className="space-y-4" onSubmit={handleSignIn}>
            <div className="space-y-2">
              <Label htmlFor="signin-email">Email</Label>
              <Input
                id="signin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signin-password">Password</Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1 h-8 w-8"
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
            {signinError ? <p className="text-sm text-destructive">{signinError}</p> : <div className="h-5" />}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
