import { loginByUsername } from "../services/auth";
import { hideLoader, initUser, isHidden } from "../utils/utils";
import Swal from "sweetalert2";
import { validateError } from "../utils/utils";


const usrBtn = document.getElementById("user-btn");
const loginForm = document.getElementById("login-form");
const btnLogin = document.getElementById("btnLogin");

export function initLogin() {
  btnLogin.addEventListener("click", handleLogin);

  usrBtn.addEventListener("click", () => {
    isHidden(loginForm, false);
  });

  loginForm.addEventListener("click", (e) => {
    if (e.target.id === "out-box") {
      isHidden(loginForm, true);
    }
  });
}

async function handleLogin() {
  const username = document.getElementById("username");
  const hasError = validateError(username);

  try {
    hideLoader(false)
    btnLogin.disabled = true;

    if (hasError) return;

    const user = await loginByUsername(username.value);

    if (!user) {
      Swal.fire({
        title: "Not Found!",
        text: `User ${username.value} tidak ditemukan, Hubungi manik`,
        icon: "error",
      });
      return;
    }

    username.value = "";
    isHidden(loginForm, true);

    localStorage.setItem(
      "user",
      JSON.stringify({
        id: user.id,
        name: user.name,
      })
    );

    Swal.fire({
      title: `Welcome ${user.name}!`,
      timer: 2000,
      timerProgressBar: true,
      icon: "success",
    });

    initUser();

  
   

  } catch (error) {
    console.log(error);
  } finally {
    btnLogin.disabled = false;
    hideLoader(true)
  }
}