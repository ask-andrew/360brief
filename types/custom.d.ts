// This file contains type declarations for custom elements and modules
// that don't have their own type definitions

// Ensure this file is treated as a module
export {};

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // SVG Elements
      svg: React.SVGProps<SVGSVGElement>;
      path: React.SVGProps<SVGPathElement>;
      rect: React.SVGProps<SVGRectElement>;
      circle: React.SVGProps<SVGCircleElement>;
      line: React.SVGProps<SVGLineElement>;
      polyline: React.SVGProps<SVGPolylineElement>;
      polygon: React.SVGProps<SVGPolygonElement>;
      g: React.SVGProps<SVGGElement>;
      defs: React.SVGProps<SVGDefsElement>;
      clipPath: React.SVGProps<SVGClipPathElement>;
      text: React.SVGProps<SVGTextElement>;
      tspan: React.SVGProps<SVGTSpanElement>;
      linearGradient: React.SVGProps<SVGLinearGradientElement>;
      stop: React.SVGProps<SVGStopElement>;
      
      // Add any other custom elements here
    }
  }
}

// This ensures the file is treated as a module
export {};
