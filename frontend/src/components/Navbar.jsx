import React, { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout, notificationCount } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="bg-black text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-orange-500">
          Biggi Data
        </Link>

        <div className="flex items-center space-x-4">
          {user && (
            <>
              <Link to="/notifications" className="relative">
                🔔
                {notificationCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </span>
                )}
              </Link>
              <div className="flex items-center space-x-2">
                <img
                  src={user.photo || "/assets/default-profile.png"}
                  alt="Profile"
                  className="w-8 h-8 rounded-full border-2 border-orange-500"
                />
                <span className="hidden md:inline">{user.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-gray-800 rounded hover:bg-gray-700"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;