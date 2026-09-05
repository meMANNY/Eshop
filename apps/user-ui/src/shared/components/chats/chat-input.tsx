"use client";

import { PickerProps } from "emoji-picker-react";
import { ImageIcon, Send, Smile } from "lucide-react";
import dynamic from "next/dynamic";
import React, { useEffect, useRef, useState } from "react";

const EmojiPicker = dynamic(
  () =>
    import("emoji-picker-react").then(
      (mod) => mod.default as React.FC<PickerProps>
    ),
  // The picker is a large client-only widget behind a toggle. Rendering it on
  // the server shipped markup nobody sees until the button is pressed.
  { ssr: false }
);

export default function ChatInput({
  message,
  setMessage,
  onSendMessage,
}: {
  message: string;
  setMessage: React.Dispatch<React.SetStateAction<string>>;
  onSendMessage: (e: any) => void;
}) {
  const [showEmoji, setShowEmoji] = useState(false);
  const emojiWrapRef = useRef<HTMLDivElement | null>(null);
  const canSend = message.trim().length > 0;

  // A picker that only closes by pressing its own button is a trap — clicking
  // anywhere else, or pressing Escape, should dismiss it.
  useEffect(() => {
    if (!showEmoji) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!emojiWrapRef.current?.contains(event.target as Node)) {
        setShowEmoji(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowEmoji(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [showEmoji]);

  const handleEmojiClick = (emojiData: any) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) console.log("uploading file...");
  };

  const iconButton =
    "grid h-9 w-9 shrink-0 place-items-center  text-ink-400 transition-colors hover:bg-paper-x hover:text-ink-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/40";

  return (
    <form
      onSubmit={onSendMessage}
      className="relative flex items-center gap-2 border-t border-line bg-paper px-3 py-3"
    >
      <label className={`${iconButton} cursor-pointer`} title="Attach an image">
        <ImageIcon className="h-[18px] w-[18px]" aria-hidden="true" />
        <span className="sr-only">Attach an image</span>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          hidden
        />
      </label>

      <div className="relative" ref={emojiWrapRef}>
        <button
          type="button"
          onClick={() => setShowEmoji((prev) => !prev)}
          className={iconButton}
          aria-label="Add an emoji"
          aria-expanded={showEmoji}
        >
          <Smile className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
        {showEmoji && (
          <div className="absolute bottom-12 left-0 z-50 overflow-hidden border border-line shadow-pop">
            <EmojiPicker
              onEmojiClick={handleEmojiClick}
              previewConfig={{ showPreview: false }}
            />
          </div>
        )}
      </div>

      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Write a message"
        aria-label="Message"
        className="min-w-0 flex-1 rounded-full border border-line bg-paper px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-400 focus:border-terra focus:bg-paper focus:ring-2 focus:ring-terra/25"
      />

      {/*
        Coral fill carries DARK ink, never white — it is 2.73:1 against white,
        so a white glyph on it would sit under the 3:1 floor. Disabled state is
        a real state here: an empty box has nothing to send.
      */}
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper transition-all duration-200 hover:bg-terra hover:text-white disabled:cursor-not-allowed disabled:bg-paper-x disabled:text-ink-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/50 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
