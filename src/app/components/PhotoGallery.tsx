"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import TagLink from "./TagLink"; 
import TagSearchFilter from "./TagSearchFilter";
import PinModal from "./PinModal";
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
    const [isPinSet, setIsPinSet] = useState<boolean | null>(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinModalMode, setPinModalMode] = useState<'SET' | 'UNLOCK' | 'CHANGE'>('SET');
    const [pendingAction, setPendingAction] = useState<'lock' | 'unlock' | 'delete' | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const searchParams = useSearchParams(); 
    const tagsQuery = searchParams.get('tags') || '';
    const queryString = searchParams.toString();
    const selectedTags = (searchParams.get('tags') || '').split(',').filter(Boolean);
    const [requireAllTags, setRequireAllTags] = useState(false);
    
    const { isUnlocked } = useLockerState(); 
    
    const limit = 8; 

    const fetchPhotos = useCallback(async (nextPage: number, reset: boolean = false) => {
        setIsLoading(true);
        
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
    }, [tagsQuery]);

    useEffect(() => {
        async function checkPinStatus() {
            try {
                const response = await fetch('/api/pin-status');
                const data = await response.json();
                setIsPinSet(data.isSet);
            } catch {
                setIsPinSet(false);
            }
        }
        checkPinStatus();
        setPhotos([]);
        fetchPhotos(1, true);
        setPage(0);
    }, [queryString, fetchPhotos, isUnlocked]); 

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

    const requestBatchLock = async (lockState: boolean) => {
        if (isUnlocked) {
            return handleBatchLock(lockState);
        }
        let hasPin = isPinSet;
        try {
            if (isPinSet === null) {
                const res = await fetch('/api/pin-status');
                const data = await res.json();
                hasPin = !!data.pinHash;
                setIsPinSet(hasPin);
            }
        } catch (err) {
            console.error('Error fetching pin status', err);
            hasPin = false;
            setIsPinSet(false);
        }

        if (!hasPin) {
            setPendingAction('lock');
            setPinModalMode('SET');
            setShowPinModal(true);
            return;
        }

        setPendingAction('lock');
        setPinModalMode('UNLOCK');
        setShowPinModal(true);
        return;
    };
    
    const requestBatchUnlock = async () => {
        if (selectedPhotos.length === 0) return;

        if (isUnlocked) {
            return handleBatchLock(false);
        }

        let hasPin = isPinSet;
        try {
            if (isPinSet === null) {
                const res = await fetch('/api/pin-status');
                const data = await res.json();
                hasPin = !!data.isSet;
                setIsPinSet(hasPin);
            }
        } catch (err) {
            console.error('Error fetching pin status', err);
            hasPin = false;
            setIsPinSet(false);
        }

        if (!hasPin) {
            setPendingAction('unlock');
            setPinModalMode('SET');
            setShowPinModal(true);
            return;
        }

        setPendingAction('unlock');
        setPinModalMode('UNLOCK');
        setShowPinModal(true);
    };
    
    const toggleSelectPhoto = (photoId: string) => {
        setSelectedPhotos(prev => 
            prev.includes(photoId) 
                ? prev.filter(id => id !== photoId) 
                : [...prev, photoId]
        );
    };

    const selectedHasLocked = selectedPhotos.some(id => photos.find(p => p.id === id)?.isLocked);
    const selectedHasUnlocked = selectedPhotos.some(id => {
        const p = photos.find(p => p.id === id);
        return !!p && !p.isLocked;
    });


    
    
    const Toolbar = (
        <div className="flex justify-between items-center mb-4 p-3 border rounded-lg bg-white shadow-sm">
            <div>
                <div className="flex items-center gap-3">
                  <button
                      onClick={() => setIsSelectionMode(prev => !prev)}
                      className="bg-gray-400 text-white px-4 py-2 rounded-full text-sm hover:bg-gray-500 shadow-md transition-colors"
                  >
                      {isSelectionMode ? "✕ Hủy Chọn" : "Chọn nhiều ảnh"}
                  </button>

                  <button
                      onClick={() => setRequireAllTags(prev => !prev)}
                      className={`px-3 bg-gray-200 py-2 rounded-full text-sm ${requireAllTags ? 'bg-gray-900 text-white' : 'hover:bg-gray-300'}`}
                      title="Chỉ hiện ảnh chứa đủ thẻ (tag) đã chọn"
                  >
                      Chỉ hiện ảnh chứa đủ thẻ
                  </button>

                  {isSelectionMode && (
                        <>
                            <button
                                onClick={() => requestBatchLock(true)}
                                disabled={isLoading || selectedPhotos.length === 0 || !selectedHasUnlocked}
                                className={
                                    (isLoading || selectedPhotos.length === 0 || !selectedHasUnlocked)
                                        ? 'ml-3 px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-400'
                                        : 'ml-3 px-4 py-2 rounded-full text-sm bg-black text-white hover:bg-gray-900'
                                }
                            >
                                🔒 Khóa ảnh đã chọn
                            </button>

                            <button
                                onClick={() => requestBatchUnlock()}
                                disabled={isLoading || selectedPhotos.length === 0 || !selectedHasLocked}
                                className={
                                    (isLoading || selectedPhotos.length === 0 || !selectedHasLocked)
                                        ? 'ml-3 px-4 py-2 rounded-full text-sm bg-gray-100 text-gray-400'
                                        : 'ml-3 bg-green-600 text-white px-4 py-2 rounded-full text-sm hover:bg-green-700'
                                }
                            >
                                🔓 Mở khóa ảnh đã chọn
                            </button>

                            <button
                                onClick={async () => {
                                    // Request delete, but if any selected photo is locked and locker is locked,
                                    // require PIN first.
                                    if (selectedPhotos.length === 0) return;

                                    // If any selected photos are locked and the global locker is locked,
                                    // route through the PIN flow.
                                    if (selectedHasLocked && !isUnlocked) {
                                        // If no PIN is set, open SET modal; otherwise open UNLOCK modal.
                                        try {
                                            let hasPin = isPinSet;
                                            if (isPinSet === null) {
                                                const res = await fetch('/api/pin-status');
                                                const data = await res.json();
                                                hasPin = !!data.isSet;
                                                setIsPinSet(hasPin);
                                            }

                                            setPendingAction('delete');
                                            setPinModalMode(hasPin ? 'UNLOCK' : 'SET');
                                            setShowPinModal(true);
                                            return;
                                        } catch (err) {
                                            console.error('Error checking pin status before delete', err);
                                            // fallthrough to attempt delete (will likely fail server-side for locked items)
                                        }
                                    }
                                    // Otherwise open in-app confirmation modal (locker unlocked or no locked items selected)
                                    setShowDeleteConfirm(true);
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
            
            
        </div>
    );


    return (
        <>
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6">
                        <h3 className="text-lg font-semibold mb-2">Xác nhận xóa ảnh</h3>
                        <p className="text-sm text-gray-600 mb-4">Bạn có chắc chắn muốn xóa {selectedPhotos.length} ảnh đã chọn? Hành động này không thể hoàn tác.</p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-4 py-2 rounded-full bg-gray-100 text-gray-700"
                            >Hủy</button>
                            <button
                                onClick={async () => {
                                    setShowDeleteConfirm(false);
                                    setIsLoading(true);
                                    try {
                                        const res = await fetch('/api/photos/batch-delete', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ ids: selectedPhotos }),
                                        });
                                        const json = await res.json();
                                        if (!res.ok || !json.success) throw new Error(json?.error || 'Delete failed');
                                        await fetchPhotos(page || 1, true);
                                    } catch (err) {
                                        console.error('Batch delete error', err);
                                        alert('Xóa ảnh thất bại. Kiểm tra console để biết chi tiết.');
                                    } finally {
                                        setSelectedPhotos([]);
                                        setIsSelectionMode(false);
                                        setIsLoading(false);
                                    }
                                }}
                                className="px-4 py-2 rounded-full bg-red-600 text-white hover:bg-red-700"
                            >Xóa</button>
                        </div>
                    </div>
                </div>
            )}
            {showPinModal && (
                <PinModal
                    onClose={() => { setShowPinModal(false); setPendingAction(null); }}
                    isPinSet={!!isPinSet}
                    mode={pinModalMode}
                    onUnlock={async () => {
                        setIsPinSet(true);
                        setShowPinModal(false);
                        const action = pendingAction;
                        setPendingAction(null);

                        if (action === 'delete') {
                            // show delete confirm after successful PIN
                            setShowDeleteConfirm(true);
                            return;
                        }

                        if (action === 'unlock') {
                            await handleBatchLock(false);
                        } else if (action === 'lock') {
                            await handleBatchLock(true);
                        }
                    }}
                />
            )}
            <TagSearchFilter allTags={initialTags} /> 

            <div className="mb-6">{Toolbar}</div>

            {photos.length === 0 && !isLoading && page > 0 && (
                 <div className="text-center text-gray-400 mt-10 py-20 border-2 border-dashed border-gray-200 rounded-xl">
                    Không tìm thấy ảnh nào phù hợp với bộ lọc.
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {(
                    requireAllTags && selectedTags.length > 0
                    ? photos.filter(photo => selectedTags.every(t => photo.tags.includes(t)))
                    : photos
                ).map((photo) => {
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
                                    {photo.isLocked && (
                                        <span className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs z-30" aria-hidden>
                                            🔒
                                        </span>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                href={`/photo/${photo.id}${queryString ? '?' + queryString : ''}`}
                                className="relative group block aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-sm border border-gray-200 hover:shadow-lg transition-all hover:-translate-y-1"
                            >
                                {children}
                                {photo.isLocked && (
                                    <span className="absolute top-2 right-2 bg-black/70 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs z-30">🔒</span>
                                )}
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