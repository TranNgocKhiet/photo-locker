"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import TagLink from "./TagLink"; 
import TagSearchFilter from "./TagSearchFilter";
import { useSearchParams } from "next/navigation"; 
import { toggleLockPhoto } from "../actions"; 
import { useLockerState } from "@/hooks/useLockerState";

interface Photo { id: string; imageUrl: string; tags: string[]; createdAt: Date; userId: string; isLocked: boolean; }

export default function PhotoGallery({ initialTags }: { initialTags: string[] }) {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [page, setPage] = useState(0); 
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false); 
    const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
    const searchParams = useSearchParams(); 
    
    const { isUnlocked } = useLockerState(); 
    
    console.log("PhotoGallery (Render Lần 2): isUnlocked = ", isUnlocked);

    const limit = 8; 

    const fetchPhotos = useCallback(async (nextPage: number, reset: boolean = false) => {
        setIsLoading(true);
        const tagsQuery = searchParams.get('tags') || '';
        
        try {
            const response = await fetch(`/api/photos?page=${nextPage}&limit=${limit}&tags=${tagsQuery}`);
            
            if (!response.ok) throw new Error("Failed to fetch data");
            
            const data = await response.json();
            
            setPhotos((prev) => reset ? data.photos : [...prev, ...data.photos]);
            setTotal(data.totalCount);
            setPage(nextPage);

        } catch (error) {
            console.error("API Error fetching photos:", error);
        } finally {
            setIsLoading(false);
        }
    }, [searchParams]);

    useEffect(() => {
        setPhotos([]);
        fetchPhotos(1, true);
        setPage(0);
    }, [searchParams.toString(), fetchPhotos, isUnlocked, ]); 

    const handleLoadMore = () => {
        if (photos.length < total) {
            fetchPhotos(page + 1);
        }
    };

    const handleBatchLock = async (lockState: boolean) => {
        setIsLoading(true);
        try {
            await Promise.all(
                selectedPhotos.map(async (id) => {
                    await toggleLockPhoto(id, lockState);
                })
            );
            fetchPhotos(page, true); 

        } catch (error) {
            console.error("Lỗi khi khóa/mở khóa:", error);
        } finally {
            setSelectedPhotos([]);
            setIsSelectionMode(false);
            setIsLoading(false);
        }
    };
    
    const toggleSelectPhoto = (photoId: string) => {
        setSelectedPhotos(prev => 
            prev.includes(photoId) 
                ? prev.filter(id => id !== photoId) 
                : [...prev, photoId]
        );
    };


    const queryString = searchParams.toString();
    
    const Toolbar = (
        <div className="flex justify-between items-center mb-4 p-3 border rounded-lg bg-white shadow-sm">
            <div>
                <button
                    onClick={() => setIsSelectionMode(prev => !prev)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded-full text-sm hover:bg-yellow-600 shadow-md transition-colors"
                >
                    {isSelectionMode ? "✕ Hủy Chọn" : "🔒 Chọn nhiều ảnh"}
                </button>
                    {isSelectionMode && (
                        <>
                            <button
                                onClick={() => handleBatchLock(true)}
                                disabled={isLoading || selectedPhotos.length === 0}
                                className={
                                    (isLoading || selectedPhotos.length === 0)
                                        ? 'ml-3 px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-400'
                                        : 'ml-3 px-4 py-2 rounded-full text-sm bg-black text-white hover:bg-gray-900'
                                }
                            >
                                🔒 Khóa ảnh đã chọn
                            </button>

                            <button
                                onClick={() => handleBatchLock(false)}
                                disabled={isLoading || selectedPhotos.length === 0 || !photos.some(p => selectedPhotos.includes(p.id) && p.isLocked)}
                                className={
                                    (isLoading || selectedPhotos.length === 0)
                                        ? 'ml-3 px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-400'
                                        : 'ml-3 bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700'
                                }
                            >
                                🔓 Mở khóa ảnh đã chọn
                            </button>

                            <button
                                onClick={async () => {
                                    if (selectedPhotos.length === 0) return;
                                    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedPhotos.length} ảnh đã chọn không?`)) return;
                                    setIsLoading(true);
                                    try {
                                        const res = await fetch('/api/photos/batch-delete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ ids: selectedPhotos }),
                                        });
                                        const json = await res.json();
                                        if (!res.ok || !json.success) throw new Error(json?.error || 'Delete failed');
                                        await fetchPhotos(page, true);
                                    } catch (err) {
                                        console.error('Batch delete error', err);
                                        alert('Xóa ảnh thất bại. Kiểm tra console để biết chi tiết.');
                                    } finally {
                                        setSelectedPhotos([]);
                                        setIsSelectionMode(false);
                                        setIsLoading(false);
                                    }
                                }}
                                disabled={isLoading || selectedPhotos.length === 0}
                                className={
                                    (isLoading || selectedPhotos.length === 0)
                                        ? 'ml-3 px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-400'
                                        : 'ml-3 bg-red-600 text-white px-4 py-2 rounded-full text-sm hover:bg-red-700'
                                }
                            >
                                🗑️ Xóa ảnh đã chọn
                            </button>
                        </>
                    )}
            </div>
            
            
        </div>
    );


    return (
        <>
            <TagSearchFilter allTags={initialTags} /> 

            <div className="mb-6">{Toolbar}</div>

            {photos.length === 0 && !isLoading && page > 0 && (
                 <div className="text-center text-gray-400 mt-10 py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    Không tìm thấy ảnh nào phù hợp với bộ lọc.
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {photos.map((photo) => {
                    const isSelected = selectedPhotos.includes(photo.id);
                    const isLocked = photo.isLocked;
                    const shouldHideContent = isLocked && !isUnlocked; 

                    const itemContent = (
                         <Image src={photo.imageUrl} alt="Photo" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                    );

                    const Wrapper = ({ children, photo }: { children: React.ReactNode, photo: Photo }) => {
                        if (shouldHideContent) {
                            if (isSelectionMode) {
                                return (
                                    <div
                                        onClick={() => toggleSelectPhoto(photo.id)}
                                        className={`relative block aspect-square overflow-hidden rounded-xl cursor-pointer transition-all border-4 ${isSelected ? 'border-blue-500 shadow-xl' : 'border-transparent'} bg-gray-900`}
                                    >
                                        <Image
                                            src={photo.imageUrl}
                                            alt="Locked"
                                            fill
                                            className="object-cover opacity-10 blur-sm"
                                        />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/30">
                                            <span className="text-4xl">🔒</span>
                                            <span className="text-sm mt-1 font-medium">Nội dung đã khóa</span>
                                        </div>
                                        {isSelected && <span className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-30">✓</span>}
                                    </div>
                                );
                            }

                            return (
                                <div
                                    onClick={() => {}}
                                    className="relative block aspect-square overflow-hidden rounded-xl bg-gray-900 border border-gray-700 shadow-sm flex items-center justify-center cursor-default"
                                >
                                    <Image
                                        src={photo.imageUrl}
                                        alt="Locked"
                                        fill
                                        className="object-cover opacity-10 blur-sm"
                                    />
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/30">
                                        <span className="text-4xl">🔒</span>
                                        <span className="text-sm mt-1 font-medium">Nội dung đã khóa</span>
                                    </div>
                                </div>
                            );
                        }

                        if (isSelectionMode) {
                            return (
                                <div
                                    onClick={() => toggleSelectPhoto(photo.id)}
                                    className={`relative block aspect-square overflow-hidden rounded-xl cursor-pointer transition-all border-4 ${isSelected ? 'border-blue-500 shadow-xl' : 'border-transparent'}`}
                                >
                                    {children}
                                    {isSelected && <span className="absolute top-2 left-2 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm z-30">✓</span>}
                                </div>
                            );
                        }

                        return (
                            <Link
                                href={`/photo/${photo.id}${queryString ? '?' + queryString : ''}`}
                                className="relative group block aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
                            >
                                {children}
                            </Link>
                        );
                    };

                    return (
                        <Wrapper key={photo.id} photo={photo}>
                            {!shouldHideContent && itemContent}
                            
                            {(!shouldHideContent && !isSelectionMode) && (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                    <div className="flex gap-1 flex-wrap">
                                        {photo.tags.slice(0, 3).map(tag => (<TagLink key={tag} tag={tag} />))}
                                    </div>
                                </div>
                            )}
                        </Wrapper>
                    );
                })}
            </div>

            {photos.length < total && (
                <div className="text-center mt-10">
                    <button
                        onClick={handleLoadMore}
                        className="bg-gray-200 text-gray-800 px-6 py-2 rounded-full font-semibold hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-500"
                        disabled={isLoading || photos.length === total}
                    >
                        {isLoading ? "Đang tải..." : `Xem thêm ${Math.min(limit, total - photos.length)} ảnh`}
                    </button>
                    <p className="text-sm text-gray-500 mt-2">
                        Đã tải: {photos.length} / {total}
                    </p>
                </div>
            )}
            {photos.length === total && total > 0 && (
                 <p className="text-center text-gray-500 mt-8">Đã xem hết tất cả ảnh.</p>
            )}
        </>
    );
}