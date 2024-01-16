console.log("Extension loaded");

const fetchUrl = "https://cses-marker.onrender.com";

import leafstore from "leafstore-db";

const db = new leafstore("CSES_MARKER_EXTENSION_DB");

const problemSchema = leafstore.Schema({
  _id: {
    type: leafstore.SchemaTypes.String,
    required: false,
  },
  problemName: leafstore.SchemaTypes.String,
  problemId: leafstore.SchemaTypes.String,
  isImportant: leafstore.SchemaTypes.Boolean,
  message: leafstore.SchemaTypes.String,
  user: leafstore.SchemaTypes.String,
  group: leafstore.SchemaTypes.String,
  username: leafstore.SchemaTypes.String,
});

const userSchema = leafstore.Schema({
  _id: leafstore.SchemaTypes.String,
  email: leafstore.SchemaTypes.String,
  username: leafstore.SchemaTypes.String,
  password: leafstore.SchemaTypes.String,
  sorting: leafstore.SchemaTypes.String,
  filter: leafstore.SchemaTypes.String,
  groupJoined: leafstore.SchemaTypes.String,
  questions: [
    {
      _id: {
        type: leafstore.SchemaTypes.String,
        required: false,
      },
      problemName: leafstore.SchemaTypes.String,
      problemId: leafstore.SchemaTypes.String,
      isImportant: leafstore.SchemaTypes.Boolean,
      message: leafstore.SchemaTypes.String,
      user: leafstore.SchemaTypes.String,
      group: leafstore.SchemaTypes.String,
      username: leafstore.SchemaTypes.String,
    },
  ],
});
const User = db.Model("User", userSchema);
const Problem = db.Model("Problem", problemSchema);

//   DIV1
// insert a div before content class div into the DOM
const div1 = document.createElement("div");
div1.id = "cses-marker-extension-root-1";
// div.style.display = "none";
const contentDiv = document.querySelector(".content");
contentDiv.insertBefore(div1, contentDiv.firstChild);
div1.innerHTML = `
<button id="cses-marker-click-to-login-button">Click to LogIn</button>
`;

//   DIV2
const div2 = document.createElement("div");
div2.id = "cses-marker-extension-root-2";
div2.style.display = "none";
const contentDiv2 = document.querySelector(".content");
contentDiv2.insertBefore(div2, contentDiv2.firstChild);
div2.innerHTML = `
username: <input id="username" type="text" /> password: <input id="password" type="password" /> <button id="cses-marker-login-button">LogIn</button>
`;

//   DIV3
const div3 = document.createElement("div");
div3.id = "cses-marker-extension-root-3";
div3.style.display = "none";
const contentDiv3 = document.querySelector(".content");
contentDiv2.insertBefore(div3, contentDiv3.firstChild);
div3.innerHTML = `
<button id="cses-marker-sync-button">Sync</button><button id="cses-marker-logout-button">LogOut</button>
`;

//                DIV OVER

//       ADDING MARK IMPORTANT BUTTON CHECKBOX BEFORE A TASK TAG
const TASK_LI_ELEMENT = document.querySelectorAll(".task");
TASK_LI_ELEMENT.forEach((taskElement) => {
  const checkboxDiv = document.createElement("div");
  checkboxDiv.className = "checkbox";
  const checkboxInput = document.createElement("input");
  checkboxInput.type = "checkbox";
  const anchorElement = taskElement.querySelector("a");
  if (anchorElement) {
    // Extract href attribute
    checkboxInput.className = "cses-marker-checkbox";
    const hrefAttribute = anchorElement.getAttribute("href");
    checkboxInput.dataset.problemId = hrefAttribute;
    checkboxInput.dataset.problemName =
      anchorElement.innerText || anchorElement.textContent;
  }
  checkboxDiv.appendChild(checkboxInput);
  taskElement.insertBefore(checkboxDiv, taskElement.firstChild);
});

