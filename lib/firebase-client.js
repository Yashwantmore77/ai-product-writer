import { auth, db } from "./firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  getIdToken,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export async function signUpWithEmail(email, password) {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const uid = user.uid;
  const profile = { email, createdAt: Date.now() };
  await setDoc(doc(db, "users", uid), profile);
  return { uid, ...profile };
}

export async function signInWithEmailClient(email, password) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  const user = credential.user;
  const token = await getIdToken(user);
  return { uid: user.uid, email: user.email, token };
}

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const user = credential.user;
  const uid = user.uid;
  const email = user.email || null;

  // ensure a user profile document exists
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) {
    const profile = { email, createdAt: Date.now(), provider: 'google' };
    await setDoc(doc(db, "users", uid), profile);
  }

  const token = await getIdToken(user);
  return { uid, email, token };
}

export async function signOutClient() {
  await firebaseSignOut(auth);
}

export function onAuthChange(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function getUserByUid(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}
