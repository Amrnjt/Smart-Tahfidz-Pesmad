import React, { useState } from 'react';
import { GraduationCap } from 'lucide-react';
import ummiLogoSrc from '../assets/ummi-logo.png';

export interface UmmiLogoProps {
  className?: string;
  imageClassName?: string;
  alt?: string;
  fallbackIcon?: React.ComponentType<{ className?: string }>;
}

export const UmmiLogo: React.FC<UmmiLogoProps> = ({
  className = 'w-9 h-9',
  imageClassName = 'w-full h-full object-contain',
  alt = 'Metode Ummi',
  fallbackIcon: Fallback = GraduationCap
}) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(ummiLogoSrc || '/ummi-logo.png');

  const handleError = () => {
    if (currentSrc !== '/ummi-logo.png') {
      // Fallback to static root public asset
      setCurrentSrc('/ummi-logo.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return (
      <div className={`inline-flex items-center justify-center rounded-lg bg-amber-50 text-amber-800 ${className}`}>
        <Fallback className="w-2/3 h-2/3" />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-xl bg-white p-1 border border-amber-200/80 shadow-xs flex-shrink-0 overflow-hidden ${className}`}
    >
      <img
        src={currentSrc}
        alt={alt}
        className={imageClassName}
        loading="eager"
        decoding="async"
        onError={handleError}
      />
    </div>
  );
};

export const UmmiLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => {
  const [hasError, setHasError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>(ummiLogoSrc || '/ummi-logo.png');

  const handleError = () => {
    if (currentSrc !== '/ummi-logo.png') {
      setCurrentSrc('/ummi-logo.png');
    } else {
      setHasError(true);
    }
  };

  if (hasError) {
    return <GraduationCap className={className} />;
  }

  return (
    <span className={`inline-flex items-center justify-center rounded-md bg-white p-0.5 shadow-2xs overflow-hidden flex-shrink-0 ${className}`}>
      <img
        src={currentSrc}
        alt="Metode Ummi"
        className="w-full h-full object-contain"
        loading="eager"
        decoding="async"
        onError={handleError}
      />
    </span>
  );
};
