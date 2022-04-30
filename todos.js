const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const TodoList = require("./lib/todolist");

const app = express();
const host = "localhost";
const port = 3000;

let todoLists = require("./lib/seed-data");
const { urlencoded } = require("express");

app.set("views", "./views");
app.set("view engine", "pug");
console.log("hello woooorld");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    name: "launch-school-todos-session-id",
    resave: false,
    saveUninitialized: true,
    secret: "this is not secure",
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

const compareByTitle = (itemA, itemB) => {
  const titleA = itemA.title.toLowerCase();
  const titleB = itemB.title.toLowerCase();
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

const sortTodos = (list) => {
  const done = list.todos.filter((todo) => todo.isDone());
  const undone = list.todos.filter((todo) => !todo.isDone());
  return undone.sort(compareByTitle).concat(done.sort(compareByTitle));
};

const loadTodoList = (id) =>
  todoLists.find((todoList) => String(todoList.id) === id);

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists", (req, res) => {
  res.render("lists", { todoLists: sortTodoLists(todoLists) });
});

app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

app.get("/lists/:todoListId", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const todoList = loadTodoList(todoListId);
  if (todoList === undefined) {
    next(new Error("Not found"));
  } else {
    res.render("list", {
      todoList,
      todos: sortTodos(todoList),
    });
  }
});

app.post(
  "/lists",
  [
    body("todoListTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The list title is required.")
      .isLength({ max: 100 })
      .withMessage("List title must be between 1 and 100 characters.")
      .custom((title) => todoLists.every((list) => list.title !== title))
      .withMessage("List title must be unique"),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((message) => req.flash("error", message.msg));
      res.render("new-list", {
        flash: req.flash(),
        todoListTitle: req.body.todoListTitle,
      });
    } else {
      req.flash("success", "New todo list created successfully");
      todoLists.push(new TodoList(req.body.todoListTitle));
      res.redirect("/lists");
    }
  }
);

app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).send(err.msg);
});

app.listen(port, host, () => console.log(`Listening on ${port} of ${host}`));
