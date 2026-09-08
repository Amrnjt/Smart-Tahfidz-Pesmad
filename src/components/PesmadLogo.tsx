import React from 'react';
import pesmadSvg from '../assets/images/logo_pesmad.svg';

interface PesmadLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
}

/**
 * Komponen Lambang/Logo Default Aplikasi Smart Tahfidz Pesmad
 */
export const PesmadLogo: React.FC<PesmadLogoProps> = ({
  className = '',
  size = 'md',
  alt = "Logo Smart Tahfidz Pesmad Darul Fikri"
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const selectedSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 ${selectedSize} ${className}`}>
      <img
        src={pesmadSvg}
        alt={alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain"
      />
    </div>
  );
};
