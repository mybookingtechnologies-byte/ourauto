"use client";

import { useEffect, useState } from "react";

type Conversation = {
  id: string;
  name: string;
  preview: string;
  time: string;
};

type Message = {
  id: string;
  fromDealer: boolean;
  text: string;
};

export default function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chat, setChat] = useState<Message[]>([]);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/dealer/messages", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (cancelled) {
          return;
        }

        setConversations(Array.isArray(data?.data?.conversations) ? data.data.conversations : []);
        setChat(Array.isArray(data?.data?.chat) ? data.data.chat : []);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-6">
      <article className="grid h-[560px] grid-cols-1 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow dark:border-zinc-800 dark:bg-zinc-900 md:grid-cols-3">
        <aside className="border-b border-zinc-200 dark:border-zinc-800 md:col-span-1 md:border-b-0 md:border-r">
          <div className="h-full overflow-y-auto p-3">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                className="mb-2 w-full rounded-lg p-3 text-left hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <div className="flex items-center justify-between">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">{conversation.name}</p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">{new Date(conversation.time).toLocaleTimeString()}</span>
                </div>
                <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                  {conversation.preview}
                </p>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex h-full flex-col md:col-span-2">
          <header className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
            <h2 className="font-semibold text-zinc-900 dark:text-zinc-100">Amina Bello</h2>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {chat.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.fromDealer ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                    message.fromDealer
                      ? "bg-[var(--primary-yellow)] text-zinc-900"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          <footer className="border-t border-zinc-200 p-3 dark:border-zinc-800">
            <div className="rounded-lg bg-zinc-100 px-4 py-2 text-sm text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              Message input placeholder
            </div>
          </footer>
        </div>
      </article>
    </section>
  );
}