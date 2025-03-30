import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ className = '', width = 200, height = 200 }) => {
  return (
    <Link href="/" className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt="Fitrii Logo"
        width={width}
        height={height}
        className="transition-transform hover:scale-105"
      />
    </Link>
  );
};

export default Logo; 