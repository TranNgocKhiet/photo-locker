"use client";

import { removeTag } from "../../app/actions";

interface TagManagerProps {
  photoId: string;
  tags: string[];
  isManagementMode?: boolean;
}

export default function TagManager({ photoId, tags, isManagementMode = false }: TagManagerProps) {
  
  const handleRemoveTag = async (tagToRemove: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tag "#${tagToRemove}" vĩnh viễn không?`)) {
      await removeTag(photoId, tagToRemove);
    }
  };
  
  if (tags.length === 0) {
    return <p className="text-gray-400 italic text-sm">Chưa có tag nào được thêm.</p>;
  }
  
  return (
    <div className="flex gap-2 flex-wrap">
      {tags.map((tag) => (
        <div 
          key={tag} 
          className="flex items-center bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm gap-1"
        >
          <span>#{tag}</span>
          
          {isManagementMode && (
            <button
              onClick={() => handleRemoveTag(tag)}
              className="text-red-400 hover:text-red-600 font-bold ml-1"
              title="Xóa Tag"
            >
              ×
            </button>
          )}
        </div>
      ))}
    </div>
  );
}