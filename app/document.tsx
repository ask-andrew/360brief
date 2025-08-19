import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html 
      lang="en" 
      className="h-full"
      suppressHydrationWarning={true} // Suppress hydration warnings for this element
    >
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#ffffff" />
      </Head>
      <body className="h-full bg-white">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
