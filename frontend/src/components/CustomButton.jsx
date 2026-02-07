import React from "react";

const CustomButton = ({
  title,
  onPress,
  bgColor = "#000000", // Black (your app's primary)
  textColor = "#FFFFFF",
  style = "",
  textStyle = "",
  disabled = false,
  loading = false,
}) => {
  return (
    <button
      onClick={onPress}
      disabled={disabled || loading}
      className={`
        px-6 py-3 rounded-full font-bold
        shadow-md hover:shadow-lg transition-all duration-200
        active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2
        ${disabled || loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
        ${style}
      `}
      style={{ backgroundColor: bgColor }}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2 text-white" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : (
        <span className={textStyle} style={{ color: textColor }}>
          {title}
        </span>
      )}
    </button>
  );
};

export default CustomButton;