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
    "grid h-9 w-9 shrink-0 place-items-center  text-on-ink/55 transition-colors hover:bg-ink-raised hover:text-on-ink/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/40";

  return (
    <form
      onSubmit={onSendMessage}
      className="relative flex items-center gap-2 border-t border-ink-border bg-ink-soft px-3 py-3"
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
          <div className="absolute bottom-12 left-0 z-50 overflow-hidden border border-ink-border shadow-pop">
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
        placeholder="Write a reply"
        aria-label="Message"
        className="min-w-0 flex-1 rounded-full border border-ink-border bg-ink px-4 py-2.5 text-sm text-on-ink outline-none transition-colors placeholder:text-on-ink/55 focus:border-terra focus:ring-2 focus:ring-terra/25"
      />

      {/*
        The teal-to-blue gradient this replaced belonged to no palette in the
        product. Coral is the console's one accent, and it carries dark ink —
        white on coral is 2.7:1, under the 3:1 floor a glyph needs.
      */}
      <button
        type="submit"
        disabled={!canSend}
        aria-label="Send message"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terra text-[#2b0f0a] transition-all duration-200 hover:bg-terra disabled:cursor-not-allowed disabled:bg-ink-raised disabled:text-on-ink/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-terra/50 focus-visible:ring-offset-2 focus-visible:ring-offset-panel"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  );
}
