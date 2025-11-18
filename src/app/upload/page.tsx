"use client";

import { useState } from "react";
import Image from "next/image";
import { uploadMultiplePhotos } from "../../app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (indexToRemove: number) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpload = async () => {
    if (files.length === 0) return alert("Please choose at least 1 photo!");
    
    setLoading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET_NAME!);

        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: formData }
        );
        const data = await res.json();
        return data.secure_url; 
      });

      const uploadedUrls = await Promise.all(uploadPromises);

      const tagsArray = tagInput
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await uploadMultiplePhotos(uploadedUrls, tagsArray);
      router.push("/");

    } catch (error) {
      console.error("Lỗi:", error);
      alert("Error while uploading!");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10 flex flex-col items-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-3xl">
        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Upload photo</h1>
          <Link href="/" className="text-gray-500 hover:text-black">✕ Cancel</Link>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors relative">
            <input 
              type="file" 
              multiple
              onChange={handleFileChange} 
              accept="image/*"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <p className="text-gray-500">Drag and drop photo(s) here or click to select</p>
            <p className="text-xs text-gray-400 mt-1">(Multiple photos can be selected at the same time)</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tag for photo(s):
            </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="E.g. pet, summer, playground (seperate with comma)"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        {files.length > 0 && (
          <div className="mb-8">
            <p className="text-sm text-gray-500 mb-3">Selected {files.length} photo(s):</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {files.map((file, index) => (
                <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    onClick={() => removeFile(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={loading || files.length === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? `Uploading ${files.length} photo(s)...` : "Start Uploading"}
        </button>

      </div>
    </div>
  );
}