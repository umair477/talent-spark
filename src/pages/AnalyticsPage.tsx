import { Users, UserCheck, CalendarDays, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { fetchAnalyticsOverview } from "@/lib/api";

const ICONS = {
  "Total Candidates": Users,
  Shortlisted: UserCheck,
  "Pending Leaves": CalendarDays,
  "Avg Match Score": TrendingUp,
};

const COLORS = ["hsl(217,91%,60%)", "hsl(142,71%,45%)", "hsl(38,92%,50%)", "hsl(280,65%,60%)"];

export default function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["analytics-overview"],
    queryFn: fetchAnalyticsOverview,
  });

  const stats = data?.stats ?? [];
  const hiringData = (data?.monthly_hires ?? []).map((point) => ({ month: point.label, hires: point.value }));
  const departmentData = (data?.candidates_by_department ?? []).map((point) => ({ name: point.label, value: point.value }));

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Analytics Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of HR metrics and trends</p>
      </div>

      {isLoading && (
        <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
          Loading analytics from the backend...
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border bg-card p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{s.label}</span>
              {(() => {
                const Icon = ICONS[s.label as keyof typeof ICONS] ?? TrendingUp;
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold">{s.value}</span>
              <span className="text-xs text-success font-medium">{s.change}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Monthly Hires</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={hiringData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="hires" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <h3 className="text-sm font-semibold mb-4">Candidates by Department</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={departmentData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={4} dataKey="value">
                {departmentData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {departmentData.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                {d.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
