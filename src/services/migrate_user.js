import { db } from "../config/firebase";
import { collection, getDocs, writeBatch } from "firebase/firestore";

const userIds = {
  ode123: 1,
  eni123: 2,
  dandi123: 3,
  gilang123: 4,
  yuli123: 5,
  arik123: 6,
  ayuk123: 7,
  arya123: 8,
  artana123: 9,
  manikadmin123: 10,
  dwika123: 11,
  ketut123: 12,
  arsana123: 13,
  risma123: 14,
  yuki123: 15,
  ayumi123: 16,
  bintang123: 17,
  gusarta123: 18,
  frida123: 19,
};
export async function migrateUserId() {
  const snapshot = await getDocs(collection(db, "users"));
  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    const data = docSnap.data();

    const userId = userIds[data.username];

    if (userId !== undefined) {
      batch.update(docSnap.ref, {
        userId,
      });
    }
  });

  await batch.commit();
  console.log("Migrasi selesai");
}
