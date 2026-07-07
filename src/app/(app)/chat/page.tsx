"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import LoadingSpinner from "@/components/LoadingSpinner";

interface ChatRoom {
  id: string;
  name: string;
  level: { name: string; order: number } | null;
  _count: { messages: number };
}

interface Message {
  id: string;
  content: string;
  createdAt: string;
  user: { id: string; firstName: string; lastName: string; role: string };
}

export default function ChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/chat")
      .then((r) => r.ok ? r.json() : [])
      .then(setRooms)
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => {
    if (!activeRoom) return;
    fetch(`/api/chat/${activeRoom}/messages`)
      .then((r) => r.ok ? r.json() : [])
      .then(setMessages);
  }, [activeRoom]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !activeRoom || sending) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/${activeRoom}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) => [...prev, msg]);
        setNewMessage("");
      }
    } finally {
      setSending(false);
    }
  };

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner text="Chargement..." /></div>;
  }

  const activeRoomData = rooms.find((r) => r.id === activeRoom);

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
            <svg className="w-8 h-8 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Discussion
          </h1>
          <p className="text-white/50 mt-1">Salons de discussion par niveau</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4" style={{ height: "calc(100vh - 12rem)" }}>
          {/* Room list */}
          <div className="glass rounded-2xl p-3 overflow-y-auto lg:col-span-1">
            <div className="flex items-center justify-between mb-3 px-2">
              <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Salons</p>
              <span className="text-xs text-white/30">{rooms.length}</span>
            </div>
            {rooms.length === 0 ? (
              <p className="text-white/50 text-sm text-center py-8">Aucun salon</p>
            ) : (
              <div className="space-y-1">
                {rooms.map((room) => (
                  <button key={room.id} onClick={() => setActiveRoom(room.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all ${
                      activeRoom === room.id
                        ? "gradient-btn text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}>
                    <p className="font-semibold truncate flex items-center gap-2">
                      {room.level ? (
                        <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
                          {room.level.name[0]}
                        </span>
                      ) : (
                        <span className="w-6 h-6 rounded-lg bg-primary/20 flex items-center justify-center text-xs">#</span>
                      )}
                      {room.name}
                    </p>
                    <p className={`text-xs mt-1 ml-8 ${activeRoom === room.id ? "text-white/60" : "text-white/30"}`}>
                      {room._count.messages} message{room._count.messages > 1 ? "s" : ""}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Messages area */}
          <div className="glass rounded-2xl lg:col-span-3 flex flex-col overflow-hidden">
            {!activeRoom ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl glass flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-white/40 text-sm">Sélectionnez un salon pour discuter</p>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-white/10 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center text-white font-bold text-sm">
                    {activeRoomData?.level ? activeRoomData.level.name[0] : "#"}
                  </div>
                  <div>
                    <h2 className="text-white font-semibold">{activeRoomData?.name}</h2>
                    {activeRoomData?.level && (
                      <p className="text-xs text-white/40">{activeRoomData.level.name}</p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <p className="text-white/30 text-sm">Aucun message dans ce salon</p>
                      <p className="text-white/20 text-xs">Soyez le premier à écrire !</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isMine = msg.user.id === session?.user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.005, 0.3) }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2`}
                        >
                          {!isMine && (
                            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-white font-bold text-xs shrink-0 mb-1">
                              {msg.user.firstName[0]}{msg.user.lastName[0]}
                            </div>
                          )}
                          <div className={`max-w-[75%] ${isMine ? "order-1" : "order-2"}`}>
                            {!isMine && (
                              <p className="text-xs text-white/40 mb-1 ml-1">{msg.user.firstName} {msg.user.lastName}</p>
                            )}
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "gradient-btn rounded-br-md"
                                : "glass rounded-bl-md"
                            }`}>
                              <p className="text-sm text-white">{msg.content}</p>
                              <p className={`text-[0.65rem] mt-1 text-right ${
                                isMine ? "text-white/50" : "text-white/30"
                              }`}>
                                {new Date(msg.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                          {isMine && (
                            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-white font-bold text-xs shrink-0 mb-1 order-2">
                              {session.user.firstName[0]}{session.user.lastName[0]}
                            </div>
                          )}
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-white/10">
                  <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrivez votre message..."
                      className="input-field flex-1"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="gradient-btn px-5 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50 transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      {sending ? (
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Envoyer
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
