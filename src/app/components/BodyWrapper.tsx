"use client";

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

export default function BodyWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const isPhotoView = pathname.startsWith('/photo/');

  useEffect(() => {
    if (isPhotoView) {
      document.body.classList.add('no-scroll');
    } else {
      document.body.classList.remove('no-scroll');
    }

    return () => {
      document.body.classList.remove('no-scroll');
    };
  }, [isPhotoView]);

  return <>{children}</>;
}