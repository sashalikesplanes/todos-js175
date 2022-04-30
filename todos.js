const express = require("express");
const morgan = require("morgan");
const TodoList = require("./lib/todolist");

const app = express();
const host = "localhost";
const port = 3000;

let todoLists = require("./lib/seed-data");
const { urlencoded } = require("express");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

const compareByTitle = (listA, listB) => {
  const titleA = listA.title.toLowerCase();
  const titleB = listB.title.toLowerCase();
  if (titleA < titleB) return -1;
  else if (titleA > titleB) return 1;
  else return 0;
};

const sortTodoLists = (lists) => {
  const sortedNotDoneLists = lists
    .filter((list) => !list.isDone())
    .sort(compareByTitle);
  const sortedDoneLists = lists
    .filter((list) => list.isDone())
    .sort(compareByTitle);
  return sortedNotDoneLists.concat(sortedDoneLists);
};

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists", (req, res) => {
  res.render("lists", { todoLists: sortTodoLists(todoLists) });
});

app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

app.post("/lists", (req, res) => {
  const title = req.body.todoListTitle.trim();
  todoLists.push(new TodoList(title));
  res.redirect("/lists");
});

app.listen(port, host, () => console.log(`Listening on ${port} of ${host}`));
