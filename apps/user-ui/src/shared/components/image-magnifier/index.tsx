"use client";

import Image from "next/image";
import React, { useRef, useState } from "react";

interface ImageMagnifierProps {
  src?: string;
  alt?: string;
  /** Rendered box size in px. The image is contained within it. */
  width?: number;
  height?: number;
  /** How far to magnify on hover. */
  zoom?: number;
  /** Fill the parent's width (square) instead of using fixed px dimensions. */
  fluid?: boolean;
  /** Draw the hard frame. Off when the caller already wraps this in a <Frame>. */
  framed?: boolean;
  className?: string;
}

/**
 * Hover-to-zoom product image.
 *
 * Rather than overlaying a lens, this scales the image inside a fixed,
 * overflow-hidden box and moves `transform-origin` to follow the cursor — so
 * whatever you point at stays under the pointer as it magnifies.
 */
const ImageMagnifier = ({
  src,
  alt = "",
  width = 400,
  height = 400,
  zoom = 2.2,
  fluid = false,
  framed = false,
  className = "",
}: ImageMagnifierProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [origin, setOrigin] = useState("50% 50%");
  const [isZoomed, setIsZoomed] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Cursor position as a percentage of the box — that's the point we
    // magnify around.
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setOrigin(`${x}% ${y}%`);
  };

  const reset = () => {
    setIsZoomed(false);
    setOrigin("50% 50%");
  };

  // next/image throws if `src` is undefined, which would take the whole page
  // down for a product with no images.
  // In fluid mode the parent controls the width; a square aspect keeps the
  // zoom maths (percentage-based) correct at any size.
  const sizing = fluid
    ? { className: "w-full aspect-square", style: undefined }
    : { className: "", style: { width, height } };

  if (!src) {
    return (
      <div
        className={`flex items-center justify-center border border-line bg-surface font-mono text-[10px] uppercase tracking-[0.16em] text-ink-300 ${sizing.className} ${className}`}
        style={sizing.style}
      >
        no image
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={reset}
      onMouseMove={handleMouseMove}
      /* Square, and framed only when nothing else is framing it: the lens is a
         printed plate, not a rounded UI card. */
      className={`relative cursor-zoom-in overflow-hidden bg-surface ${
        framed ? "border border-ink-line" : ""
      } ${sizing.className} ${className}`}
      style={sizing.style}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        priority
        className="h-full w-full object-contain transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{
          transformOrigin: origin,
          transform: isZoomed ? `scale(${zoom})` : "scale(1)",
        }}
      />
    </div>
  );
};

export default ImageMagnifier;
