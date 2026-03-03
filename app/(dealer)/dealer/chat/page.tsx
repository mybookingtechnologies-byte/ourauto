"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Room = { id: string };
type Message = { id: string; message: string; senderId: string; createdAt: string };

export default function DealerChatPage(): JSX.Element {
  const [targetDealerId, setTargetDealerId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [chatError, setChatError] = useState("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const loadRooms = async (): Promise<void> => {
      const response = await fetch("/api/chat/rooms");
      if (!response.ok) {
        setChatError("Unable to load rooms");
        return;
      }
      const data = (await response.json()) as { success: boolean; rooms: Room[] };
      setRooms(data.rooms || []);
      if (!roomId && data.rooms[0]) {
        setRoomId(data.rooms[0].id);
      }
    };
    void loadRooms();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    setMessages([]);
    setNextCursor(null);

    const loadInitial = async (): Promise<void> => {
      setLoadingMessages(true);
      setChatError("");
      const response = await fetch(`/api/chat/messages?roomId=${roomId}&limit=30`);
      if (!response.ok) {
        setLoadingMessages(false);
        setChatError("Unable to load messages");
        return;
      }
      const data = (await response.json()) as { success: boolean; messages: Message[]; nextCursor: string | null };
      setMessages(data.messages || []);
      setNextCursor(data.nextCursor || null);
      setLoadingMessages(false);
    };

    void loadInitial();
  }, [roomId]);

  const streamCursor = useMemo(() => messages[messages.length - 1]?.id || "", [messages]);

  useEffect(() => {
    if (!roomId) return;
    const stream = new EventSource(`/api/chat/stream?roomId=${roomId}&cursor=${streamCursor}`);

    stream.addEventListener("message", (event) => {
      const incoming = JSON.parse(event.data) as Message;
      setMessages((prev) => {
        if (prev.some((item) => item.id === incoming.id)) {
          return prev;
        }
        return [...prev, incoming];
      });
    });

    stream.onerror = () => {
      stream.close();
    };

    return () => {
      stream.close();
    };
  }, [roomId, streamCursor]);

  async function loadOlderMessages(): Promise<void> {
    if (!roomId || !nextCursor) return;
    const response = await fetch(`/api/chat/messages?roomId=${roomId}&limit=30&cursor=${nextCursor}`);
    if (!response.ok) {
      setChatError("Unable to load older messages");
      return;
    }
    const data = (await response.json()) as { success: boolean; messages: Message[]; nextCursor: string | null };
    setMessages((prev) => [...(data.messages || []), ...prev]);
    setNextCursor(data.nextCursor || null);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-3 font-semibold">Rooms</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              className="w-full rounded-2xl bg-zinc-100 p-2 text-left text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
              onClick={() => setRoomId(room.id)}
            >
              {room.id.slice(0, 8)}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Input aria-label="Target dealer id" placeholder="Target Dealer ID" value={targetDealerId} onChange={(event) => setTargetDealerId(event.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              const response = await fetch("/api/chat/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetDealerId }),
              });
              if (!response.ok) {
                setChatError("Unable to create room");
                return;
              }
              const data = (await response.json()) as { success: boolean; room: Room };
              setRoomId(data.room.id);
              setRooms((prev) => [data.room, ...prev.filter((room) => room.id !== data.room.id)]);
            }}
          >
            Start Chat
          </Button>
        </div>
      </aside>
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-3 text-xl font-bold">Dealer Chat</h1>
        {chatError ? <p className="mb-2 text-sm text-red-500">{chatError}</p> : null}
        {nextCursor ? (
          <Button variant="secondary" className="mb-3" onClick={() => void loadOlderMessages()}>
            Load older messages
          </Button>
        ) : null}
        <div className="h-[420px] space-y-2 overflow-y-auto rounded-2xl bg-zinc-100 p-4 dark:bg-zinc-800">
          {loadingMessages ? <p className="text-sm text-zinc-400">Loading messages...</p> : null}
          {messages.map((message) => (
            <div key={message.id} className="rounded-2xl bg-white p-3 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100">
              {message.message}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input aria-label="Message text" value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Type message" />
          <Button
            onClick={async () => {
              if (!roomId || !messageText.trim()) return;
              const response = await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, message: messageText }),
              });
              if (!response.ok) {
                setChatError("Unable to send message");
                return;
              }
              setMessageText("");
            }}
          >
            Send
          </Button>
        </div>
      </section>
    </main>
  );
}
