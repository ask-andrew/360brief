import * as React from 'react';

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
      text: React.SVGProps<SVGTextElement>;
      tspan: React.SVGProps<SVGTSpanElement>;
      g: React.SVGProps<SVGGElement>;
      defs: React.SVGProps<SVGDefsElement>;
      clipPath: React.SVGProps<SVGClipPathElement>;
      linearGradient: React.SVGProps<SVGLinearGradientElement>;
      radialGradient: React.SVGProps<SVGRadialGradientElement>;
      stop: React.SVGProps<SVGStopElement>;
      pattern: React.SVGProps<SVGPatternElement>;
      image: React.SVGProps<SVGImageElement>;
      foreignObject: React.SVGProps<SVGForeignObjectElement>;
      use: React.SVGProps<SVGUseElement>;
      symbol: React.SVGProps<SVGSymbolElement>;
    }
  }
}

export {};
