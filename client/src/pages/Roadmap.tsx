import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Map, Sparkles, CheckCircle2, Circle, ChevronDown, ChevronUp, Loader2, Plus, ExternalLink } from "lucide-react";

export default function Roadmap() {
  const utils = trpc.useUtils();
  const [targetRole, setTargetRole] = useState("");
  const [generating, setGenerating] = useState(false);
  const [expandedRoadmap, setExpandedRoadmap] = useState<number | null>(null);
  const [stagesMap, setStagesMap] = useState<Record<number, any[]>>({});

  const { data: roadmaps, isLoading } = trpc.roadmap.getAll.useQuery();

  const generate = trpc.roadmap.generate.useMutation({
    onSuccess: () => {
      utils.roadmap.getAll.invalidate();
      toast.success("Learning roadmap generated!");
      setTargetRole("");
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setGenerating(false),
  });

  const getOne = trpc.roadmap.getOne.useQuery(
    { roadmapId: expandedRoadmap! },
    {
      enabled: !!expandedRoadmap,
      onSuccess: (data: any) => {
        if (data && expandedRoadmap) {
          setStagesMap(prev => ({ ...prev, [expandedRoadmap]: data.stages ?? [] }));
        }
      },
    } as any
  );

  const markStageComplete = trpc.roadmap.markStageComplete.useMutation({
    onSuccess: () => {
      utils.roadmap.getAll.invalidate();
      if (expandedRoadmap) utils.roadmap.getOne.invalidate({ roadmapId: expandedRoadmap });
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = () => {
    if (!targetRole.trim()) { toast.error("Please enter a target role"); return; }
    setGenerating(true);
    generate.mutate({ targetRole });
  };

  const handleExpand = (id: number) => {
    setExpandedRoadmap(expandedRoadmap === id ? null : id);
  };

  return (
    <AppLayout title="Learning Roadmap">
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Personalized Learning Roadmap</h1>
          <p className="text-muted-foreground mt-1">Generate step-by-step learning plans with curated resources</p>
        </div>

        {/* Generate new roadmap */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-display flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Create New Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="targetRole">What role do you want to achieve?</Label>
              <Input
                id="targetRole"
                placeholder="e.g., Machine Learning Engineer, Data Scientist, Product Manager"
                value={targetRole}
                onChange={e => setTargetRole(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleGenerate()}
              />
            </div>
            <Button onClick={handleGenerate} disabled={generating || !targetRole.trim()} className="gradient-primary text-white border-0">
              {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Roadmap
            </Button>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-5 bg-muted rounded w-1/2" />
                  <div className="h-2 bg-muted rounded w-full" />
                  <div className="space-y-2">
                    {[1, 2, 3].map(j => <div key={j} className="h-4 bg-muted rounded w-3/4" />)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!isLoading && (!roadmaps || roadmaps.length === 0) && (
          <Card className="border-dashed border-2 border-border">
            <CardContent className="p-12 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl gradient-soft border border-primary/20 flex items-center justify-center mx-auto">
                <Map className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold text-foreground">No Roadmaps Yet</h3>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Enter your target role above to generate a personalized step-by-step roadmap with curated resources.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Roadmaps list */}
        {!isLoading && roadmaps && roadmaps.length > 0 && (
          <div className="space-y-4">
            {roadmaps.map(roadmap => {
              const progressPct = roadmap.totalStages && roadmap.totalStages > 0
                ? Math.round(((roadmap.completedStages ?? 0) / roadmap.totalStages) * 100)
                : 0;
              const isExpanded = expandedRoadmap === roadmap.id;
              const stages = stagesMap[roadmap.id] ?? (isExpanded && getOne.data?.stages ? getOne.data.stages : []);

              return (
                <Card key={roadmap.id} className="overflow-hidden">
                  <CardHeader className="pb-3 cursor-pointer" onClick={() => handleExpand(roadmap.id)}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-base font-display">{roadmap.title}</CardTitle>
                          {roadmap.targetRole && <Badge variant="secondary" className="text-xs">{roadmap.targetRole}</Badge>}
                        </div>
                        <div className="flex items-center gap-3">
                          <Progress value={progressPct} className="h-1.5 flex-1" />
                          <span className="text-xs text-muted-foreground flex-shrink-0">
                            {roadmap.completedStages ?? 0}/{roadmap.totalStages ?? 0} stages
                          </span>
                        </div>
                      </div>
                      <button className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-1">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                    </div>
                  </CardHeader>

                  {isExpanded && (
                    <CardContent className="pt-0 space-y-3">
                      {getOne.isLoading && expandedRoadmap === roadmap.id && (
                        <div className="flex justify-center py-4">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        </div>
                      )}
                      {stages.length > 0 && (
                        <div className="space-y-2">
                          {stages.map((stage: any) => (
                            <div
                              key={stage.id}
                              className={`flex gap-3 p-3 rounded-lg border transition-colors ${stage.isCompleted ? "bg-emerald-50 border-emerald-200" : "bg-muted/30 border-border hover:bg-muted/50"}`}
                            >
                              <button
                                onClick={() => !stage.isCompleted && markStageComplete.mutate({ stageId: stage.id, roadmapId: roadmap.id })}
                                className="flex-shrink-0 mt-0.5"
                                disabled={stage.isCompleted}
                              >
                                {stage.isCompleted
                                  ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                                }
                              </button>
                              <div className="flex-1 min-w-0 space-y-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className={`text-sm font-medium ${stage.isCompleted ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                    Stage {stage.stageNumber}: {stage.title}
                                  </p>
                                  {stage.estimatedWeeks && (
                                    <Badge variant="outline" className="text-xs">{stage.estimatedWeeks}w</Badge>
                                  )}
                                </div>
                                {stage.description && <p className="text-xs text-muted-foreground">{stage.description}</p>}
                                {stage.skills && (stage.skills as string[]).length > 0 && (
                                  <div className="flex flex-wrap gap-1 pt-0.5">
                                    {(stage.skills as string[]).map((skill: string) => (
                                      <Badge key={skill} variant="secondary" className="text-xs py-0 h-5">{skill}</Badge>
                                    ))}
                                  </div>
                                )}
                                {stage.resources && (stage.resources as any[]).length > 0 && (
                                  <div className="flex flex-wrap gap-2 pt-1">
                                    {(stage.resources as any[]).map((r: any, ri: number) => (
                                      <a
                                        key={ri}
                                        href={r.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                                      >
                                        <ExternalLink className="w-3 h-3" />
                                        {r.title}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
