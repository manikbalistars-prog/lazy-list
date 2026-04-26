import { db } from "../config/firebase";
import { collection, addDoc, query, where, getDocs } from "firebase/firestore";

export async function createUser(data) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      name: data.name,
      username: data.username,
      isAdmin: false,
    });
    return {
      id: docRef.id,
      name: data.name,
      username: data.username,
      isAdmin: false,
    };
  } catch (error) {
    throw error;
  }
}

export async function isAlreadyRegistered(username) {
  const q = query(collection(db, "users"), where("username", "==", username));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
}

export async function loadUser() {
  const snapshot = await getDocs(collection(db, "users"));

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}
