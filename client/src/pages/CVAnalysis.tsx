import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { FileText, Upload, CheckCircle2, AlertCircle, Zap, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Streamdown } from "streamdown";

export default function CVAnalysis() {
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const { data: analyses, isLoading } = trpc.cv.getAnalyses.useQuery();

  const upload = trpc.cv.upload.useMutation({
    onSuccess: () => {
      utils.cv.getAnalyses.invalidate();
      toast.success("CV analyzed successfully!");
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => setUploading(false),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      upload.mutate({ filename: file.name, fileBase64: base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-600";
    return "text-rose-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-50 border-emerald-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-rose-50 border-rose-200";
  };

  return (
    <AppLayout title="CV Analysis">
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in-up">
        {/* Header */}
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">CV Analysis</h1>
          <p className="text-muted-foreground mt-1">Upload your resume for AI-powered feedback and ATS optimization</p>
        </div>

        {/* Upload area */}
        <Card
          className={`border-2 border-dashed cursor-pointer transition-colors ${uploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/40 hover:bg-muted/30"}`}
          onClick={() => !uploading && fileRef.current?.click()}
        >
          <CardContent className="p-10 text-center">
            <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={handleFileChange} />
            {uploading ? (
              <div className="space-y-3">
                <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
                <p className="font-semibold text-foreground">Analyzing your CV with AI...</p>
                <p className="text-sm text-muted-foreground">This may take 15-30 seconds</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-14 h-14 rounded-2xl gradient-soft border border-primary/20 flex items-center justify-center mx-auto">
                  <Upload className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Drop your CV here or click to upload</p>
                  <p className="text-sm text-muted-foreground mt-1">Supports PDF, Word (.doc, .docx), and TXT — Max 5MB</p>
                </div>
                <Button variant="outline" size="sm" className="pointer-events-none">
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Loading skeleton */}
        {isLoading && (
          <div className="space-y-4">
            {[1, 2].map(i => (
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

        {/* Analyses */}
        {!isLoading && analyses && analyses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground">Analysis History</h2>
            {analyses.map(analysis => (
              <Card key={analysis.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        {analysis.overallScore !== null && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getScoreBg(analysis.overallScore!)}`}>
                            <span className="text-xs text-muted-foreground">Overall</span>
                            <span className={`text-lg font-display font-bold ${getScoreColor(analysis.overallScore!)}`}>{analysis.overallScore}/100</span>
                          </div>
                        )}
                        {analysis.atsScore !== null && (
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${getScoreBg(analysis.atsScore!)}`}>
                            <Zap className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground">ATS</span>
                            <span className={`text-lg font-display font-bold ${getScoreColor(analysis.atsScore!)}`}>{analysis.atsScore}/100</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
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

                {/* Summary cards */}
                <CardContent className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {analysis.strengths && (analysis.strengths as string[]).length > 0 && (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <p className="text-xs font-semibold text-emerald-700">Strengths</p>
                        </div>
                        <ul className="space-y-1">
                          {(analysis.strengths as string[]).map((s, i) => (
                            <li key={i} className="text-xs text-emerald-800">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {analysis.improvements && (analysis.improvements as string[]).length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 mb-2">
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <p className="text-xs font-semibold text-amber-700">Improvements</p>
                        </div>
                        <ul className="space-y-1">
                          {(analysis.improvements as string[]).map((s, i) => (
                            <li key={i} className="text-xs text-amber-800">• {s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {analysis.keySkills && (analysis.keySkills as string[]).length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-foreground mb-1.5">Key Skills Detected</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(analysis.keySkills as string[]).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">{skill}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Full analysis (expandable) */}
                  {expandedId === analysis.id && analysis.fullAnalysis && (
                    <div className="border-t border-border pt-4 mt-2">
                      <p className="text-xs font-semibold text-foreground mb-3">Full Analysis</p>
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

        {!isLoading && (!analyses || analyses.length === 0) && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No analyses yet. Upload your CV to get started.
          </div>
        )}
      </div>
    </AppLayout>
  );
}
