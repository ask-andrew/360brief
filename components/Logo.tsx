import React from 'react';

// The logo is now correctly placed in the 'public' folder.
// When deployed, Netlify serves files from 'public' at the root '/'.
// So, the correct path is simply "/360logo.svg".
const logoImage = "/360logo.svg";

interface LogoProps {
  className?: string;
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({ className, alt = "360Brief Logo" }) => {
  return (
    // Use the root-relative path to the SVG file in the public folder.
    // The 'alt' attribute is crucial for accessibility.
    <img src={logoImage} alt={alt} className={className} />
  );
};

export default Logo;