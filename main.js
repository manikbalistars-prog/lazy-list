import { db } from "./src/config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { initLogin } from "./src/ui/login";

const users = [];

async function testDB() {
  const snapshot = await getDocs(collection(db, "users"));

  snapshot.forEach((doc) => {
    users.push({
      id: doc.id,
      ...doc.data(),
    });
  });
  console.log(users);
}

initLogin();
testDB();
