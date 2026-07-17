import { db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export const createUserProfile = async (
  uid: string,
  email: string
) => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);

    if (snap.exists()) return;

    await setDoc(userRef, {
      uid,
      email,
      name: "Tim",
      role: "Admin",
      position: "Agency Owner",
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn("Could not write user profile to Firestore (using fallback):", err);
  }
};