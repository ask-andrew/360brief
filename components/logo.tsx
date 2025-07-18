
import React from 'react';

// This is a placeholder SVG logo, encoded as a data URL.
// To use your own logo, go to a site like `https://www.base64-image.de/`,
// upload your logo.png, copy the generated Base64 string, and paste it here
// between the quotes, replacing the current data:image/svg+xml string.
const logoDataUrl = "data:image/svg+xml,%3csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' fill='%230ea5e9'%3e%3ccircle cx='50' cy='50' r='45' stroke='%23f1f5f9' stroke-width='10' fill='none' stroke-dasharray='212' stroke-dashoffset='53' transform='rotate(-90 50 50)'/%3e%3ctext x='50' y='62' font-family='Inter, sans-serif' font-size='30' font-weight='bold' fill='%23f1f5f9' text-anchor='middle'%3e360%3c/text%3e%3c/svg%3e";

interface LogoProps {
    className?: string;
    alt?: string;
}

const Logo: React.FC<LogoProps> = ({ className, alt = '360Brief Logo' }) => {
    return <img src={logoDataUrl} alt={alt} className={className} />;
};

export default Logo;
