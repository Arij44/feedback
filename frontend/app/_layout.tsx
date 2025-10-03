import { Slot } from 'expo-router';
import { useEffect, useState } from 'react';
import { ThemeProvider } from '../components/Themecontext';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config';

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => setIsReady(true));
    return () => unsub();
  }, []);

  if (!isReady) return null;

  return (
    <ThemeProvider>
      <Slot />
    </ThemeProvider>
  );
}
