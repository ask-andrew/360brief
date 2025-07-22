import React from 'react';

// The previous 'import logoImage from './logo.png';' caused a compilation error
// because the build environment might not be configured to resolve local image imports
// in the same way a full React project (with Webpack/Vite) does.
//
// To fix this, we will use a direct URL to the raw image content on GitHub.
// IMPORTANT: You need to replace 'YOUR_GITHUB_USERNAME' and 'YOUR_REPOSITORY_NAME'
// with your actual GitHub username and the name of your repository.
// For example, if your username is 'octocat' and your repo is 'my-website',
// the URL would be:
// `https://raw.githubusercontent.com/octocat/my-website/main/components/logo.png`
const logoImage = "https://raw.githubusercontent.com/ask-andrew/360brief/main/components/logo.png";

interface LogoProps {
  className?: string;
  alt?: string;
}

const Logo: React.FC<LogoProps> = ({ className, alt = "Company Logo" }) => {
  return (
    // Use the direct GitHub URL as the src for the <img> tag.
    // The 'alt' attribute is crucial for accessibility.
    <img src={logoImage} alt={alt} className={className} />
  );
};

export default Logo;
