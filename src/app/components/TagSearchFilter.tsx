"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";

export default function TagSearchFilter({ allTags }: { allTags: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tagsFromUrl = searchParams.get("tags")?.split(",") || [];
    const cleanTags = tagsFromUrl.filter(t => t && t.trim() !== "");
    setSelectedTags(cleanTags);
  }, [searchParams]);

  const updateUrl = (newTags: string[]) => {
    if (newTags.length > 0) {
      router.push(`/?tags=${newTags.join(",")}`);
    } else {
      router.push("/");
    }
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      const newTags = [...selectedTags, tag];
      setSelectedTags(newTags);
      updateUrl(newTags);
    }
    setInputValue("");
    setShowDropdown(false);
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = selectedTags.filter((t) => t !== tagToRemove);
    setSelectedTags(newTags);
    updateUrl(newTags);
  };

  const suggestions = allTags.filter(tag => 
    tag.toLowerCase().includes(inputValue.toLowerCase()) && 
    !selectedTags.includes(tag)
  );

  return (
    <div className="w-full max-w-2xl mb-8" ref={wrapperRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Lọc theo thẻ:
      </label>

      <div className="bg-white border border-gray-300 rounded-lg p-2 flex flex-wrap items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 relative">
        
        {selectedTags.map((tag) => (
          <span key={tag} className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-full flex items-center gap-1 animate-in fade-in zoom-in duration-200">
            #{tag}
            <button
              onClick={() => removeTag(tag)}
              className="hover:bg-blue-200 rounded-full w-4 h-4 flex items-center justify-center font-bold text-xs"
            >
              ×
            </button>
          </span>
        ))}

        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder={selectedTags.length === 0 ? "Gõ tên thẻ để tìm kiếm..." : "Thêm tag khác..."}
          className="flex-1 min-w-[120px] outline-none text-sm py-1 text-gray-700"
        />

        {selectedTags.length > 0 && (
          <button 
            onClick={() => updateUrl([])}
            className="text-gray-400 hover:text-red-500 text-sm px-2"
            title="Xóa bộ lọc"
          >
            Xóa hết
          </button>
        )}

        {showDropdown && inputValue && (
          <ul className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto">
            {suggestions.length > 0 ? (
              suggestions.map((tag) => (
                <li
                  key={tag}
                  onClick={() => addTag(tag)}
                  className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm text-gray-700 flex justify-between"
                >
                  <span>#{tag}</span>
                </li>
              ))
            ) : (
              <li className="px-4 py-2 text-sm text-gray-400 italic">
                Không tìm thấy thẻ "{inputValue}"
              </li>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}