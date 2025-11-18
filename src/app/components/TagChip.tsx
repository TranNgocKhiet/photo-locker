"use client";

export default function TagChip({ tag }: { tag: string }) {
  return (
    <span 
      className="text-[10px] bg-white/20 backdrop-blur-sm text-white px-2 py-1 rounded-full z-10 relative"
    >
      #{tag}
    </span>
  );
}