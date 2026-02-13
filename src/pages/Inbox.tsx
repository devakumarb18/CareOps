import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, Send, Search, User } from "lucide-react";
import { motion } from "framer-motion";

interface Contact {
  id: string;
  name: string;
  email: string | null;
}

interface Conversation {
  id: string;
  contact_id: string;
  status: string;
  automation_paused: boolean;
  last_message_at: string | null;
  contacts?: Contact;
}

interface Message {
  id: string;
  conversation_id: string;
  sender: string;
  content: string;
  message_type: string;
  created_at: string;
}

export default function Inbox() {
  const { workspaceId } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchConvos = async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*, contacts(*)")
        .eq("workspace_id", workspaceId)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      setConversations(data || []);
      setLoading(false);
    };
    fetchConvos();
  }, [workspaceId]);

  useEffect(() => {
    if (!selectedConvo) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConvo)
        .order("created_at", { ascending: true });
      setMessages(data || []);
    };
    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedConvo}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${selectedConvo}` },
        (payload) => setMessages((prev) => [...prev, payload.new as Message])
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConvo]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConvo) return;
    await supabase.from("messages").insert({
      conversation_id: selectedConvo, sender: "staff", content: newMessage, message_type: "manual" as any,
    });
    // Pause automation
    await supabase.from("conversations").update({ automation_paused: true }).eq("id", selectedConvo);
    setNewMessage("");
  };

  const selectedContact = conversations.find((c) => c.id === selectedConvo)?.contacts;
  const filteredConvos = conversations.filter((c) =>
    c.contacts?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-display font-bold mb-4">Inbox</h1>
      <div className="grid grid-cols-12 gap-4 h-[calc(100%-3rem)]">
        {/* Contact list */}
        <Card className="col-span-4 shadow-card border-border/50 flex flex-col">
          <CardHeader className="pb-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full">
              {filteredConvos.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredConvos.map((convo) => (
                  <div
                    key={convo.id}
                    onClick={() => setSelectedConvo(convo.id)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors border-b border-border/30 ${
                      selectedConvo === convo.id ? "bg-sidebar-accent" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{convo.contacts?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{convo.contacts?.email}</p>
                    </div>
                    <Badge variant={convo.status === "open" ? "default" : "secondary"} className="text-[10px] shrink-0">
                      {convo.status}
                    </Badge>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="col-span-8 shadow-card border-border/50 flex flex-col">
          {selectedConvo ? (
            <>
              <CardHeader className="pb-2 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-display">{selectedContact?.name}</CardTitle>
                    <p className="text-xs text-muted-foreground">{selectedContact?.email}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${msg.sender === "staff" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[70%] px-3 py-2 rounded-xl text-sm ${
                          msg.sender === "staff"
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        }`}>
                          {msg.content}
                          <div className={`text-[10px] mt-1 ${msg.sender === "staff" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {msg.message_type === "auto" && " • Auto"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-4 border-t border-border/30">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." className="flex-1" />
                    <Button type="submit" size="icon" className="gradient-primary text-primary-foreground shrink-0">
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
