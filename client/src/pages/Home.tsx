import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import {
  Sparkles, MessageSquare, Compass, FileText, Mic2,
  Map, Linkedin, Bell, ArrowRight, Star, CheckCircle2
} from "lucide-react";

const features = [
  { icon: MessageSquare, title: "AI Career Chatbot", desc: "Get personalized career guidance with real-time AI responses tailored to your goals.", color: "from-violet-500 to-purple-600" },
  { icon: Compass, title: "Career Path Recommendations", desc: "Discover curated career paths in Data Science, AI, Product Management, and more.", color: "from-rose-500 to-pink-600" },
  { icon: FileText, title: "CV Analysis", desc: "Upload your resume and receive AI-powered feedback on strengths and improvements.", color: "from-orange-500 to-amber-600" },
  { icon: Mic2, title: "Interview Simulation", desc: "Practice with AI-generated questions at beginner, intermediate, or advanced levels.", color: "from-emerald-500 to-teal-600" },
  { icon: Map, title: "Learning Roadmap", desc: "Get a personalized step-by-step learning plan with curated resources.", color: "from-sky-500 to-blue-600" },
  { icon: Linkedin, title: "LinkedIn Profile Review", desc: "Paste your LinkedIn profile and get actionable optimization suggestions.", color: "from-indigo-500 to-violet-600" },
];

const stats = [
  { value: "9", label: "AI-Powered Features" },
  { value: "100%", label: "Personalized Guidance" },
  { value: "24/7", label: "Available Anytime" },
];

export default function Home() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-display font-bold text-foreground">CareerMentor AI</span>
              <span className="hidden sm:inline text-xs text-muted-foreground ml-2">for Women in Tech</span>
            </div>
          </div>
          {!loading && (
            user ? (
              <Button asChild>
                <Link href="/dashboard">Go to Dashboard <ArrowRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            ) : (
              <Button asChild className="gradient-primary text-white border-0">
                <a href={getLoginUrl()}>Get Started Free</a>
              </Button>
            )
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 gradient-soft opacity-60" />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-48 h-48 rounded-full bg-accent/20 blur-2xl" />
        <div className="container relative text-center space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-accent text-accent-foreground px-4 py-1.5 rounded-full text-sm font-medium">
            <Star className="w-3.5 h-3.5 fill-current" />
            AI-Powered Career Guidance for Women in Tech
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-foreground leading-tight max-w-4xl mx-auto">
            Your Personal{" "}
            <span className="text-gradient">AI Career Mentor</span>
            {" "}in Technology
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Break barriers and accelerate your tech career with personalized AI guidance. From career path discovery to interview preparation — we've got you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <Button size="lg" asChild className="gradient-primary text-white border-0 shadow-lg">
                <Link href="/dashboard">Open Dashboard <ArrowRight className="w-5 h-5 ml-2" /></Link>
              </Button>
            ) : (
              <>
                <Button size="lg" asChild className="gradient-primary text-white border-0 shadow-lg">
                  <a href={getLoginUrl()}>Start Your Journey Free <ArrowRight className="w-5 h-5 ml-2" /></a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="#features">Explore Features</a>
                </Button>
              </>
            )}
          </div>
          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-8 pt-4">
            {stats.map(s => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-display font-bold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-14 space-y-3">
            <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">Everything You Need to Succeed</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Six powerful AI tools designed specifically for women building careers in technology.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="card-hover border-border bg-card group cursor-default">
                <CardContent className="p-6 space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-sm`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-lg text-card-foreground">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-20">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">Built for Women Who Are Changing Tech</h2>
              <p className="text-muted-foreground leading-relaxed">We understand the unique challenges women face in technology. Our AI mentor is trained to provide empowering, practical, and bias-aware career guidance.</p>
              <div className="space-y-3">
                {[
                  "Personalized to your current skills and goals",
                  "Actionable advice, not generic suggestions",
                  "Encourages growth at every career stage",
                  "Weekly career tips to keep you motivated",
                ].map(item => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
              {!user && (
                <Button asChild className="gradient-primary text-white border-0">
                  <a href={getLoginUrl()}>Join Now — It's Free <ArrowRight className="w-4 h-4 ml-2" /></a>
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Bell, title: "Weekly Tips", desc: "Automated career insights every Monday morning" },
                { icon: MessageSquare, title: "24/7 Chat", desc: "AI mentor available whenever you need guidance" },
                { icon: Star, title: "Personalized", desc: "Advice tailored to your unique profile and goals" },
                { icon: CheckCircle2, title: "Track Progress", desc: "Monitor your learning roadmap completion" },
              ].map(({ icon: Icon, title, desc }) => (
                <Card key={title} className="bg-accent/30 border-accent/50">
                  <CardContent className="p-4 space-y-2">
                    <Icon className="w-5 h-5 text-primary" />
                    <p className="font-semibold text-sm text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 gradient-primary">
        <div className="container text-center space-y-6">
          <h2 className="text-3xl lg:text-4xl font-display font-bold text-white">Ready to Accelerate Your Career?</h2>
          <p className="text-white/80 max-w-xl mx-auto">Join thousands of women using AI to navigate their tech careers with confidence.</p>
          {user ? (
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard">Open Dashboard <ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
          ) : (
            <Button size="lg" variant="secondary" asChild>
              <a href={getLoginUrl()}>Get Started Free <ArrowRight className="w-5 h-5 ml-2" /></a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 bg-card">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-bold text-sm text-foreground">CareerMentor AI</span>
          </div>
          <p className="text-sm text-muted-foreground">Empowering women in technology, one career at a time.</p>
        </div>
      </footer>
    </div>
  );
}
