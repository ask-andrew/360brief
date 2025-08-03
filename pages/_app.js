import { UserProvider } from '@auth0/nextjs-auth0/client';
import { Toaster } from 'react-hot-toast';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  return (
    <UserProvider>
      <Toaster position="top-right" />
      <Component {...pageProps} />
    </UserProvider>
  );
}

export default MyApp;
