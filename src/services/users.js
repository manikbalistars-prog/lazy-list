import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  runTransaction,
  doc,
  deleteDoc,
} from "firebase/firestore";

export async function createUser(data) {
  try {
    const counterRef = doc(db, "counters", "users");

    const userId = await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(counterRef);

      if (!snap.exists()) {
        transaction.set(counterRef, { lastUserId: 1 });
        return 1;
      }

      const lastUserId = snap.data().lastUserId;

      transaction.update(counterRef, {
        lastUserId: lastUserId + 1,
      });

      return lastUserId + 1;
    });

    const docRef = await addDoc(collection(db, "users"), {
      userId,
      name: data.name,
      username: data.username,
      isAdmin: false,
    });
    return {
      id: docRef.id,
      userId,
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

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function deleteUser(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }

  await deleteDoc(doc(db, "users", userId));
}
