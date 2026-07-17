
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-8 h-8" }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M75,30 L50,15 L25,30 L25,70 L50,85" 
        fill="none" 
        stroke="#0f2a43" 
        strokeWidth="18" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
      <path 
        d="M50,85 L75,70" 
        fill="none" 
        stroke="#3fa1e0" 
        strokeWidth="18" 
        strokeLinecap="butt" 
        strokeLinejoin="miter"
      />
    </svg>
  );
};

export default Logo;
