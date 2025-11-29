import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Plus, MessageSquare } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

type Mode = "general" | "code" | "narrator";

export default function ChatInterface() {
  const { user } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState<number | undefined>();
  const [message, setMessage] = useState("");
  const [currentMode, setCurrentMode] = useState<Mode>("general");
  const scrollRef = useRef<HTMLDivElement>(null);

  const { data: conversations, refetch: refetchConversations } = trpc.chat.list.useQuery();
  const { data: messages, refetch: refetchMessages } = trpc.chat.getMessages.useQuery(
    { conversationId: selectedConversationId! },
    { enabled: !!selectedConversationId }
  );

  const sendMessageMutation = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessage("");
      setSelectedConversationId(data.conversationId);
      refetchMessages();
      refetchConversations();
    },
    onError: (error) => {
      toast.error("Błąd wysyłania wiadomości: " + error.message);
    },
  });

  const createConversationMutation = trpc.chat.create.useMutation({
    onSuccess: (data) => {
      setSelectedConversationId(data.id);
      refetchConversations();
      toast.success("Nowa rozmowa utworzona");
    },
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim()) return;

    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      message: message.trim(),
      mode: currentMode,
    });
  };

  const handleNewConversation = () => {
    createConversationMutation.mutate({
      title: "Nowa rozmowa",
      mode: currentMode,
    });
  };

  const modeLabels: Record<Mode, string> = {
    general: "Ogólny",
    code: "Kodowanie",
    narrator: "Lektorowy",
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <Button onClick={handleNewConversation} className="w-full" disabled={createConversationMutation.isPending}>
            {createConversationMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Nowa rozmowa
          </Button>
        </div>

        <ScrollArea className="flex-1 p-2">
          {conversations?.map((conv) => (
            <Button
              key={conv.id}
              variant={selectedConversationId === conv.id ? "default" : "ghost"}
              className="w-full justify-start mb-1 text-left"
              onClick={() => setSelectedConversationId(conv.id)}
            >
              <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </Button>
          ))}
        </ScrollArea>

        <div className="p-4 border-t border-border">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium">{user?.name || user?.email}</p>
            <p className="text-xs mt-1">
              Status: {user?.role === "admin" ? "PREMIUM" : "Standard"}
            </p>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header with mode selector */}
        <div className="border-b border-border p-4 bg-card">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {selectedConversationId
                ? conversations?.find((c) => c.id === selectedConversationId)?.title
                : "Wybierz lub rozpocznij nową rozmowę"}
            </h2>
            <div className="flex gap-2">
              {(["general", "code", "narrator"] as Mode[]).map((mode) => (
                <Button
                  key={mode}
                  variant={currentMode === mode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentMode(mode)}
                >
                  {modeLabels[mode]}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {messages?.map((msg) => (
            <Card
              key={msg.id}
              className={`mb-4 p-4 ${
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground max-w-[80%]"
                  : "mr-auto bg-muted max-w-[80%]"
              }`}
            >
              {msg.role === "assistant" ? (
                <Streamdown>{msg.content}</Streamdown>
              ) : (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}
            </Card>
          ))}
          {sendMessageMutation.isPending && (
            <Card className="mb-4 p-4 mr-auto bg-muted max-w-[80%]">
              <Loader2 className="h-4 w-4 animate-spin" />
            </Card>
          )}
        </ScrollArea>

        {/* Input area */}
        <div className="border-t border-border p-4 bg-card">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Wpisz wiadomość..."
              className="flex-1 resize-none"
              rows={2}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || sendMessageMutation.isPending}
              size="icon"
              className="self-end"
            >
              {sendMessageMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
