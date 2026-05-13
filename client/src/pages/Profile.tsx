import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Plus, X, Save, Loader2, Briefcase, Target, Star, BookOpen } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Profile() {
  const utils = trpc.useUtils();
  const { user } = useAuth();

  const { data: profile, isLoading } = trpc.profile.get.useQuery();

  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState<number | "">("");
  const [industry, setIndustry] = useState("");
  const [education, setEducation] = useState("");
  const [bio, setBio] = useState("");
  const [careerGoals, setCareerGoals] = useState("");

  useEffect(() => {
    if (profile) {
      setCurrentRole(profile.currentRole ?? "");
      setTargetRole(profile.targetRole ?? "");
      setSkills((profile.skills as string[]) ?? []);
      setYearsOfExperience(profile.yearsOfExperience ?? "");
      setIndustry(profile.industry ?? "");
      setEducation(profile.education ?? "");
      setBio(profile.bio ?? "");
      setCareerGoals(profile.careerGoals ?? "");
    }
  }, [profile]);

  const update = trpc.profile.update.useMutation({
    onSuccess: () => {
      utils.profile.get.invalidate();
      toast.success("Profile updated successfully!");
    },
    onError: (err) => toast.error(err.message),
  });

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    setSkills(prev => [...prev, trimmed]);
    setSkillInput("");
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(prev => prev.filter(s => s !== skill));
  };

  const handleSave = () => {
    update.mutate({
      currentRole: currentRole || undefined,
      targetRole: targetRole || undefined,
      skills,
      yearsOfExperience: yearsOfExperience !== "" ? Number(yearsOfExperience) : undefined,
      industry: industry || undefined,
      education: education || undefined,
      bio: bio || undefined,
      careerGoals: careerGoals || undefined,
    });
  };

  const suggestedSkills = [
    "Python", "SQL", "Machine Learning", "Data Analysis", "Product Management",
    "JavaScript", "React", "Node.js", "Cloud (AWS/GCP/Azure)", "Agile/Scrum",
    "Communication", "Leadership", "Project Management", "UX Design", "Statistics",
  ].filter(s => !skills.includes(s));

  return (
    <AppLayout title="My Profile">
      <div className="p-6 lg:p-8 space-y-6 animate-fade-in-up max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground mt-1">Complete your profile for personalized AI recommendations</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={update.isPending}
            className="gradient-primary text-white border-0"
          >
            {update.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Profile
          </Button>
        </div>

        {/* User info (read-only from auth) */}
        <Card className="bg-gradient-to-r from-primary/5 to-accent/10 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center text-white text-xl font-display font-bold flex-shrink-0">
                {user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
              </div>
              <div>
                <p className="font-display font-bold text-lg text-foreground">{user?.name || "User"}</p>
                <p className="text-sm text-muted-foreground">{user?.email || ""}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-10 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Career Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Career Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentRole">Current Role</Label>
                    <Input
                      id="currentRole"
                      placeholder="e.g., Software Engineer, Data Analyst"
                      value={currentRole}
                      onChange={e => setCurrentRole(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetRole">Target Role</Label>
                    <Input
                      id="targetRole"
                      placeholder="e.g., ML Engineer, Product Manager"
                      value={targetRole}
                      onChange={e => setTargetRole(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 3"
                      value={yearsOfExperience}
                      onChange={e => setYearsOfExperience(e.target.value === "" ? "" : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g., FinTech, HealthTech, SaaS"
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="education">Education</Label>
                  <Input
                    id="education"
                    placeholder="e.g., BSc Computer Science, MBA"
                    value={education}
                    onChange={e => setEducation(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  Skills
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill..."
                    value={skillInput}
                    onChange={e => setSkillInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAddSkill()}
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={handleAddSkill} disabled={!skillInput.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {skills.map(skill => (
                      <Badge key={skill} variant="secondary" className="gap-1.5 pr-1.5">
                        {skill}
                        <button onClick={() => handleRemoveSkill(skill)} className="hover:text-destructive transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}

                {suggestedSkills.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Suggested skills — click to add:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedSkills.slice(0, 8).map(skill => (
                        <button
                          key={skill}
                          onClick={() => setSkills(prev => [...prev, skill])}
                          className="text-xs bg-muted hover:bg-secondary text-muted-foreground hover:text-secondary-foreground px-2.5 py-1 rounded-full transition-colors border border-border"
                        >
                          + {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals & Bio */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-display flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />
                  Goals & Background
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="careerGoals">Career Goals</Label>
                  <Textarea
                    id="careerGoals"
                    placeholder="What do you want to achieve in your career? What kind of impact do you want to make?"
                    value={careerGoals}
                    onChange={e => setCareerGoals(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Brief description of your background, interests, and what you're working on..."
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              onClick={handleSave}
              disabled={update.isPending}
              className="w-full gradient-primary text-white border-0"
              size="lg"
            >
              {update.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
