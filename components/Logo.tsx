import React from 'react';
import Image, { ImageProps } from 'next/image';

// The logo is now correctly placed in the 'public' folder.
// When deployed, Netlify serves files from 'public' at the root '/'.
// So, the correct path is simply "/360logo.svg".
const logoImage = "/360logo.svg";

interface LogoProps extends Omit<ImageProps, 'src' | 'alt'> {
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({ 
  alt = "360Brief Logo", 
  width = 120,
  height = 40,
  ...props 
}) => {
  return (
    // Use Next.js Image component for optimized image loading
    <Image 
      src={logoImage} 
      alt={alt} 
      width={width}
      height={height}
      {...props}
    />
  );
};

export default Logo;