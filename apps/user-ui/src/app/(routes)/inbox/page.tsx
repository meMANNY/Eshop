"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useWebSocket } from "@/context/web-socket-context";
import useRequireAuth from "@/hooks/useRequiredAuth";
import ChatInput from "@/shared/components/chats/chat-input";
import { Bar, Container, EmptyState } from "@/shared/components/ui";

import { isProtected } from "@/utils/protected";
import { MessagesSquare } from "lucide-react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

const FALLBACK_AVATAR =
  "https://cdn-icons-png.flaticon.com/512/847/847969.png";

/*
  Timestamps are data, not speech, so they are set in the mono face and kept out
  of the message's own reading rhythm.
*/
const clockTime = (value?: string | Date | null) =>
  value
    ? new Date(value).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const dayKey = (value?: string | Date | null) =>
  value ? new Date(value).toDateString() : "";

/*
  A support thread is read by when things happened, so the day boundary is real
  information rather than decoration — it earns a structural rule.
*/
const dayLabel = (value?: string | Date | null) => {
  if (!value) return "";
  const date = new Date(value);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";

  return date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
};

function Presence({ online }: { online?: boolean }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          online ? "bg-pos" : "bg-ink-300/50"
        }`}
        aria-hidden="true"
      />
      <span className={online ? "text-pos" : "text-ink-500"}>
        {online ? "Online" : "Offline"}
      </span>
    </span>
  );
}

function Avatar({
  src,
  name,
  size = 40,
  online,
}: {
  src?: string;
  name?: string;
  size?: number;
  online?: boolean;
}) {
  return (
    <span className="relative shrink-0">
      <Image
        src={src || FALLBACK_AVATAR}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="rounded-full border border-line object-cover"
        style={{ width: size, height: size }}
      />
      {online ? (
        <span
          className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-paper bg-pos"
          aria-label={`${name ?? "Shop"} is online`}
        />
      ) : null}
    </span>
  );
}

function ThreadSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 px-3 py-2.5">
          <div className="h-10 w-10 shrink-0 rounded-full bg-surface" />
          <div className="flex-1 space-y-2">
            <Bar className="h-3 w-1/2" />
            <Bar className="h-2.5 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

function InboxContent() {
  const searchParams = useSearchParams();
  const { user } = useRequireAuth();
  const router = useRouter();
  const messageContainerRef = useRef<HTMLDivElement | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null);
  const queryClient = useQueryClient();
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);
  const [message, setMessage] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);
  const conversationId = searchParams.get("conversationId");

  const { ws } = useWebSocket();

  const { data: messages = [] } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      if (!conversationId || hasFetchedOnce) return [];
      const res = await axiosInstance.get(
        `/chatting/api/get-user-messages/${conversationId}?page=1`,
        isProtected
      );
      setPage(1);
      setHasMore(res.data.hasMore);
      setHasFetchedOnce(true);
      return res.data.messages.reverse();
    },
    enabled: !!conversationId,
    staleTime: 2 * 60 * 1000,
  });

  const loadMoreMessages = async () => {
    const nextPage = page + 1;
    const res = await axiosInstance.get(
      `/chatting/api/get-user-messages/${conversationId}?page=${nextPage}`,
      isProtected
    );
    queryClient.setQueryData(["messages", conversationId], (old: any = []) => [
      ...res.data.messages.reverse(),
      ...old,
    ]);
    setPage(nextPage);
    setHasMore(res.data.hasMore);
  };

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/chatting/api/get-user-conversations",
        isProtected
      );
      return res.data.conversations;
    },
  });

  useEffect(() => {
    if (!ws) return;

    /*
      `addEventListener`, not `ws.onmessage =`. Assigning the property replaced the
      handler the WebSocket provider installs, so the provider's unread counts went
      dead for as long as this page was mounted.
    */
    const handleMessage = (event: any) => {
      const data = JSON.parse(event.data);
      if (data.type === "NEW_MESSAGE") {
        const newMessage = data.payload;
        if (newMessage.conversationId === conversationId)
          queryClient.setQueryData(
            ["messages", conversationId],
            (old: any = []) => [
              ...old,
              {
                content: newMessage.messageBody || newMessage.content || "",
                senderType: newMessage.senderType,
                seen: false,
                createdAt: newMessage.createdAt || new Date().toISOString(),
              },
            ]
          );

        scrollToBottom();
        setChats((prev) =>
          prev.map((chat) =>
            chat.conversationId === newMessage.conversationId
              ? { ...chat, lastMessage: newMessage.content }
              : chat
          )
        );
      }

      if (data.type === "UNSEEN_COUNT_UPDATE") {
        const { conversationId, count } = data.payload;
        setChats((prev) =>
          prev.map((chat) =>
            chat.conversationId === conversationId
              ? { ...chat, unreadCount: count }
              : chat
          )
        );
      }

      /*
        `isOnline` used to be a snapshot taken when the conversation list was
        fetched, so a seller who connected afterwards stayed "Offline" for the rest
        of the session. `selectedChat` is derived from `chats`, so updating the list
        updates the header too.
      */
      if (data.type === "PRESENCE_UPDATE") {
        const { userId, isOnline } = data.payload;
        setChats((prev) =>
          prev.map((chat) =>
            chat.seller?.id === userId
              ? { ...chat, seller: { ...chat.seller, isOnline } }
              : chat
          )
        );
      }
    };

    ws.addEventListener("message", handleMessage);
    return () => ws.removeEventListener("message", handleMessage);
  }, [ws, conversationId]);

  useEffect(() => {
    if (conversations) setChats(conversations);
  }, [conversations]);

  useEffect(() => {
    if (conversationId && chats.length > 0) {
      const chat = chats.find((c) => c.conversationId === conversationId);
      setSelectedChat(chat);
    }
  }, [conversationId, chats]);

  useEffect(() => {
    if (messages?.length > 0) scrollToBottom();
  }, [messages]);

  const getLastMessage = (c: any) => c?.lastMessage || "";

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    });
  };

  const handleSend = async (e: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;
    const payload = {
      fromUserId: user?.id,
      toUserId: selectedChat?.seller?.id,
      conversationId: selectedChat?.conversationId,
      messageBody: message,
      senderType: "user",
    };

    ws?.send(JSON.stringify(payload));

    setMessage("");
    scrollToBottom();
  };

  const handleChatSelect = async (c: any) => {
    setHasFetchedOnce(false);
    setChats((prev) =>
      prev.map((chat) =>
        chat.conversationId === c.conversationId
          ? { ...chat, unreadCount: 0 }
          : chat
      )
    );
    router.push(`?conversationId=${c.conversationId}`);

    // `conversationId` here is the value read from the URL, which still holds the
    // PREVIOUS chat — `router.push` above has not propagated yet. Marking that one
    // as seen instead of the one just opened is off by one selection.
    ws?.send(
      JSON.stringify({
        type: "MARK_AS_SEEN",
        conversationId: c.conversationId,
      })
    );
  };

  return (
    <Container className="py-6 md:py-8">
      <div className="flex h-[calc(100vh-11rem)] min-h-[520px] overflow-hidden border border-line bg-paper">
        {/* ---------------------------- THREAD LIST ---------------------------- */}
        <aside className="flex w-[300px] shrink-0 flex-col border-r border-line bg-surface max-md:hidden">
          <div className="flex items-baseline justify-between border-b border-line px-4 py-4">
            <h1 className="font-display text-base font-semibold text-ink">
              Messages
            </h1>
            {chats.length > 0 ? (
              <span className="font-mono text-xs tabular-nums text-ink-500">
                {chats.length}
              </span>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ThreadSkeleton />
            ) : chats.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-ink-500">
                No conversations yet.
              </p>
            ) : (
              <ul className="p-2">
                {chats.map((c) => {
                  const isActive =
                    selectedChat?.conversationId === c.conversationId;
                  return (
                    <li key={c?.conversationId}>
                      <button
                        onClick={() => handleChatSelect(c)}
                        aria-current={isActive ? "true" : undefined}
                        className={`relative w-full  px-3 py-2.5 text-left transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/40 ${
                          isActive
                            ? "bg-terra-soft"
                            : "hover:bg-paper"
                        }`}
                      >
                        {/* The active marker is a coral edge rather than a fill:
                            it reads at a glance without competing with the
                            unread pill sitting a few pixels away. */}
                        {isActive ? (
                          <span
                            className="absolute inset-y-2 left-0 w-[3px] rounded-full bg-terra"
                            aria-hidden="true"
                          />
                        ) : null}

                        <div className="flex items-center gap-3">
                          <Avatar
                            src={c?.seller?.avatar}
                            name={c?.seller?.name}
                            online={c?.seller?.isOnline}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span
                                className={`truncate font-display text-sm ${
                                  isActive
                                    ? "font-semibold text-terra-2"
                                    : "font-medium text-ink"
                                }`}
                              >
                                {c?.seller?.name}
                              </span>
                              <span className="shrink-0 font-mono text-[11px] tabular-nums text-ink-500">
                                {clockTime(c?.lastMessageAt)}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center justify-between gap-2">
                              <p className="truncate text-xs text-ink-500">
                                {getLastMessage(c)}
                              </p>
                              {c?.unreadCount > 0 && (
                                <span className="shrink-0 rounded-full bg-terra px-1.5 py-px font-mono text-[10px] font-semibold tabular-nums text-paper">
                                  {c?.unreadCount > 9 ? "9+" : c?.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* ------------------------------ THREAD ------------------------------ */}
        <section className="flex min-w-0 flex-1 flex-col bg-paper">
          {selectedChat ? (
            <>
              <header className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5">
                <Avatar
                  src={selectedChat?.seller?.avatar}
                  name={selectedChat?.seller?.name}
                  size={38}
                />
                <div className="min-w-0">
                  <h2 className="truncate font-display text-sm font-semibold text-ink">
                    {selectedChat?.seller?.name}
                  </h2>
                  <p className="mt-0.5 text-xs">
                    <Presence online={selectedChat?.seller?.isOnline} />
                  </p>
                </div>
              </header>

              <div
                ref={messageContainerRef}
                className="flex-1 space-y-1 overflow-y-auto px-4 py-5 md:px-6"
              >
                {hasMore && (
                  <div className="flex justify-center pb-3">
                    <button
                      onClick={loadMoreMessages}
                      className="rounded-full border border-line bg-paper px-3.5 py-1.5 text-xs font-medium text-ink-500 transition-colors hover:border-terra/40 hover:text-terra-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/40"
                    >
                      Load earlier messages
                    </button>
                  </div>
                )}

                {messages.map((msg: any, i: number) => {
                  const mine = msg.senderType === "user";
                  const prev = messages[i - 1];
                  const next = messages[i + 1];

                  const startsDay = dayKey(msg.createdAt) !== dayKey(prev?.createdAt);
                  /*
                    Consecutive messages from one side collapse into a run: only
                    the last of a run keeps its tail and its timestamp. Without
                    this a long thread reads as a ladder of identical rows.
                  */
                  const endsRun =
                    !next ||
                    next.senderType !== msg.senderType ||
                    dayKey(next.createdAt) !== dayKey(msg.createdAt);

                  return (
                    <div key={i}>
                      {startsDay && (
                        <div className="flex items-center gap-3 py-4">
                          <span className="h-px flex-1 bg-line" />
                          <span className="text-label font-semibold uppercase text-ink-500">
                            {dayLabel(msg.createdAt)}
                          </span>
                          <span className="h-px flex-1 bg-line" />
                        </div>
                      )}

                      <div
                        className={`flex flex-col ${
                          mine ? "items-end" : "items-start"
                        } ${endsRun ? "mb-3" : "mb-0.5"}`}
                      >
                        {/*
                          You speak in coral, the shop answers on paper. Coral
                          fill takes dark ink — white on it is 2.7:1 and fails.
                        */}
                        <div
                          className={`max-w-[min(78%,34rem)] whitespace-pre-wrap break-words px-3.5 py-2 text-sm leading-relaxed ${
                            mine
                              ? "bg-ink text-paper"
                              : "border border-line bg-paper text-ink"
                          } ${
                            endsRun
                              ? mine
                                ? " rounded-br-md"
                                : " rounded-bl-md"
                              : ""
                          }`}
                        >
                          {msg.text || msg.content}
                        </div>

                        {endsRun && (
                          <span className="mt-1 px-1 font-mono text-[11px] tabular-nums text-ink-500">
                            {msg.time || clockTime(msg.createdAt)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
                <div ref={scrollAnchorRef} />
              </div>

              <ChatInput
                message={message}
                setMessage={setMessage}
                onSendMessage={handleSend}
              />
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8">
              <EmptyState
                icon={<MessagesSquare className="h-8 w-8" aria-hidden="true" />}
                title="No conversation open"
                hint={
                  chats.length > 0
                    ? "Pick a shop on the left to read the thread and reply."
                    : "Message a shop from any product page and the conversation will appear here."
                }
              />
            </div>
          )}
        </section>
      </div>
    </Container>
  );
}

export default function Page() {
  return (
    <Suspense
      fallback={
        <Container className="py-6 md:py-8">
          <div className="h-[calc(100vh-11rem)] min-h-[520px] animate-pulse border border-line bg-paper" />
        </Container>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
