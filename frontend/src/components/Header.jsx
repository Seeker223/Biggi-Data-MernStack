import React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon, BellIcon } from "@heroicons/react/24/outline";

export default function Header({ title, showBack = true }) {
  const navigate = useNavigate();

  return (
    <div className="bg-black rounded-b-3xl px-5 py-4">
      <div className="flex justify-between items-center">
        {showBack ? (
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-white hover:text-orange-500 transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        ) : (
          <div className="w-10"></div> // Spacer
        )}

        <h1 className="text-xl font-bold text-white">{title}</h1>

        <button className="p-2 text-orange-500 hover:text-orange-400 transition-colors">
          <BellIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}