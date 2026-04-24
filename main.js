import { db } from "./src/config/firebase";
import { collection, getDocs } from "firebase/firestore";
import { initLogin } from "./src/ui/login";
import { createIcons, icons } from "lucide";
import { initUser } from "./src/utils/utils";
import { isHidden } from "./src/utils/utils";
import { validateError, removeError } from "./src/utils/utils";

const users = [];
const loginForm = document.getElementById("login-form");
const usernameForm = document.getElementById("username")
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


removeError(usernameForm)



isHidden(loginForm, true);
initLogin();
testDB();
createIcons({ icons });
initUser();
