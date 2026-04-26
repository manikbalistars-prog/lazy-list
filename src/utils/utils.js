

const userDiv = document.getElementById("user");

export function initUser() {
  const user = localStorage.getItem("user");

  if (!user) {
    userDiv.textContent = "Guest";
    return;
  }

  const data = JSON.parse(user);

  userDiv.textContent = data.name;
}

export function isHidden(element, status) {
  element?.classList.toggle("hidden", status);
}

export function validateError(input) {
  if (!input.value.trim()) {
    input.classList.add("error-input");
    return true;
  } else {
    input.classList.remove("error-input");
    return false;
  }
}

export function removeError(input) {
  input.addEventListener("input", () => {
    if (input.value.trim() !== "") {
      input.classList.remove("error-input");
    }
  });
}

export function hideLoader(status) {
  const myloader = document.getElementById("loader");
  myloader.classList.toggle("hidden", status);
}


