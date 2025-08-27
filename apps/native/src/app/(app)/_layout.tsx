import { useAuth } from '@clerk/clerk-expo';
import { Redirect, Slot, useSegments } from 'expo-router';

const Layout = () => {
  const segments = useSegments();
  const inAuthGroup = segments[1] === '(authenticated)';

  const { isSignedIn } = useAuth();

  // Protect the inside area
  if (!isSignedIn && inAuthGroup) {
    return <Redirect href="/login" />;
  }

  if (isSignedIn && !inAuthGroup) {
    return <Redirect href="/(app)/(authenticated)/(tabs)/profile" />;
  }

  return <Slot />;
};

export default Layout;
