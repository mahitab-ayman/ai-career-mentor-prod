import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Compass, Sparkles, Bookmark, BookmarkCheck, Clock, DollarSign, TrendingUp, ExternalLink, Loader2 } from "lucide-react";

export default function CareerPaths() {
  const utils = trpc.useUtils();
  const [generating, setGenerating] = useState(false);

  const { data: paths, isLoading } = trpc.careerPaths.getAll.useQuery();

  const generate = trpc.careerPaths.generate.useMutation({
    onSuccess: () => {
      utils.careerPaths.getAll.invalidate();
      toast.success("Career paths generated!");
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setGenerating(false),
  });

  const toggleSave = trpc.careerPaths.toggleSave.useMutation({
    onSuccess: () => utils.careerPaths.getAll.invalidate(),
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    setGenerating(true);
    generate.mutate({});
  };

  const savedPaths = paths?.filter(p => p.isSaved) ?? [];
  const allPaths = paths ?? [];

  return (
    <AppLayout title="Career Paths">
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Career Path Recommendations</h1>
            <p className="text-muted-foreground mt-1">AI-powered paths tailored to your profile and goals</p>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            className="gradient-primary text-white border-0 self-start"
          >
            {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate New Paths
          </Button>
        </div>

        {/* Saved paths count */}
        {savedPaths.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BookmarkCheck className="w-4 h-4 text-primary" />
            <span>{savedPaths.length} path{savedPaths.length !== 1 ? "s" : ""} saved to your collection</span>
          </div>
        )}

        {/* Loading */}
        {(isLoading || generating) && (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-full" />
                  <div className="h-4 bg-muted rounded w-5/6" />
                  <div className="flex gap-2">
                    {[1, 2, 3].map(j => <div key={j} className="h-6 bg-muted rounded-full w-16" />)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !generating && allPaths.length === 0 && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl gradient-soft border border-primary/20 flex items-center justify-center mx-auto">
                <Compass className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground">Discover Your Career Paths</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Click "Generate New Paths" to get personalized career recommendations based on your profile. Complete your profile first for better results.
              </p>
              <Button onClick={handleGenerate} className="gradient-primary text-white border-0">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Career Paths
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Paths grid */}
        {!generating && allPaths.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-5">
            {allPaths.map(path => (
              <Card key={path.id} className={`card-hover border ${path.isSaved ? "border-primary/30 bg-primary/2" : "border-border"}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <CardTitle className="text-base font-display">{path.pathTitle}</CardTitle>
                      {path.matchScore && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-xs text-emerald-600 font-medium">{path.matchScore}% match</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleSave.mutate({ id: path.id, isSaved: !path.isSaved })}
                      className="text-muted-foreground hover:text-primary transition-colors flex-shrink-0 mt-0.5"
                    >
                      {path.isSaved ? <BookmarkCheck className="w-5 h-5 text-primary" /> : <Bookmark className="w-5 h-5" />}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">{path.description}</p>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {path.timelineMonths && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {path.timelineMonths} months
                      </div>
                    )}
                    {path.salaryRange && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" />
                        {path.salaryRange}
                      </div>
                    )}
                  </div>

                  {/* Skills */}
                  {path.skills && (path.skills as string[]).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Key Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(path.skills as string[]).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resources */}
                  {path.resources && (path.resources as any[]).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Learning Resources</p>
                      <div className="space-y-1">
                        {(path.resources as any[]).slice(0, 3).map((r, i) => (
                          <a
                            key={i}
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {r.title}
                            <Badge variant="outline" className="text-xs py-0 h-4">{r.type}</Badge>
                          </a>
                        ))}
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
