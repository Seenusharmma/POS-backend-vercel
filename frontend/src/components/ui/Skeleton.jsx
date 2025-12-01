import React from "react";

/**
 * Skeleton Component
 * Displays a gray shimmering placeholder to indicate loading state.
 * 
 * Props:
 * - className: Additional classes for styling (width, height, margin, etc.)
 * - variant: 'text' | 'circular' | 'rectangular' (default: 'text')
 */
const Skeleton = ({ className = "", variant = "text" }) => {
  const baseClasses = "animate-pulse bg-gray-200 rounded";
  
  const variantClasses = {
    text: "h-4 w-full",
    circular: "rounded-full",
    rectangular: "h-full w-full",
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant] || ""} ${className}`}
    />
  );
};

export default Skeleton;
