import { db } from "../config/firebase";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

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

export async function isAdmin(id) {
  const docRef = doc(db, "users", id);
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) return false;

  return snapshot.data().isAdmin === true;
}
