import React from 'react';
import Link from 'next/link';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', width = 40, height = 40 }) => {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <svg
        width={width}
        height={height}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform hover:scale-105"
      >
        {/* Background Circle with subtle gradient */}
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#f0f0f0', stopOpacity: 1 }} />
          </linearGradient>
        </defs>
        <circle
          cx="60"
          cy="60"
          r="58"
          fill="url(#bgGradient)"
          className="dark:fill-gray-900"
        />

        {/* Outer Ring */}
        <circle
          cx="60"
          cy="60"
          r="54"
          stroke="#298126"
          strokeWidth="1.5"
          fill="none"
          className="dark:stroke-green-600"
        />

        {/* Inner Container */}
        <circle
          cx="60"
          cy="60"
          r="45"
          fill="white"
          className="dark:fill-gray-800"
        />

        {/* Helping Hands forming a Heart */}
        <g>
          {/* Left Hand (Giving) */}
          <path
            d="M45 75
               C 35 65, 35 55, 45 45
               C 55 35, 70 35, 75 45"
            stroke="#298126"
            strokeWidth="6"
            strokeLinecap="round"
            className="dark:stroke-green-500"
          />
          
          {/* Right Hand (Receiving) */}
          <path
            d="M75 75
               C 85 65, 85 55, 75 45
               C 65 35, 50 35, 45 45"
            stroke="#0066cc"
            strokeWidth="6"
            strokeLinecap="round"
            className="dark:stroke-blue-400"
          />

          {/* Heart Center */}
          <path
            d="M60 70
               C 65 65, 70 60, 70 55
               C 70 50, 65 45, 60 45
               C 55 45, 50 50, 50 55
               C 50 60, 55 65, 60 70
               Z"
            fill="#f57c21"
            className="dark:fill-orange-400"
          />
        </g>

        {/* Circular Text */}
        <g>
          {/* Top Text Arc */}
          <path
            id="topArc"
            d="M60 25 A35 35 0 0 1 95 60"
            fill="none"
          />
          <text className="text-[11px] font-bold">
            <textPath
              href="#topArc"
              startOffset="25%"
              className="fill-gray-700 dark:fill-gray-200"
            >
              GIVING HANDS
            </textPath>
          </text>

          {/* Bottom Text Arc */}
          <path
            id="bottomArc"
            d="M25 60 A35 35 0 0 0 60 95"
            fill="none"
          />
          <text className="text-[11px] font-bold">
            <textPath
              href="#bottomArc"
              startOffset="15%"
              className="fill-gray-700 dark:fill-gray-200"
            >
              HELPING HEARTS
            </textPath>
          </text>
        </g>
      </svg>
      <span className="font-sans text-xl font-semibold tracking-tight text-primary dark:text-green-500">
        Fitrii
      </span>
    </Link>
  );
};

export default Logo; 