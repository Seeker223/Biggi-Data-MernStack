import React from "react";
import { Link, useLocation } from "react-router-dom";
import { HomeIcon, ReceiptRefundIcon, WalletIcon, UserIcon } from "@heroicons/react/24/outline";
import { HomeIcon as HomeIconSolid, UserIcon as UserIconSolid } from "@heroicons/react/24/solid";

export default function BottomNav() {
  const location = useLocation();
  
  const navItems = [
    { 
      path: "/dashboard", 
      icon: location.pathname === "/dashboard" ? HomeIconSolid : HomeIcon, 
      label: "Home",
      active: location.pathname === "/dashboard"
    },
    { 
      path: "/draws", 
      icon: ReceiptRefundIcon, 
      label: "Draws",
      active: location.pathname === "/draws"
    },
    { 
      path: "/wallet", 
      icon: WalletIcon, 
      label: "Wallet",
      active: location.pathname === "/wallet"
    },
    { 
      path: "/profile", 
      icon: location.pathname === "/profile" ? UserIconSolid : UserIcon, 
      label: "Profile",
      active: location.pathname === "/profile"
    },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className="flex flex-col items-center p-2"
          >
            <item.icon className={`w-6 h-6 ${item.active ? "text-orange-500" : "text-gray-600"}`} />
            <span className={`text-xs mt-1 ${item.active ? "text-orange-500 font-semibold" : "text-gray-600"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}