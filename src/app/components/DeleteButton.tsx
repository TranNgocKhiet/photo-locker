"use client";

import { deletePhoto } from "../../app/actions";

export default function DeleteButton({ photoId }: { photoId: string }) {
  return (
    <form action={deletePhoto.bind(null, photoId)}>
      <button
        type="submit"
        className="text-red-500 text-sm hover:bg-red-50 px-2 py-1 rounded border border-red-200"
        onClick={(e) => {
          if (!confirm("Bạn có chắc chắn muốn xóa ảnh này không?")) {
            e.preventDefault();
          }
        }}
      >
        🗑️ Xóa
      </button>
    </form>
  );
}