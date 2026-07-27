import { db } from "../config/firebase";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";

import { validateUser } from "./auth";

export function subscribeOffDay(startDate, endDate, callback) {
  const q = query(
    collection(db, "data"),
    where("date", ">=", startDate),
    where("date", "<", endDate),
    orderBy("date"),
  );

  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    callback(data);
  });
}

export async function createOffDay({ name, date, isHalf, userId }) {
  const user = await validateUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const payload = {
      name,
      date,
      isHalf,
      allDay: !isHalf,
      createdAt: new Date(),
    };

    if (userId != null && userId !== "") {
      payload.userId = userId;
    }

    const docRef = await addDoc(collection(db, "data"), payload);

    return docRef.id;
  } catch (error) {
    console.error("Error create offday:", error);
    throw error;
  }
}

export async function deleteOffDay(id) {
  const user = await validateUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await deleteDoc(doc(db, "data", id));
  } catch (err) {
    console.error("Error delete:", err);
    throw err;
  }
}

export async function updateOffDay(id, data) {
  const user = await validateUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    const ref = doc(db, "data", id);

    await updateDoc(ref, {
      ...data,
      updatedAt: new Date(),
    });
  } catch (err) {
    console.error("Error update:", err);
    throw err;
  }
}
