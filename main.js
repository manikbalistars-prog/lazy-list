import { db } from "./src/config/firebase";
import { collection, doc, getDocs } from "firebase/firestore";
import { initLogin } from "./src/ui/login";
import { createIcons, icons } from "lucide";
import { hideLoader, initUser, isHidden, removeError } from "./src/utils/utils";
import { initCreateUser } from "./src/ui/create";
import { loadUser } from "./src/services/users";
import { initCalendar, initGuestSearch, renderUsers } from "./src/utils/render";

const users = [];
const loginForm = document.getElementById("login-form");
const createForm = document.getElementById("create-form");
const usernameForm = document.getElementById("username");

removeError(usernameForm);

export async function init() {
  isHidden(loginForm, true);
  isHidden(createForm, true);
  hideLoader(true);
  initLogin();
  initCreateUser();
  createIcons({ icons });
  initUser();
  renderUsers();
  const cal = await initCalendar();
  await initGuestSearch();
}

init();
