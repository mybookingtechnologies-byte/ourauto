"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Room = { id: string };
type Message = { id: string; message: string; senderId: string; createdAt: string };

export default function DealerChatPage(): JSX.Element {
  const [targetDealerId, setTargetDealerId] = useState("");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [roomId, setRoomId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    const loadRooms = async (): Promise<void> => {
      const response = await fetch("/api/chat/rooms");
      if (!response.ok) return;
      const data = (await response.json()) as { rooms: Room[] };
      setRooms(data.rooms);
      if (!roomId && data.rooms[0]) {
        setRoomId(data.rooms[0].id);
      }
    };
    void loadRooms();
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const interval = setInterval(async () => {
      const response = await fetch(`/api/chat/messages?roomId=${roomId}`);
      if (!response.ok) return;
      const data = (await response.json()) as { messages: Message[] };
      setMessages(data.messages);
    }, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-6 py-12 md:grid-cols-[280px_1fr]">
      <aside className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
        <h2 className="mb-3 font-semibold">Rooms</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <button key={room.id} className="w-full rounded-2xl bg-bgPrimary p-2 text-left" onClick={() => setRoomId(room.id)}>
              {room.id.slice(0, 8)}
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <Input placeholder="Target Dealer ID" value={targetDealerId} onChange={(event) => setTargetDealerId(event.target.value)} />
          <Button
            className="w-full"
            onClick={async () => {
              const response = await fetch("/api/chat/rooms", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetDealerId }),
              });
              if (!response.ok) return;
              const data = (await response.json()) as { room: Room };
              setRoomId(data.room.id);
              setRooms((prev) => [data.room, ...prev.filter((room) => room.id !== data.room.id)]);
            }}
          >
            Start Chat
          </Button>
        </div>
      </aside>
      <section className="rounded-2xl bg-bgSecondary p-6 shadow-lg">
        <h1 className="mb-3 text-xl font-bold">Dealer Chat</h1>
        <div className="h-[420px] space-y-2 overflow-y-auto rounded-2xl bg-bgPrimary p-4">
          {messages.map((message) => (
            <div key={message.id} className="rounded-2xl bg-bgSecondary p-3 text-sm">
              {message.message}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input value={messageText} onChange={(event) => setMessageText(event.target.value)} placeholder="Type message" />
          <Button
            onClick={async () => {
              if (!roomId || !messageText.trim()) return;
              await fetch("/api/chat/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ roomId, message: messageText }),
              });
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
