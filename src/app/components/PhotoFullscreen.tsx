"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import TagManagementPanel from "../components/TagManagementPanel"; 
import DeleteButton from "../components/DeleteButton";
import { addTag } from "../actions";

interface PhotoViewProps {
  photo: any; 
  nextLink: string | null;
  prevLink: string | null;
  backLink: string;
  tagName?: string; 
}

export default function PhotoFullscreen({ photo, nextLink, prevLink, backLink, tagName }: PhotoViewProps) {
  const [showInfo, setShowInfo] = useState(false); 
  const router = useRouter();
  
  const navbarHeight = '64px'; 
  const sidebarWidth = '400px'; 

  useEffect(() => {
    setShowInfo(false); 

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && nextLink) router.push(nextLink);
      if (e.key === "ArrowLeft" && prevLink) router.push(prevLink);
      if (e.key === "Escape") router.push(backLink);
      if (e.key === "i") setShowInfo(prev => !prev); 
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextLink, prevLink, backLink, router]);

  return (
    <div 
        className="fixed inset-x-0 bottom-0 z-[100] bg-black overflow-hidden"
        style={{ top: navbarHeight }} 
    >
      <div className="relative w-full h-full flex justify-center items-center p-4"> 
        <div className="relative w-full md:w-[90%] max-w-[1480px] h-full mx-auto"> 
            <Image 
              src={photo.imageUrl} 
              alt="Full View" 
              fill 
              className="object-contain mx-auto"
              priority
            />
        </div>
      </div>

      <Link 
        href={backLink} 
        className="absolute top-6 left-6 z-[110] bg-black/50 hover:bg-black/80 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
      >
        ✕
      </Link>

      <button 
        onClick={() => setShowInfo(!showInfo)}
        className={`absolute top-6 right-6 z-[110] w-10 h-10 rounded-full flex items-center justify-center transition-all backdrop-blur-sm border text-lg ${showInfo ? "bg-white text-black border-white" : "bg-black/50 text-white border-transparent hover:bg-black/80"}`}
      >
        {showInfo ? '✖' : 'ℹ'}
      </button>

      {prevLink && (<Link href={prevLink} className="absolute left-4 top-1/2 -translate-y-1/2 z-40 text-white/50 hover:text-white text-6xl p-4 hover:bg-black/20 rounded-full transition-all">&#8249;</Link>)}
      {nextLink && (<Link href={nextLink} className="absolute right-4 top-1/2 -translate-y-1/2 z-40 text-white/50 hover:text-white text-6xl p-4 hover:bg-black/20 rounded-full transition-all">&#8250;</Link>)}

      <div 
        className={`fixed right-0 bg-white shadow-2xl transition-all duration-300 ease-in-out z-[105] flex flex-col overflow-hidden`}
        style={{ 
            width: sidebarWidth, 
            top: navbarHeight, 
            height: `calc(100vh - ${navbarHeight})`,
            right: showInfo ? '0' : `-${sidebarWidth}` 
        }}
      >
        <div className="p-6 flex flex-col h-full gap-4 overflow-y-auto">
           
           <div className="flex justify-between items-start mt-1 gap-4"> 
             <div>
                <h1 className="text-xl font-bold">Chi tiết ảnh</h1>
                {tagName && <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Tag đang lọc: {tagName}</span>}
             </div>
           </div>

           <div className="border-t border-gray-100"></div>

           <div className="space-y-2 text-sm text-gray-600">
             <p>📅 Ngày đăng: {new Date(photo.createdAt).toLocaleDateString('vi-VN')}</p>
             <p>🆔 ID: <span className="font-mono text-xs">{photo.id}</span></p>
           </div>

           <div className="border-t border-gray-100"></div>

           <TagManagementPanel photoId={photo.id} tags={photo.tags} />
          
           <DeleteButton photoId={photo.id} />

           <div className="flex-1"></div>
        </div>
      </div>

    </div>
  );
}