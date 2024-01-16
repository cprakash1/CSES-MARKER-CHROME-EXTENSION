/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!**********************!*\
  !*** ./src/popup.js ***!
  \**********************/
const registerUserDiv = document.querySelector(".registerUserDiv");
const registerGroupDiv = document.querySelector(".registerGroupDiv");
const joiningGroupDiv = document.querySelector(".joiningGroup");

const registerUserBtn = document.querySelector("#registerUserBtn");
const registerGroupBtn = document.querySelector("#registerGroupBtn");
const joiningGroupBtn = document.querySelector("#joiningGroupBtn");

registerUserBtn.addEventListener("click", () => {
  registerUserDiv.style.display = "block";
  registerGroupDiv.style.display = "none";
  joiningGroupDiv.style.display = "none";
  registerGroupBtn.style.display = "none";
  joiningGroupBtn.style.display = "none";
  registerUserBtn.style.display = "none";
});
registerGroupBtn.addEventListener("click", () => {
  registerUserDiv.style.display = "none";
  registerGroupDiv.style.display = "block";
  joiningGroupDiv.style.display = "none";
  registerGroupBtn.style.display = "none";
  joiningGroupBtn.style.display = "none";
  registerUserBtn.style.display = "none";
});
joiningGroupBtn.addEventListener("click", () => {
  registerUserDiv.style.display = "none";
  registerGroupDiv.style.display = "none";
  joiningGroupDiv.style.display = "block";
  registerGroupBtn.style.display = "none";
  joiningGroupBtn.style.display = "none";
  registerUserBtn.style.display = "none";
});

document.querySelector("#registerUserBtn1").addEventListener("click", () => {
  const username = document.querySelector("#username1").value;
  const password = document.querySelector("#password1").value;
  const email = document.querySelector("#email1").value;
  fetch("http://127.0.0.1:3000/userRegister", {
    method: "POST",
    body: JSON.stringify({ username, password, email }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      if (data.success) {
        alert("User registered successfully");
        registerUserDiv.style.display = "none";
        registerGroupDiv.style.display = "none";
        joiningGroupDiv.style.display = "none";
        registerGroupBtn.style.display = "none";
        joiningGroupBtn.style.display = "none";
        registerUserBtn.style.display = "none";
      } else {
        alert("User already exists");
      }
    });
});

document.querySelector("#registerGroupBtn2").addEventListener("click", () => {
  const username = document.querySelector("#username2").value;
  const password = document.querySelector("#password2").value;
  const groupname = document.querySelector("#groupname2").value;
  const groupCode = document.querySelector("#groupCode2").value;
  fetch("http://127.0.0.1:3000/createGroup", {
    method: "POST",
    body: JSON.stringify({ username, password, groupname, groupCode }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.success) {
        alert("Group registered successfully");
        registerUserDiv.style.display = "none";
        registerGroupDiv.style.display = "none";
        joiningGroupDiv.style.display = "none";
        registerGroupBtn.style.display = "none";
        joiningGroupBtn.style.display = "none";
        registerUserBtn.style.display = "none";
      } else {
        alert("Group already exists");
      }
    });
});

document.querySelector("#joiningGroupBtn3").addEventListener("click", () => {
  const username = document.querySelector("#username3").value;
  const password = document.querySelector("#password3").value;
  const groupname = document.querySelector("#groupname3").value;
  const groupCode = document.querySelector("#groupCode3").value;
  fetch("http://127.0.0.1:3000/addMember", {
    method: "POST",
    body: JSON.stringify({ username, password, groupname, groupCode }),
    headers: {
      "Content-Type": "application/json",
    },
  })
    .then((res) => res.json())
    .then((data) => {
      console.log(data);
      if (data.success) {
        alert("Group joined successfully");
        registerUserDiv.style.display = "none";
        registerGroupDiv.style.display = "none";
        joiningGroupDiv.style.display = "none";
        registerGroupBtn.style.display = "none";
        joiningGroupBtn.style.display = "none";
        registerUserBtn.style.display = "none";
      } else {
        alert("Group does not exist");
      }
    });
});

/******/ })()
;
//# sourceMappingURL=popup.js.map