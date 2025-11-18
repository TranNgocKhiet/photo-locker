"use client";

import { useState } from 'react';
import TagManager from './TagManager';
import { addTag } from '../../app/actions';

interface TagPanelProps {
    photoId: string;
    tags: string[];
}

export default function TagManagementPanel({ photoId, tags }: TagPanelProps) {
    const [mode, setMode] = useState<'view' | 'add' | 'remove'>('view');

    const handleAddTagAction = async (formData: FormData) => {
        await addTag(formData);
        setMode('view');
    };

    const getModeButtonClass = (targetMode: 'add' | 'remove') => 
        `px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            mode === targetMode 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
        }`;

    return (
        <div className="flex flex-col gap-4">
            
            <div className="flex border-b border-gray-200 pb-2">
                <button
                    onClick={() => setMode(mode === 'view' ? 'add' : 'view')}
                    className={getModeButtonClass('add')}
                >
                    + Thêm Tag Mới
                </button>
                <button
                    onClick={() => setMode(mode === 'remove' ? 'view' : 'remove')}
                    className={`ml-2 ${getModeButtonClass('remove')}`}
                >
                    × Xóa Tag Đã Có
                </button>
            </div>

            {mode === 'view' && (
                <div className='p-2 bg-gray-50 rounded-lg border border-gray-200'>
                   <h3 className='text-sm font-semibold mb-2'>Tags hiện tại:</h3>
                   <TagManager photoId={photoId} tags={tags} isManagementMode={false} />
                </div>
            )}
            
            {mode === 'add' && (
                <form action={handleAddTagAction} className="flex flex-col gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <input type="hidden" name="photoId" value={photoId} />
                    <input 
                        name="tag" 
                        placeholder="Gõ tag mới (vd: chill)" 
                        className="border p-2 rounded text-sm focus:ring-2 focus:ring-blue-500" 
                        required 
                    />
                    <button type="submit" className="bg-blue-600 text-white py-2 rounded text-sm hover:bg-blue-700">
                        Lưu Tag Mới
                    </button>
                </form>
            )}

            {mode === 'remove' && (
                <div className='p-3 bg-red-50 rounded-lg border border-red-200'>
                    <h3 className='text-sm font-bold text-red-700 mb-2'>Nhấn vào tag để xóa vĩnh viễn:</h3>
                    <TagManager photoId={photoId} tags={tags} isManagementMode={true} />
                </div>
            )}
        </div>
    );
}