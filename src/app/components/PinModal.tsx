"use client";

import { useState, Dispatch, SetStateAction } from 'react';
import { setLockPin, verifyPin, changePin } from '../../app/actions';
import { useLockerState } from '../../hooks/useLockerState';
import { useRouter } from 'next/navigation';

type ModalMode = 'SET' | 'UNLOCK' | 'CHANGE'; 

interface PinModalProps {
    onClose: () => void;
    isPinSet: boolean;
    mode: ModalMode; 
    onUnlock: () => void;
}

// Định nghĩa kiểu dữ liệu cho trường input (giúp TypeScript hiểu)
interface FieldProps {
    pin: string; 
    placeholder: string;
    value?: string; // Tùy chọn
    setValue?: Dispatch<SetStateAction<string>>; // Tùy chọn
}


export default function PinModal({ onClose, isPinSet, mode, onUnlock }: PinModalProps) {
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const currentMode = !isPinSet && mode !== 'SET' ? 'SET' : mode;

    const handlePinValidation = (input: string | undefined): string | null => {
        if (!input || input.length !== 4 || isNaN(Number(input))) {
            return "PIN phải là 4 chữ số.";
        }
        return null;
    };

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage('');
        setIsLoading(true);

        const formData = new FormData();
        
        try {
            if (currentMode === 'SET') {
                if (handlePinValidation(pin)) throw new Error(handlePinValidation(pin)!);
                formData.append('pin', pin);
                await setLockPin(formData);
                onUnlock();
                onClose();
            } else if (currentMode === 'CHANGE') {
                if (handlePinValidation(newPin)) throw new Error("Mã PIN mới không hợp lệ.");
                if (newPin !== confirmPin) throw new Error("Mã PIN mới không khớp.");
                
                formData.append('oldPin', pin);
                formData.append('newPin', newPin);
                const result = await changePin(formData);
                
                if (result.success) {
                    onClose();
                } else {
                    throw new Error(result.error || "Lỗi đổi PIN không xác định.");
                }

            } else { // UNLOCK
                if (handlePinValidation(pin)) throw new Error(handlePinValidation(pin)!);
                formData.append('pin', pin);
                const result = await verifyPin(formData);
                if (result.success) {
                    onUnlock();
                    onClose();
                } else {
                    throw new Error('Mã PIN không chính xác.');
                }
            }
        } catch (e: any) {
            setErrorMessage(e.message || 'Lỗi hệ thống.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderContent = () => {
        switch (currentMode) {
            case 'SET':
                return { 
                    title: '🔐 Thiết lập Mã PIN', 
                    buttonText: 'Đặt PIN & Mở Khóa', 
                    color: 'bg-blue-600', 
                    fields: [{ pin: 'pin', placeholder: 'Mã PIN 4 chữ số', value: pin, setValue: setPin } as FieldProps] 
                };
            case 'UNLOCK': 
                return { 
                    title: '🔐 Nhập Mã PIN Locker', 
                    buttonText: 'Xác thực', 
                    color: 'bg-black', 
                    fields: [{ pin: 'pin', placeholder: 'Mã PIN 4 chữ số', value: pin, setValue: setPin } as FieldProps] 
                };
            case 'CHANGE':
                return { 
                    title: '🔄 Đổi Mã PIN', 
                    buttonText: 'Cập nhật PIN mới', 
                    color: 'bg-indigo-600', 
                    fields: [
                        { pin: 'oldPin', placeholder: 'Mã PIN cũ', value: pin, setValue: setPin } as FieldProps,
                        { pin: 'newPin', placeholder: 'Mã PIN mới (4 chữ số)', value: newPin, setValue: setNewPin } as FieldProps,
                        { pin: 'confirmPin', placeholder: 'Nhập lại PIN mới', value: confirmPin, setValue: setConfirmPin } as FieldProps,
                    ]
                };
            default: return { title: '', buttonText: '', color: 'bg-gray-500', fields: [] as FieldProps[] };
        }
    };

    const content = renderContent();

    // Kiểm tra PIN toàn cục cho nút submit (chỉ cần kiểm tra trường chính là pin)
    const isGlobalValidationFailed = handlePinValidation(pin) !== null && currentMode !== 'CHANGE';


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-2xl max-w-sm w-full text-center relative animate-in zoom-in duration-300">
                
                <button onClick={onClose} className="absolute top-3 right-3 text-2xl text-gray-500 hover:text-gray-900">
                    &times;
                </button>

                <h2 className="text-2xl font-bold mb-2">{content.title}</h2>
                <p className="text-gray-600 mb-6 text-sm">
                    {currentMode === 'SET' && "Đây là lần đầu tiên, hãy đặt mã PIN 4 chữ số."}
                    {currentMode === 'UNLOCK' && "Xác thực để xem ảnh cá nhân."}
                    {currentMode === 'CHANGE' && "Vui lòng nhập mã PIN cũ và mã PIN mới."}
                </p>

                <form onSubmit={handleAction} className="flex flex-col gap-3">
                    {content.fields.map((field) => (
                        <input
                            key={field.pin}
                            type="password"
                            // ✨ FIX VÀNG: Sử dụng Optional Chaining (?. )
                            value={field.value}
                            onChange={(e) => field.setValue?.(e.target.value.slice(0, 4))} 
                            maxLength={4}
                            placeholder={field.placeholder}
                            className={`w-full text-center p-4 border-2 border-gray-400 rounded-lg tracking-widest outline-none ${currentMode !== 'CHANGE' ? 'text-3xl' : 'text-xl'}`}
                            required
                        />
                    ))}

                    {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
                    
                    <button
                        type="submit"
                        disabled={
                            isLoading || 
                            (currentMode !== 'CHANGE' && !!isGlobalValidationFailed) || 
                            (currentMode === 'CHANGE' && (!!handlePinValidation(pin) || !!handlePinValidation(newPin) || newPin !== confirmPin))
                        }
                        className={`w-full ${content.color} text-white py-3 rounded-lg font-semibold hover:${content.color.replace('600', '700')} disabled:bg-gray-400`}
                    >
                        {isLoading ? 'Đang xử lý...' : content.buttonText}
                    </button>
                </form>

            </div>
        </div>
    );
}