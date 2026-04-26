import { isAdmin } from "../services/auth";
import { hideLoader, isHidden } from "../utils/utils";
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
  try {
    hideLoader(false);
    if (!(await isAdmin())) {
      Swal.fire({
        title: "Authentication Failed!",
        text: `only atmin lol`,
        icon: "warning",
      });

      return;
    }

    isHidden(createForm, false);
  } catch (error) {
    console.log(error);
  } finally {
    hideLoader(true);
  }
}

async function createUserHandler() {
  try {
    hideLoader(false);
    if (!(await isAdmin())) {
      Swal.fire({
        title: "Authentication Failed!",
        text: `only atmin lol`,
        icon: "warning",
      });

      return;
    }
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
    Swal.fire({
      title: "Succes!",
      text: "user added",
      timer: 2000,
      timerProgressBar: true,
      icon: "success",
    });
    isHidden(createForm, true);
  } catch (error) {
    console.log(error);
  } finally {
    hideLoader(true);
  }
}
