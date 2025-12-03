import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../services/firebase';
import { useAppDispatch } from './hooks';
import { setUser, setLoading } from './slices/authSlice';
import { loadCart } from './slices/cartSlice';

export const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Extract only serializable user data
      const userData = currentUser
        ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            photoURL: currentUser.photoURL,
            emailVerified: currentUser.emailVerified,
            providerId: currentUser.providerId,
          }
        : null;
      dispatch(setUser(userData));
      dispatch(setLoading(false));
      
      // Load user's cart from backend when user logs in
      if (userData && userData.email) {
        try {
          await dispatch(loadCart(userData.email)).unwrap();
        } catch (error) {
          // Continue silently if cart loading fails (first time user might not have a cart)
        }
      }
    });

    return () => unsubscribe();
  }, [dispatch]);

  return <>{children}</>;
};
