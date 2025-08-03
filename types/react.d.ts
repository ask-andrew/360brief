import * as React from 'react';

declare module 'react' {
  interface SVGProps<T> extends React.PropsWithChildren, React.HTMLAttributes<T> {
    // Add any additional SVG props here
    className?: string;
    width?: string | number;
    height?: string | number;
    viewBox?: string;
    fill?: string;
    stroke?: string;
    strokeWidth?: string | number;
    strokeLinecap?: 'butt' | 'round' | 'square' | 'inherit';
    strokeLinejoin?: 'miter' | 'round' | 'bevel' | 'inherit';
    d?: string;
    x?: string | number;
    y?: string | number;
    cx?: string | number;
    cy?: string | number;
    r?: string | number;
    rx?: string | number;
    ry?: string | number;
    x1?: string | number;
    x2?: string | number;
    y1?: string | number;
    y2?: string | number;
    points?: string;
    transform?: string;
    clipPath?: string;
    clipRule?: 'nonzero' | 'evenodd' | 'inherit';
    fillRule?: 'nonzero' | 'evenodd' | 'inherit';
    strokeMiterlimit?: string | number;
    strokeDasharray?: string | number;
    strokeDashoffset?: string | number;
    strokeOpacity?: string | number;
    fillOpacity?: string | number;
  }

  // Add SVG element types
  interface SVGSVGElement extends SVGElement {}
  interface SVGPathElement extends SVGElement {}
  interface SVGRectElement extends SVGElement {}
  interface SVGCircleElement extends SVGElement {}
  interface SVGLineElement extends SVGElement {}
  interface SVGPolylineElement extends SVGElement {}
  interface SVGPolygonElement extends SVGElement {}
  interface SVGTextElement extends SVGElement {}
  interface SVGTSpanElement extends SVGElement {}
  interface SVGUseElement extends SVGElement {}
  interface SVGSymbolElement extends SVGElement {}
  interface SVGDefsElement extends SVGElement {}
  interface SVGGElement extends SVGElement {}
  interface SVGLinearGradientElement extends SVGElement {}
  interface SVGRadialGradientElement extends SVGElement {}
  interface SVGStopElement extends SVGElement {}
  interface SVGClipPathElement extends SVGElement {}
  interface SVGPatternElement extends SVGElement {}
  interface SVGImageElement extends SVGElement {}
  interface SVGForeignObjectElement extends SVGElement {}
}

// Add global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements {
      // HTML Elements
      div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
      span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
      button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
      a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
      
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