const call2 = async () => {
  const count = await User.find({});
  const count2 = await Problem.find({});
  console.log(count);
  console.log(count2);
};
// Connect to the database
try {
  await db.connect({
    version: 1,
    onUpgrade: (db) => {
      console.log("Upgrading the database");
    },
  });
  console.log("Connected to the database");
  const users = await User.find({});
  if (users.length !== 0) {
    div1.style.display = "none";
    div3.style.display = "block";
    const problemsArray = await Problem.find({});
    problemsArray.forEach((problem) => {
      const checkbox = document.querySelector(
        `[data-problem-id="${problem.problemId}"]`
      );
      if (!checkbox) return;
      // make whole task div green
      const taskDiv = checkbox.parentElement.parentElement;
      const anchorElement =
        checkbox.parentElement.parentElement.querySelector("a");
      if (problem.isImportant) {
        taskDiv.style.backgroundColor = "lightyellow";
        anchorElement.style.fontWeight = "bold";
      } else {
        taskDiv.style.backgroundColor = "white";
      }
      // make checkbox checked
      if (checkbox && problem.user === users[0]._id && problem.isImportant) {
        checkbox.checked = problem.isImportant;
        // make anchor tag Red and bold
        if (anchorElement) {
          anchorElement.style.color = "red";
          anchorElement.style.fontWeight = "bold";
        }
      }
    });
    const navSlidebar = document.querySelector(".nav.sidebar");
    if (navSlidebar) {
      // creating a comment div at the top to add to the sidebar
      const commentDiv = document.createElement("div");
      commentDiv.className = "comment";
      commentDiv.innerHTML = `<textarea id="cses-marker-comment-input" type="text" placeholder="Add comment" style="height: 300px; display: block; width : 100%"/></textarea><button id="cses-marker-comment-button">Add</button>`;
      navSlidebar.insertBefore(commentDiv, navSlidebar.firstChild);
      // showing comments as a list
      //print url of the problem
      const url = window.location.href;
      const urlArray = url.split("/");
      const problemId =
        "/" +
        urlArray[urlArray.length - 3] +
        "/" +
        urlArray[urlArray.length - 2] +
        "/" +
        urlArray[urlArray.length - 1];
      const commentsList = document.createElement("div");
      commentsList.className = "comment";
      const comments = await Problem.find({
        problemId: problemId,
      });
      comments.forEach((comment) => {
        const commentElement = document.createElement("div");
        commentElement.innerHTML = `${comment.username} : ${comment.message}`;
        commentsList.appendChild(commentElement);
      });
      navSlidebar.insertBefore(commentsList, navSlidebar.firstChild);

      // adding event listener to comment button
      document
        .querySelector("#cses-marker-comment-button")
        .addEventListener("click", async () => {
          const users = await User.find({});
          if (users.length === 0) return;
          const user = users[0];
          const comment = document.querySelector(
            "#cses-marker-comment-input"
          ).value;
          // clear the input
          document.querySelector("#cses-marker-comment-input").value = "";
          if (comment === "") return;
          const url = window.location.href;
          const urlArray = url.split("/");
          const problemId =
            "/" +
            urlArray[urlArray.length - 3] +
            "/" +
            urlArray[urlArray.length - 2] +
            "/" +
            urlArray[urlArray.length - 1];
          const problems = await Problem.find({
            problemId: problemId,
            user: user._id,
          });
          const problemName = document
            .querySelector(".title-block")
            .getElementsByTagName("h1")[0].innerText;
          console.log(problemName);
          if (problems.length === 0) {
            const problem = {
              problemId: problemId,
              problemName: problemName,
              isImportant: false,
              message: comment,
              user: user._id,
              username: user.username,
            };
            if (user.groupJoined !== undefined && user.groupJoined !== "") {
              problem.group = user.groupJoined;
            }
            const newProblem = await Problem.create(problem);
            const commentElement = document.createElement("div");
            commentElement.innerHTML = `${problem.username} : ${problem.message}`;
            commentsList.insertBefore(commentElement, commentsList.firstChild);
            // adding problem to user
            user.questions = [...user.questions, problem];
            await user.save();
            return;
          }
          const problem = problems[0];
          problem.message = comment;
          await problem.save();
          const commentElement = document.createElement("div");
          commentElement.innerHTML = `${problem.problemName} : ${problem.message}`;
          commentsList.insertBefore(commentElement, commentsList.firstChild);
          // adding problem to user
          const questions = [];
          for (let i = 0; i < user.questions.length; i++) {
            if (user.questions[i].problemId === problemId) {
              user.questions[i].message = comment;
            }
            questions.push(user.questions[i]);
          }
          user.questions = questions;
          await user.save();
          // reload the page
          window.location.reload();
        });
    }
  }
} catch (error) {
  console.log("Error connecting to the INDEX DB database. Please try again.");
  await User.deleteAll();
  await Problem.deleteAll();
  call2();
  console.log(error);
}

