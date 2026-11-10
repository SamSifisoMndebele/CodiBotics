import React from 'react';

interface CodiBoticsLogoProps {
  className?: string;
}

export const CodiBoticsLogo: React.FC<CodiBoticsLogoProps> = ({
  className = 'w-10 h-10',
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 64 64"
      fill="none"
      className={className}
      aria-label="CodiBotics Logo"
    >
      <defs>
        <linearGradient
          id="cb-logo-grad"
          x1="0"
          y1="0"
          x2="64"
          y2="64"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <linearGradient
          id="cb-logo-visor"
          x1="16"
          y1="22"
          x2="48"
          y2="38"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>

      {/* Outer Rounded App Tile */}
      <rect width="64" height="64" rx="16" fill="#090d16" />
      <rect
        x="2.5"
        y="2.5"
        width="59"
        height="59"
        rx="13.5"
        stroke="url(#cb-logo-grad)"
        strokeWidth="3"
      />

      {/* Top Antenna */}
      <path
        d="M32 8V15"
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="32" cy="7" r="3.5" fill="#fbbf24" />

      {/* Code Bracket Ears: < and > */}
      <path
        d="M12 25L7 31L12 37"
        stroke="#38bdf8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M52 25L57 31L52 37"
        stroke="#fbbf24"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Robot Head Chassis */}
      <rect
        x="14"
        y="15"
        width="36"
        height="34"
        rx="10"
        fill="#1e293b"
        stroke="url(#cb-logo-grad)"
        strokeWidth="2.5"
      />

      {/* Dark Visor Screen */}
      <rect
        x="18"
        y="20"
        width="28"
        height="15"
        rx="5"
        fill="url(#cb-logo-visor)"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Glowing Robot Eyes */}
      <circle cx="25" cy="27.5" r="3.5" fill="#10b981" />
      <circle cx="26" cy="26.5" r="1.2" fill="#ecfdf5" />
      <circle cx="39" cy="27.5" r="3.5" fill="#38bdf8" />
      <circle cx="40" cy="26.5" r="1.2" fill="#f0f9ff" />

      {/* 5-LED Matrix Smile / Logic Bar */}
      <rect x="21" y="40" width="3.5" height="3.5" rx="1" fill="#fbbf24" />
      <rect x="26" y="41.5" width="3.5" height="3.5" rx="1" fill="#10b981" />
      <rect x="30.5" y="41.5" width="3.5" height="3.5" rx="1" fill="#10b981" />
      <rect x="35" y="41.5" width="3.5" height="3.5" rx="1" fill="#10b981" />
      <rect x="39.5" y="40" width="3.5" height="3.5" rx="1" fill="#fbbf24" />
    </svg>
  );
};
