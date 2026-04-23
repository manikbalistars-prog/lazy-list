import { doc } from "firebase/firestore";
import { loginByUsername } from "../services/auth";

export function initLogin() {
  const btnLogin = document.getElementById("btnLogin");
  btnLogin.addEventListener("click", handleLogin);
}

async function handleLogin() {
  const username = document.getElementById("username").value;

  const user = await loginByUsername(username);
  if (!username) {
    alert("Isi username dulu");
    return;
  }
  if (!user) {
    alert("User tidak ditemukan");
    return;
  }

  console.log(username);

  localStorage.setItem("user", JSON.stringify(user));
}