//            EVENT LISTENERS

//      OPEN DILOGUE BOX TO LOGIN
document
  .querySelector("#cses-marker-click-to-login-button")
  .addEventListener("click", () => {
    div1.style.display = "none";
    div2.style.display = "block";
  });

//      MAKE LOGIN REQUEST AND SYNC BUTTON IS LOADED
document
  .querySelector("#cses-marker-login-button")
  .addEventListener("click", () => {
    const username = document.querySelector("#username").value;
    const password = document.querySelector("#password").value;
    if (username === "" || password === "") return;
    fetch(fetchUrl + "/userLogin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Include any other headers if needed
      },
      body: JSON.stringify({
        username: username,
        password: password,
        // Include other parameters in the request body as needed
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        if (data.success === true) {
          div2.style.display = "none";
          div3.style.display = "block";
          data.problems.forEach((problem) => {
            Problem.create(problem);
          });
          User.create(data.user);
          // reload the page
          window.location.reload();
        }
      })
      .catch((error) => {
        // Handle errors
        console.error("Fetch error:", error);
      });
  });

//      SYNC BUTTON
document
  .querySelector("#cses-marker-sync-button")
  .addEventListener("click", () => {
    sync();
  });

const sync = async () => {
  const users = await User.find({});
  if (users.length === 0) return;
  const user = users[0]._object;
  fetch(fetchUrl + "/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Include any other headers if needed
    },
    body: JSON.stringify({
      user: user,
      // Include other parameters in the request body as needed
    }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(async (data) => {
      await User.deleteAll();
      await Problem.deleteAll();
      // Handle the response data
      data.problems.forEach((problem) => {
        Problem.create(problem);
      });
      User.create(data.user);
      // reload the page
      window.location.reload();
    })
    .catch((error) => {
      // Handle errors
      console.error("Fetch error:", error);
    });
};

document
  .querySelector("#cses-marker-logout-button")
  .addEventListener("click", async () => {
    await User.deleteAll();
    await Problem.deleteAll();
    window.location.reload();
  });

//    ADDING EVENT LISTENER TO CHECKBOXES
const checkboxes = document.querySelectorAll(".cses-marker-checkbox");
checkboxes.forEach((checkbox) => {
  checkbox.addEventListener("change", async (event) => {
    const users = await User.find({});
    if (users.length === 0) return;
    const user = users[0];
    let flag = false;
    const checked = event.target.checked;
    const questions = [];
    for (let i = 0; i < user.questions.length; i++) {
      if (user.questions[i].problemId === event.target.dataset.problemId) {
        flag = true;
        user.questions[i].isImportant = checked;
        const ProblemInProblem = await Problem.findOne({
          problemId: event.target.dataset.problemId,
          user: user._id,
        });
        ProblemInProblem.isImportant = checked;
        await ProblemInProblem.save();
      }
      questions.push(user.questions[i]);
    }
    user.questions = questions;
    if (!flag) {
      const problem = {
        problemId: event.target.dataset.problemId,
        problemName: event.target.dataset.problemName,
        isImportant: checked,
        message: "",
        user: user._id,
        username: user.username,
      };
      if (user.groupJoined !== "") {
        problem.group = user.groupJoined;
      }
      const newProblem = await Problem.create(problem);
      user.questions = [...user.questions, problem];
    }
    await user.save();
  });
});
