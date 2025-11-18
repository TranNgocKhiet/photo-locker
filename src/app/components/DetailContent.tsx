"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import TagManagementPanel from './TagManagementPanel';
import DeleteButton from './DeleteButton';

interface DetailContentProps {
  photo: any; 
  backLink: string;
  tagName?: string;
}

export default function DetailContent({ photo, backLink, tagName }: DetailContentProps) {
  const [showInfo, setShowInfo] = useState(true);
  
  const infoColumnClass = showInfo ? 'w-2/5' : 'w-0 overflow-hidden'; 

  return (
    <div className="min-h-screen bg-gray-100 p-10 flex justify-center">
      <div className="bg-white p-6 rounded-xl shadow-xl max-w-6xl w-full flex gap-4">
        
        <button 
            onClick={() => setShowInfo(!showInfo)}
            className={`absolute top-20 right-10 z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-md ${showInfo ? 'bg-black text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
            title="Bật/Tắt Chi Tiết"
        >
            {showInfo ? '✖' : 'ℹ'}
        </button>

        <div className="w-3/5 relative h-[500px] bg-black rounded-lg overflow-hidden transition-all duration-300">
          <Image
            src={photo.imageUrl}
            alt="Detail"
            fill
            className="object-contain" 
            priority
          />
        </div>

        <div 
          className={`relative h-[500px] flex flex-col gap-4 transition-all duration-300 ${infoColumnClass}`}
          style={{ minWidth: showInfo ? '250px' : '0px' }}
        >
          <div className="flex justify-between items-start">
            <Link href={backLink} className="text-gray-500 hover:text-black">← Quay lại</Link>
            <DeleteButton photoId={photo.id} />
          </div>

          <h1 className="text-2xl font-bold text-gray-800">Chi tiết ảnh</h1>
          <p className="text-gray-500">Publish date: {new Date(photo.createdAt).toLocaleDateString('vi-VN')}</p>

          <div className="border-t border-gray-200 my-2"></div>

          <TagManagementPanel photoId={photo.id} tags={photo.tags} />
          
          <div className="flex-1"></div> 
          
          {tagName && (
             <p className="text-xs text-gray-500">Đang xem trong bộ lọc: {tagName.split(",").join(", ")}</p>
          )}

        </div>
      </div>
    </div>
  );
}