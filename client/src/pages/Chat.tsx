import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { Send, Plus, Trash2, MessageSquare, Sparkles, Loader2 } from "lucide-react";
import { Streamdown } from "streamdown";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export default function Chat() {
  const utils = trpc.useUtils();
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: sessions, isLoading: sessionsLoading } = trpc.chat.getSessions.useQuery();
  const { data: messages, isLoading: messagesLoading } = trpc.chat.getMessages.useQuery(
    { sessionId: activeSessionId! },
    { enabled: !!activeSessionId }
  );

  const createSession = trpc.chat.createSession.useMutation({
    onSuccess: (data) => {
      utils.chat.getSessions.invalidate();
      setActiveSessionId(data.sessionId);
    },
  });

  const deleteSession = trpc.chat.deleteSession.useMutation({
    onSuccess: () => {
      utils.chat.getSessions.invalidate();
      setActiveSessionId(null);
    },
  });

  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: () => {
      utils.chat.getMessages.invalidate({ sessionId: activeSessionId! });
      utils.chat.getSessions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    let sessionId = activeSessionId;
    if (!sessionId) {
      const result = await createSession.mutateAsync();
      sessionId = result.sessionId;
      setActiveSessionId(sessionId);
    }
    const msg = input.trim();
    setInput("");
    setSending(true);
    try {
      await sendMessage.mutateAsync({ sessionId, message: msg });
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout title="AI Career Chat">
      <div className="flex h-[calc(100vh-4rem)] lg:h-screen">
        {/* Sessions sidebar */}
        <div className="hidden md:flex w-64 flex-col border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <Button
              className="w-full gradient-primary text-white border-0"
              size="sm"
              onClick={() => { setActiveSessionId(null); createSession.mutate(); }}
              disabled={createSession.isPending}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Conversation
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {sessionsLoading && <div className="text-center py-4 text-sm text-muted-foreground">Loading...</div>}
              {sessions?.length === 0 && !sessionsLoading && (
                <div className="text-center py-8 text-sm text-muted-foreground">No conversations yet</div>
              )}
              {sessions?.map(session => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                    activeSessionId === session.id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted text-foreground"
                  )}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}</p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity"
                    onClick={(e) => { e.stopPropagation(); deleteSession.mutate({ sessionId: session.id }); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!activeSessionId ? (
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="text-center space-y-4 max-w-md animate-fade-in-up">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-display font-bold text-foreground">Your AI Career Mentor</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Ask me anything about your career journey — from job search strategies to skill development, interview tips, and navigating the tech industry as a woman.
                </p>
                <div className="grid grid-cols-1 gap-2 text-left">
                  {[
                    "How can I transition from software engineering to product management?",
                    "What skills should I develop to become a data scientist?",
                    "How do I negotiate a higher salary in tech?",
                    "Tips for overcoming imposter syndrome in tech",
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      className="text-left text-sm bg-muted/60 hover:bg-muted px-4 py-2.5 rounded-lg text-foreground transition-colors"
                      onClick={() => { setInput(suggestion); }}
                    >
                      "{suggestion}"
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <ScrollArea className="flex-1 p-4 lg:p-6">
              {messagesLoading && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              )}
              <div className="space-y-4 max-w-3xl mx-auto">
                {messages?.map(msg => (
                  <div
                    key={msg.id}
                    className={cn("flex gap-3 animate-fade-in-up", msg.role === "user" ? "justify-end" : "justify-start")}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
                        <Sparkles className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-card border border-border rounded-tl-sm shadow-sm"
                    )}>
                      {msg.role === "assistant" ? (
                        <div className="prose prose-sm max-w-none text-foreground">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-3 justify-start animate-fade-in-up">
                    <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-5">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Input */}
          <div className="border-t border-border p-4 bg-card">
            <div className="max-w-3xl mx-auto flex gap-2">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your career mentor anything..."
                className="flex-1"
                disabled={sending}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="gradient-primary text-white border-0"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-2">Press Enter to send • Shift+Enter for new line</p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
