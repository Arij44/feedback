import { signInWithEmailAndPassword, getAuth } from "firebase/auth";
import { auth } from "./config";
import { createUserWithEmailAndPassword } from "firebase/auth";


// Login function for login screen
export const loginUser = async (email: string, password: string): Promise<string> => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
};

// Register function for signup screen
export async function registerUser(email: string, password: string) {
  console.log('RegisterUser auth:', auth);

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const idToken = await userCredential.user.getIdToken();
  return idToken;
}

// Add this function so you can fetch token from current logged-in user
export async function getIdToken(): Promise<string> {
  const currentUser = getAuth().currentUser;

  if (!currentUser) {
    throw new Error("No user is currently signed in");
  }

  const token = await currentUser.getIdToken();
  return token;
}
