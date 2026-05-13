import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Linkedin, Sparkles, CheckCircle2, AlertCircle, TrendingUp, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Streamdown } from "streamdown";

export default function LinkedIn() {
  const utils = trpc.useUtils();
  const [profileText, setProfileText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: analyses, isLoading } = trpc.linkedin.getAnalyses.useQuery();

  const analyze = trpc.linkedin.analyze.useMutation({
    onSuccess: () => {
      utils.linkedin.getAnalyses.invalidate();
      toast.success("LinkedIn profile analyzed!");
      setProfileText("");
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setAnalyzing(false),
  });

  const handleAnalyze = () => {
    if (profileText.trim().length < 50) { toast.error("Please paste more profile content (at least 50 characters)"); return; }
    setAnalyzing(true);
    analyze.mutate({ profileText });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  return (
    <AppLayout title="LinkedIn Review">
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">LinkedIn Profile Review</h1>
          <p className="text-muted-foreground mt-1">Paste your LinkedIn profile text for AI-powered optimization suggestions</p>
        </div>

        {/* Input card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Linkedin className="w-4 h-4 text-primary" />
              Paste Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profileText">
                LinkedIn Profile Content
                <span className="text-muted-foreground font-normal ml-1">(copy from your LinkedIn profile page)</span>
              </Label>
              <Textarea
                id="profileText"
                placeholder="Paste your LinkedIn profile text here — include your headline, summary/about section, experience, education, and skills..."
                value={profileText}
                onChange={e => setProfileText(e.target.value)}
                rows={8}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{profileText.length} characters · Minimum 50 required</p>
            </div>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || profileText.trim().length < 50}
              className="gradient-primary text-white border-0"
            >
              {analyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Analyze Profile
            </Button>
          </CardContent>
        </Card>

        {/* How to copy hint */}
        <Card className="bg-accent/30 border-accent/50">
          <CardContent className="p-4">
            <p className="text-sm font-medium text-foreground mb-1">How to get your LinkedIn profile text</p>
            <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Go to your LinkedIn profile page</li>
              <li>Select all text (Ctrl+A / Cmd+A) or manually select the relevant sections</li>
              <li>Copy (Ctrl+C / Cmd+C) and paste it here</li>
              <li>Include your headline, about, experience, education, and skills for best results</li>
            </ol>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!analyses || analyses.length === 0) && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No analyses yet. Paste your LinkedIn profile above to get started.
          </div>
        )}

        {/* Analyses */}
        {!isLoading && analyses && analyses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Analysis History</h2>
            {analyses.map(analysis => (
              <Card key={analysis.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      {analysis.overallScore !== null && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className={`w-4 h-4 ${getScoreColor(analysis.overallScore!)}`} />
                          <span className={`text-2xl font-display font-bold ${getScoreColor(analysis.overallScore!)}`}>
                            {analysis.overallScore}/100
                          </span>
                          <span className="text-xs text-muted-foreground">Profile Score</span>
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(analysis.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </p>
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === analysis.id ? null : analysis.id)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {expandedId === analysis.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Suggestions */}
                  <div className="space-y-3">
                    {analysis.headlineSuggestion && (
                      <div className="bg-sky-50 border border-sky-200 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <TrendingUp className="w-4 h-4 text-sky-600" />
                          <p className="text-xs font-semibold text-sky-700">Headline Suggestion</p>
                        </div>
                        <p className="text-xs text-sky-800">{analysis.headlineSuggestion}</p>
                      </div>
                    )}
                    {analysis.summarySuggestion && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-semibold text-emerald-700">About / Summary Suggestion</p>
                        </div>
                        <p className="text-xs text-emerald-800">{analysis.summarySuggestion}</p>
                      </div>
                    )}
                    {analysis.skillsSuggestion && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <p className="text-xs font-semibold text-amber-700">Skills Section Suggestion</p>
                        </div>
                        <p className="text-xs text-amber-800">{analysis.skillsSuggestion}</p>
                      </div>
                    )}
                  </div>

                  {/* Full analysis (expandable) */}
                  {expandedId === analysis.id && analysis.fullAnalysis && (
                    <div className="border-t border-border pt-4">
                      <p className="text-xs font-semibold text-foreground mb-3">Full Analysis & Recommendations</p>
                      <div className="prose prose-sm max-w-none text-foreground">
                        <Streamdown>{analysis.fullAnalysis}</Streamdown>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
