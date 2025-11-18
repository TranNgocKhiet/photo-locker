"use client";

import Link from "next/link";
import { UserButton, SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="bg-white shadow-md p-4 sticky top-0 z-[150]">
      <div className="container mx-auto flex justify-between items-center">
        
        <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-800">
          Photo Locker
        </Link>

        <div className="flex items-center gap-6">

          <div>
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="bg-black text-white px-4 py-2 rounded-full text-sm hover:bg-gray-800">
                  Log in
                </button>
              </SignInButton>
            </SignedOut>
          </div>

        </div>
      </div>
    </nav>
  );
}