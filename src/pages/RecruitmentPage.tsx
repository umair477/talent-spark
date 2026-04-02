import { useState } from "react";
import { Search, Download, X, Star, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

function getScoreReason(score: number): string {
  if (score >= 90) return "Excellent skill match, strong interview performance, and relevant experience align closely with role requirements.";
  if (score >= 70) return "Good foundational skills with some gaps in specialized areas. Could benefit from mentorship in key competencies.";
  return "Significant gaps in required skills or experience. Interview revealed areas needing substantial development.";
}

function getScoreColor(score: number): string {
  if (score >= 90) return "hsl(var(--success))";
  if (score >= 70) return "hsl(var(--warning))";
  return "hsl(var(--destructive))";
}

function CircularScore({ score, size = 40 }: { score: number; size?: number }) {
  const stroke = 3.5;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="relative cursor-help" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth={stroke} />
            <circle
              cx={size / 2} cy={size / 2} r={radius} fill="none"
              stroke={color} strokeWidth={stroke}
              strokeDasharray={circumference} strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold">{score}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="left" className="max-w-[220px] text-xs">
        <p className="font-medium mb-1" style={{ color }}>{score}% Match</p>
        <p className="text-muted-foreground">{getScoreReason(score)}</p>
      </TooltipContent>
    </Tooltip>
  );
}

interface Candidate {
  id: string;
  name: string;
  role: string;
  matchScore: number;
  status: "Shortlisted" | "Under Review" | "Rejected" | "Interview Scheduled";
  email: string;
  experience: string;
  summary: string;
  skills: string[];
}

const candidates: Candidate[] = [
  { id: "1", name: "Priya Sharma", role: "Senior Frontend Engineer", matchScore: 95, status: "Shortlisted", email: "priya@email.com", experience: "6 years", summary: "Strong React/TypeScript background with experience in design systems and performance optimization. Excellent communication skills demonstrated during the AI-screened interview.", skills: ["React", "TypeScript", "Node.js", "GraphQL"] },
  { id: "2", name: "James Carter", role: "Product Designer", matchScore: 88, status: "Interview Scheduled", email: "james@email.com", experience: "4 years", summary: "Creative designer with a strong portfolio in SaaS products. Good understanding of user research methodologies and design thinking principles.", skills: ["Figma", "User Research", "Prototyping", "Design Systems"] },
  { id: "3", name: "Aisha Patel", role: "Data Analyst", matchScore: 76, status: "Under Review", email: "aisha@email.com", experience: "3 years", summary: "Solid analytical skills with experience in SQL and Python. Showed good problem-solving ability but could improve on stakeholder communication.", skills: ["SQL", "Python", "Tableau", "Excel"] },
  { id: "4", name: "Marcus Johnson", role: "DevOps Engineer", matchScore: 92, status: "Shortlisted", email: "marcus@email.com", experience: "5 years", summary: "Deep expertise in CI/CD pipelines and cloud infrastructure. Strong Kubernetes and Terraform knowledge with a passion for automation.", skills: ["AWS", "Kubernetes", "Terraform", "Docker"] },
  { id: "5", name: "Elena Rodriguez", role: "Backend Engineer", matchScore: 65, status: "Rejected", email: "elena@email.com", experience: "2 years", summary: "Shows potential but lacks experience in distributed systems. Interview revealed gaps in system design fundamentals.", skills: ["Java", "Spring Boot", "PostgreSQL"] },
  { id: "6", name: "David Kim", role: "ML Engineer", matchScore: 91, status: "Interview Scheduled", email: "david@email.com", experience: "4 years", summary: "Impressive knowledge of ML frameworks and deployment pipelines. Published two research papers on NLP. Very articulate in technical discussions.", skills: ["Python", "PyTorch", "MLOps", "NLP"] },
];

function getScoreBadgeVariant(score: number) {
  if (score >= 90) return "bg-success/10 text-success border-success/20";
  if (score >= 70) return "bg-warning/10 text-warning border-warning/20";
  return "bg-destructive/10 text-destructive border-destructive/20";
}

function getStatusVariant(status: string) {
  switch (status) {
    case "Shortlisted": return "bg-success/10 text-success border-success/20";
    case "Interview Scheduled": return "bg-primary/10 text-primary border-primary/20";
    case "Under Review": return "bg-warning/10 text-warning border-warning/20";
    case "Rejected": return "bg-destructive/10 text-destructive border-destructive/20";
    default: return "";
  }
}

export default function RecruitmentPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);

  const filtered = candidates.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      <div className="flex-1 flex flex-col p-6 min-w-0">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold">Recruitment Hub</h1>
            <p className="text-sm text-muted-foreground">{candidates.length} candidates in pipeline</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="pl-9 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden flex-1">
          <ScrollArea className="h-full">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Candidate</TableHead>
                  <TableHead className="font-medium">Role</TableHead>
                  <TableHead className="font-medium">AI Match</TableHead>
                  <TableHead className="font-medium">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => setSelected(c)}
                    className={cn(
                      "cursor-pointer transition-colors",
                      selected?.id === c.id && "bg-accent"
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                          {c.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{c.name}</p>
                          <p className="text-xs text-muted-foreground">{c.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.role}</TableCell>
                    <TableCell>
                      <CircularScore score={c.matchScore} />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", getStatusVariant(c.status))}>
                        {c.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>
      </div>

      {/* Drill-down Panel */}
      {selected && (
        <div className="w-96 border-l bg-card flex flex-col animate-slide-in-right">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-sm">Candidate Details</h3>
            <Button variant="ghost" size="icon" onClick={() => setSelected(null)} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <ScrollArea className="flex-1 p-4">
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                  {selected.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="font-semibold">{selected.name}</p>
                  <p className="text-sm text-muted-foreground">{selected.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-secondary/50 flex flex-col items-center justify-center">
                  <CircularScore score={selected.matchScore} size={56} />
                  <p className="text-xs text-muted-foreground mt-1">Match Score</p>
                </div>
                <div className="p-3 rounded-xl bg-secondary/50">
                  <p className="text-xs text-muted-foreground">Experience</p>
                  <p className="text-lg font-semibold">{selected.experience}</p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">AI Interview Summary</h4>
                <p className="text-sm leading-relaxed">{selected.summary}</p>
              </div>

              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Skills</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selected.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>

              <Button className="w-full" variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
}
