import { db } from "./src/config/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { initLogin } from "./src/ui/login";
import { createIcons, icons } from "lucide";
import { initUser, isHidden, removeError } from "./src/utils/utils";
import { initCreateUser } from "./src/ui/create";

const users = [];
const loginForm = document.getElementById("login-form");
const createForm = document.getElementById("create-form");
const usernameForm = document.getElementById("username");
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

removeError(usernameForm);

export async function init() {
  isHidden(loginForm, true);
  isHidden(createForm, true);

  initLogin();
  initCreateUser();
  testDB();
  createIcons({ icons });
  initUser();

}

init();
