// Authentication helper functions
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export type UserRole = 'admin' | 'institute' | 'student' | 'company';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  emailVerified: boolean;
  createdAt: Date;
  profile?: any;
}

// Register a new user
export const registerUser = async (
  email: string, 
  password: string, 
  role: UserRole,
  profileData: any
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Send email verification
    await sendEmailVerification(user);

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', user.uid), {
      uid: user.uid,
      email: user.email,
      role: role,
      emailVerified: false,
      createdAt: new Date(),
      status: role === 'company' || role === 'institute' ? 'pending' : 'active',
      profile: profileData
    });

    return { success: true, user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Login user
export const loginUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get user profile from Firestore
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      throw new Error('User profile not found');
    }

    const userData = userDoc.data() as UserProfile;

    return { success: true, user, userData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Logout user
export const logoutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Get current user profile
export const getCurrentUserProfile = async (user: User) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};
