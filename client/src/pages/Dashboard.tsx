import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import {
  MessageSquare, Compass, FileText, Mic2, Map, Linkedin,
  Bell, User, ArrowRight, Sparkles, TrendingUp
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const quickActions = [
  { href: "/chat", icon: MessageSquare, label: "Start Chat", desc: "Talk to your AI mentor", color: "from-violet-500 to-purple-600" },
  { href: "/career-paths", icon: Compass, label: "Career Paths", desc: "Explore new directions", color: "from-rose-500 to-pink-600" },
  { href: "/cv-analysis", icon: FileText, label: "Analyze CV", desc: "Get resume feedback", color: "from-orange-500 to-amber-600" },
  { href: "/interview", icon: Mic2, label: "Practice Interview", desc: "Simulate interviews", color: "from-emerald-500 to-teal-600" },
  { href: "/roadmap", icon: Map, label: "Learning Roadmap", desc: "Plan your growth", color: "from-sky-500 to-blue-600" },
  { href: "/linkedin", icon: Linkedin, label: "LinkedIn Review", desc: "Optimize your profile", color: "from-indigo-500 to-violet-600" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = trpc.dashboard.getStats.useQuery();
  const { data: profile } = trpc.profile.get.useQuery();

  const statCards = [
    { label: "Chat Sessions", value: stats?.chatSessions ?? 0, icon: MessageSquare, color: "text-violet-600" },
    { label: "Saved Career Paths", value: stats?.savedPaths ?? 0, icon: Compass, color: "text-rose-600" },
    { label: "Interviews Completed", value: stats?.completedInterviews ?? 0, icon: Mic2, color: "text-emerald-600" },
    { label: "CV Analyses", value: stats?.cvAnalyses ?? 0, icon: FileText, color: "text-orange-600" },
  ];

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <AppLayout title="Dashboard">
      <div className="p-6 lg:p-8 space-y-8 animate-fade-in-up">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
              {greeting()}, {user?.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="text-muted-foreground mt-1">Here's your career progress overview</p>
          </div>
          <Button asChild className="gradient-primary text-white border-0 self-start">
            <Link href="/chat">
              <Sparkles className="w-4 h-4 mr-2" />
              Chat with AI Mentor
            </Link>
          </Button>
        </div>

        {/* Profile completion */}
        {!isLoading && stats && stats.profileCompletion < 100 && (
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/10">
            <CardContent className="p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-foreground text-sm">Complete your profile for better recommendations</p>
                    <span className="text-primary font-bold text-sm">{stats.profileCompletion}%</span>
                  </div>
                  <Progress value={stats.profileCompletion} className="h-2" />
                  <p className="text-xs text-muted-foreground">Add your current role, target role, skills, and career goals</p>
                </div>
                <Button size="sm" variant="outline" asChild className="flex-shrink-0">
                  <Link href="/profile">Update Profile <ArrowRight className="w-3.5 h-3.5 ml-1" /></Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">{isLoading ? "—" : value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                  <div className={`p-2 rounded-lg bg-muted ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick actions */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map(({ href, icon: Icon, label, desc, color }) => (
              <Link key={href} href={href}>
                <Card className="card-hover cursor-pointer group h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Profile summary */}
        {profile && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-display flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                Your Career Journey
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                {profile.currentRole && (
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Current Role</p>
                    <p className="font-medium text-sm text-foreground mt-0.5">{profile.currentRole}</p>
                  </div>
                )}
                {profile.targetRole && (
                  <div className="bg-primary/5 rounded-lg p-3 border border-primary/10">
                    <p className="text-xs text-muted-foreground">Target Role</p>
                    <p className="font-medium text-sm text-primary mt-0.5">{profile.targetRole}</p>
                  </div>
                )}
              </div>
              {profile.skills && (profile.skills as string[]).length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Your Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(profile.skills as string[]).slice(0, 8).map(skill => (
                      <span key={skill} className="bg-secondary text-secondary-foreground text-xs px-2.5 py-1 rounded-full font-medium">{skill}</span>
                    ))}
                    {(profile.skills as string[]).length > 8 && (
                      <span className="text-xs text-muted-foreground px-2 py-1">+{(profile.skills as string[]).length - 8} more</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
