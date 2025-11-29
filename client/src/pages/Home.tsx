import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { getLoginUrl } from "@/const";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Chat AI</h1>
          <p className="text-muted-foreground">Zaloguj się, aby rozpocząć rozmowę z AI</p>
          <Button asChild size="lg">
            <a href={getLoginUrl()}>Zaloguj się</a>
          </Button>
        </div>
      </div>
    );
  }

  return <ChatInterface />;
}
