import { isAdmin } from "../services/auth";
import { isHidden } from "../utils/utils";
import { createUser, isAlreadyRegistered } from "../services/users";
import Swal from "sweetalert2";
const createForm = document.getElementById("create-form");
const addForm = document.getElementById("add-btn");
const addUserbtn = document.getElementById("btnSubmit");

const nameInput = document.getElementById("create-name");
const usernameInput = document.getElementById("create-username");

export function initCreateUser() {
  addUserbtn.addEventListener("click", createUserHandler);

  addForm.addEventListener("click", handleOpenForm);

  createForm.addEventListener("click", (e) => {
    if (e.target.id === "out-box") {
      isHidden(createForm, true);
    }
  });
}

async function handleOpenForm() {
  const raw = localStorage.getItem("user");
  if (!raw) return;

  const user = JSON.parse(raw);

  const checkAdmin = await isAdmin(user.id);

  if (!checkAdmin) {
    return;
  }

  isHidden(createForm, false);
}

async function createUserHandler() {
  const check = await isAlreadyRegistered(usernameInput.value);
  if (check) {
    Swal.fire({
      title: "Username has been taken!",
      text: `change it lol`,
      icon: "warning",
    });

    return;
  }
  const body = {
    name: nameInput.value,
    username: usernameInput.value,
  };
  const create = await createUser(body);

  console.log(create);
}
