import React from 'react';

interface KarMetraLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'full' | 'icon' | 'white' | 'dark';
  className?: string;
  onClick?: () => void;
}

export const KarMetraLogo: React.FC<KarMetraLogoProps> = ({
  size = 'md',
  variant = 'full',
  className = '',
  onClick
}) => {
  const textSizes = {
    xs: 'text-base sm:text-lg',
    sm: 'text-xl sm:text-2xl',
    md: 'text-2xl sm:text-3xl',
    lg: 'text-3xl sm:text-4xl',
    xl: 'text-4xl sm:text-5xl',
    '2xl': 'text-5xl sm:text-6xl'
  };

  // Navy color: #082142, Teal color: #00827F
  const karColor = variant === 'white' ? 'text-white' : 'text-[#082142]';
  const metraColor = 'text-[#00827F]';

  return (
    <div 
      className={`inline-flex items-center select-none cursor-pointer group ${className}`}
      onClick={onClick}
    >
      {/* Official KarMetra Wordmark Only */}
      <span className={`${textSizes[size]} font-black tracking-tight font-sans transition-transform group-hover:scale-[1.01]`}>
        <span className={karColor}>Kar</span>
        <span className={metraColor}>Metra</span>
      </span>
    </div>
  );
};

