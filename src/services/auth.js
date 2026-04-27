import { db } from "../config/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";

export async function loginByUsername(username) {
  const q = query(collection(db, "users"), where("username", "==", username));

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  let user = null;

  snapshot.forEach((doc) => {
    user = {
      id: doc.id,
      name: doc.data().name,
    };
  });

  return user;
}

export async function isAdmin() {
  const raw = localStorage.getItem("user");
  if (!raw) return false;

  const { id } = JSON.parse(raw);

  const snapshot = await getDoc(doc(db, "users", id));
  return snapshot.exists() && snapshot.data().isAdmin === true;
}


let cachedValid = null;

export async function isValidUser() {
  if (cachedValid !== null) return cachedValid;

  const raw = localStorage.getItem("user");
  if (!raw) return false;

  try {
    const { id } = JSON.parse(raw);
    const snapshot = await getDoc(doc(db, "users", id));

    cachedValid = snapshot.exists();
    return cachedValid;
  } catch {
    return false;
  }
}

let cachedUser = null;

export async function validateUser() {
  if (cachedUser) return cachedUser;

  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const { id } = JSON.parse(raw);
    const snap = await getDoc(doc(db, "users", id));

    if (!snap.exists()) return null;

    cachedUser = { id, ...snap.data() };
    return cachedUser;
  } catch {
    return null;
  }
}