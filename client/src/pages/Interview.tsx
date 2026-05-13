import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { Mic2, Play, CheckCircle2, AlertCircle, Star, Loader2, RotateCcw, Trophy } from "lucide-react";
import { Streamdown } from "streamdown";

type Phase = "setup" | "active" | "complete";

interface QA { question: string; answer: string; score?: number; feedback?: string; strengths?: string; improvements?: string; }

export default function Interview() {
  const utils = trpc.useUtils();
  const [phase, setPhase] = useState<Phase>("setup");
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [totalQ, setTotalQ] = useState(5);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [qas, setQas] = useState<QA[]>([]);
  const [lastScore, setLastScore] = useState<{ score: number; feedback: string; strengths: string; improvements: string } | null>(null);
  const [finalResult, setFinalResult] = useState<{ overallScore: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: sessions } = trpc.interview.getSessions.useQuery();

  const createSession = trpc.interview.createSession.useMutation();
  const generateQ = trpc.interview.generateQuestion.useMutation();
  const submitAnswer = trpc.interview.submitAnswer.useMutation();
  const completeSession = trpc.interview.completeSession.useMutation();

  const handleStart = async () => {
    if (!jobRole.trim()) { toast.error("Please enter a job role"); return; }
    setLoading(true);
    try {
      const { sessionId: sid } = await createSession.mutateAsync({ jobRole, difficulty, totalQuestions: totalQ });
      setSessionId(sid);
      const { question } = await generateQ.mutateAsync({ sessionId: sid, jobRole, difficulty, questionNumber: 1 });
      setCurrentQuestion(question);
      setCurrentQ(1);
      setPhase("active");
      setLastScore(null);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() || !sessionId) return;
    setLoading(true);
    try {
      const result = await submitAnswer.mutateAsync({ sessionId, questionNumber: currentQ, question: currentQuestion, answer, jobRole });
      setLastScore(result);
      setQas(prev => [...prev, { question: currentQuestion, answer, ...result }]);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleNextQuestion = async () => {
    if (currentQ >= totalQ) {
      setLoading(true);
      try {
        const result = await completeSession.mutateAsync({ sessionId: sessionId! });
        setFinalResult(result);
        setPhase("complete");
        utils.interview.getSessions.invalidate();
      } catch (e: any) { toast.error(e.message); }
      finally { setLoading(false); }
      return;
    }
    setLoading(true);
    setAnswer("");
    setLastScore(null);
    try {
      const { question } = await generateQ.mutateAsync({
        sessionId: sessionId!,
        jobRole,
        difficulty,
        questionNumber: currentQ + 1,
        previousQA: qas.map(q => ({ question: q.question, answer: q.answer })),
      });
      setCurrentQuestion(question);
      setCurrentQ(prev => prev + 1);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const handleReset = () => {
    setPhase("setup");
    setSessionId(null);
    setCurrentQ(0);
    setCurrentQuestion("");
    setAnswer("");
    setQas([]);
    setLastScore(null);
    setFinalResult(null);
  };

  const difficultyColors = { beginner: "bg-emerald-100 text-emerald-700", intermediate: "bg-amber-100 text-amber-700", advanced: "bg-rose-100 text-rose-700" };

  return (
    <AppLayout title="Interview Simulation">
      <div className="p-6 lg:p-8 max-w-3xl mx-auto space-y-6 animate-fade-in-up">
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">Interview Simulation</h1>
          <p className="text-muted-foreground mt-1">Practice with AI-generated questions and get instant feedback</p>
        </div>

        {/* Setup */}
        {phase === "setup" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-display flex items-center gap-2">
                <Mic2 className="w-4 h-4 text-primary" />
                Configure Your Interview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="jobRole">Job Role</Label>
                <Input id="jobRole" placeholder="e.g., Data Scientist, Product Manager, Software Engineer" value={jobRole} onChange={e => setJobRole(e.target.value)} />
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner — Entry Level</SelectItem>
                      <SelectItem value="intermediate">Intermediate — Mid Level</SelectItem>
                      <SelectItem value="advanced">Advanced — Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={String(totalQ)} onValueChange={v => setTotalQ(Number(v))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[3, 5, 7, 10].map(n => <SelectItem key={n} value={String(n)}>{n} Questions</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleStart} disabled={loading || !jobRole.trim()} className="w-full gradient-primary text-white border-0">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                Start Interview
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Active interview */}
        {phase === "active" && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge className={difficultyColors[difficulty]}>{difficulty}</Badge>
                <span className="text-muted-foreground">{jobRole}</span>
              </div>
              <span className="text-muted-foreground">Question {currentQ} of {totalQ}</span>
            </div>
            <Progress value={(currentQ / totalQ) * 100} className="h-2" />

            {/* Question */}
            <Card className="border-primary/20 bg-primary/2">
              <CardContent className="p-5">
                <p className="text-xs font-semibold text-primary mb-2">Question {currentQ}</p>
                <p className="text-foreground font-medium leading-relaxed">{currentQuestion}</p>
              </CardContent>
            </Card>

            {/* Answer */}
            {!lastScore && (
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your answer here... Take your time and be thorough."
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={6}
                  className="resize-none"
                />
                <Button onClick={handleSubmitAnswer} disabled={loading || !answer.trim()} className="w-full gradient-primary text-white border-0">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Submit Answer
                </Button>
              </div>
            )}

            {/* Score feedback */}
            {lastScore && (
              <div className="space-y-3 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border ${lastScore.score >= 80 ? "bg-emerald-50 border-emerald-200" : lastScore.score >= 60 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200"}`}>
                    <Star className={`w-4 h-4 ${lastScore.score >= 80 ? "text-emerald-600" : lastScore.score >= 60 ? "text-amber-600" : "text-rose-600"}`} />
                    <span className={`font-display font-bold text-xl ${lastScore.score >= 80 ? "text-emerald-600" : lastScore.score >= 60 ? "text-amber-600" : "text-rose-600"}`}>{lastScore.score}/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Your score for this answer</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-emerald-700 mb-1">What worked well</p>
                    <p className="text-xs text-emerald-800">{lastScore.strengths}</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-amber-700 mb-1">Areas to improve</p>
                    <p className="text-xs text-amber-800">{lastScore.improvements}</p>
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Detailed Feedback</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{lastScore.feedback}</p>
                </div>
                <Button onClick={handleNextQuestion} disabled={loading} className="w-full gradient-primary text-white border-0">
                  {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {currentQ >= totalQ ? "Complete Interview" : "Next Question →"}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Complete */}
        {phase === "complete" && finalResult && (
          <div className="space-y-5 animate-fade-in-up">
            <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-accent/10 text-center">
              <CardContent className="p-8 space-y-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground">Interview Complete!</h2>
                <div className="text-5xl font-display font-bold text-primary">{finalResult.overallScore}<span className="text-2xl text-muted-foreground">/100</span></div>
                <p className="text-sm text-muted-foreground">Overall Performance Score</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-display">Performance Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none text-foreground">
                  <Streamdown>{finalResult.feedback}</Streamdown>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h3 className="font-display font-semibold text-foreground">Question-by-Question Review</h3>
              {qas.map((qa, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-medium text-foreground">Q{i + 1}: {qa.question}</p>
                      {qa.score !== undefined && (
                        <Badge className={qa.score >= 80 ? "bg-emerald-100 text-emerald-700" : qa.score >= 60 ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}>
                          {qa.score}/100
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2">{qa.answer}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button onClick={handleReset} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Start New Interview
            </Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
