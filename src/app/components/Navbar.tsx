"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import PinModal from "./PinModal"; 
import { useLockerState } from "../../hooks/useLockerState";
import { useRouter } from "next/navigation"; 
import Image from "next/image";

type ModalMode = 'CLOSE' | 'UNLOCK' | 'SET' | 'CHANGE';

export default function Navbar() {
  const [modalMode, setModalMode] = useState<ModalMode>('CLOSE');
  const { isUnlocked, unlockLocker, lockLocker } = useLockerState();
  const router = useRouter(); 
  
  const [isPinSet, setIsPinSet] = useState<boolean | null>(null); 

  useEffect(() => {
    async function checkPinStatus() {
      try {
        const response = await fetch('/api/pin-status');
        const data = await response.json();
        setIsPinSet(data.isSet);
      } catch (e) {
        setIsPinSet(false); 
      }
    }
    checkPinStatus();
  }, []); 

  const handleLockerClick = () => {
    if (isUnlocked) {
      lockLocker();
      setTimeout(() => { router.refresh(); }, 0); 
    } else {
      if (isPinSet !== null) {
        setModalMode(isPinSet ? 'UNLOCK' : 'SET');
      }
    }
  };

  const handleModalClose = () => {
    setModalMode('CLOSE');
  };
  
  const handleUnlockAndRefresh = () => {
    unlockLocker();
    setIsPinSet(true);
    setTimeout(() => {
        router.refresh(); 
    }, 0);
  };

  const lockerButtonText = isPinSet === null 
    ? 'Đang tải...' 
    : isUnlocked 
      ? '🔓 Khóa Locker' 
      : '🔒 Mở Khóa Locker';
      
  const isLockerDisabled = isPinSet === null;

  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-[150]">
      <div className="container mx-auto flex justify-between items-center">
        
        <Link href="/" className="flex items-center gap-2">
            <Image
                src="/logo.png"
                alt="Photo Locker Logo"
                width={55}
                height={55}
                className=""
            />
            <span className="text-xl font-bold text-blue-600 hover:text-blue-800">Photo Locker</span>
        </Link>

        <div className="flex items-center gap-6">
          
            <SignedIn>
            <button
              onClick={() => setModalMode(isPinSet ? 'CHANGE' : 'SET')}
              className="text-gray-600 hover:text-black font-medium text-sm mr-3"
            >
              {isPinSet ? 'Đổi PIN' : 'Đặt PIN'}
            </button>

            <button
                onClick={handleLockerClick}
                disabled={isLockerDisabled}
                className={`px-4 py-2 rounded-full text-sm font-medium shadow-md transition-colors ${
                    isUnlocked 
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-black text-white hover:bg-gray-800'
                } ${isLockerDisabled ? 'bg-gray-400 cursor-not-allowed' : ''}`}
            >
                {lockerButtonText}
            </button>
            
            <Link 
              href="/upload" 
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 flex items-center gap-2 shadow-md transition-transform hover:scale-105"
            >
              Tải ảnh lên
            </Link>
          </SignedIn>

          <div>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800">
                  Đăng nhập
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
      
      {modalMode !== 'CLOSE' && (
          <PinModal 
              onClose={handleModalClose}
              isPinSet={isPinSet!} 
              mode={modalMode}
              onUnlock={handleUnlockAndRefresh} 
          />
      )}
    </nav>
  );
}