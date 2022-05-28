const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const TodoList = require("./lib/todolist");
const { sortTodos, sortTodoLists } = require("./lib/sort");
const store = require("connect-loki");
const SessionPersistence = require("./lib/session-persistence");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

const { urlencoded } = require("express");
const Todo = require("./lib/todo");

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(
  session({
    cookie: {
      httpOnly: true,
      maxAge: 31 * 24 * 60 * 60 * 1000,
      path: "/",
      secure: false,
    },
    name: "launch-school-todos-session-id",
    resave: false,
    saveUninitialized: true,
    secret: "this is not secure",
    store: new LokiStore({}),
  })
);
app.use(flash());
app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});
app.use((req, res, next) => {
  res.locals.store = new SessionPersistence(req.session);
  next();
});

const loadTodoList = (id, todoLists) =>
  todoLists.find((todoList) => todoList.id === id);

const loadTodo = (todoListId, todoId, todoLists) => {
  const selectedTodoList = todoLists.find((list) => list.id === todoListId);
  if (selectedTodoList) {
    return selectedTodoList.findById(todoId);
  } else return undefined;
};

const validateTodoListTitle = [
  body("todoListTitle")
    .trim()
    .isLength({ min: 1 })
    .withMessage("The list title is required.")
    .isLength({ max: 100 })
    .withMessage("List title must be between 1 and 100 characters.")
    .custom((title, { req }) =>
      req.session.todoLists.every((list) => list.title !== title)
    )
    .withMessage("List title must be unique"),
];

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists", (req, res) => {
  res.render("lists", { todoLists: sortTodoLists(req.session.todoLists) });
});

app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

// View a Single Todo List
app.get("/lists/:todoListId", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const todoList = loadTodoList(+todoListId, req.session.todoLists);
  if (todoList === undefined) {
    next(new Error("Not found"));
  } else {
    res.render("list", {
      todoList,
      todos: sortTodos(todoList),
    });
  }
});

// Edit a todo list
app.get("/lists/:todoListId/edit", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const selectedList = loadTodoList(+todoListId, req.session.todoLists);
  if (!selectedList) {
    next(new Error("Not found"));
  } else {
    res.render("edit-list", { todoList: selectedList });
  }
});

// Add new todo list
app.post("/lists", validateTodoListTitle, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((message) => req.flash("error", message.msg));
    res.render("new-list", {
      flash: req.flash(),
      todoListTitle: req.body.todoListTitle,
    });
  } else {
    req.flash("success", "New todo list created successfully");
    req.session.todoLists.push(new TodoList(req.body.todoListTitle));
    res.redirect("/lists");
  }
});

// Toggle a todo item in a specific list
app.post("/lists/:todoListId/todos/:todoId/toggle", (req, res, next) => {
  const { todoListId, todoId } = { ...req.params };
  const selectedTodo = loadTodo(+todoListId, +todoId, req.session.todoLists);
  if (!selectedTodo) {
    next(new Error("Not found"));
  } else {
    if (selectedTodo.isDone()) {
      selectedTodo.markUndone();
      req.flash("success", "Todo marked Undone");
    } else {
      selectedTodo.markDone();
      req.flash("success", "Todo marked Done");
    }
    res.redirect(`/lists/${todoListId}`);
  }
});

// Delete a todo
app.post("/lists/:todoListId/todos/:todoId/destroy", (req, res, next) => {
  const { todoListId, todoId } = { ...req.params };
  const selectedList = loadTodoList(+todoListId, req.session.todoLists);
  const selectedTodo = loadTodo(+todoListId, +todoId, req.session.todoLists);

  if (!selectedTodo || !selectedList) {
    next(new Error("Not found"));
  } else {
    const todoIndex = selectedList.findIndexOf(selectedTodo);
    selectedList.removeAt(todoIndex);
    req.flash("success", "Todo Deleted");
    res.redirect(`/lists/${todoListId}`);
  }
});

// Mark all todos in a list as done
app.post("/lists/:todoListId/complete_all", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const selectedList = loadTodoList(+todoListId, req.session.todoLists);

  if (!selectedList) {
    next(new Error("Not found"));
  } else {
    selectedList.markAllDone();
    req.flash("success", "All todos marked as complete");
    res.redirect(`/lists/${todoListId}`);
  }
});

// Add a todo
app.post(
  "/lists/:todoListId/todos",
  [
    body("todoTitle")
      .trim()
      .isLength({ min: 1 })
      .withMessage("The todo title is required.")
      .isLength({ max: 100 })
      .withMessage("Todo title must be between 1 and 100 characters."),
  ],
  (req, res, next) => {
    const todoListId = req.params.todoListId;
    const selectedList = loadTodoList(+todoListId, req.session.todoLists);
    if (!selectedList) next(new Error("Not found"));
    else {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        errors.array().forEach((error) => req.flash("error", error.msg));
        res.render("list", {
          flash: req.flash(),
          todoListTitle: selectedList.title,
          todos: sortTodos(selectedList),
          todoTitle: req.body.todoTitle,
          todoList: selectedList,
        });
      } else {
        flash("success", "Todo added to the list");
        selectedList.add(new Todo(req.body.todoTitle));
        res.redirect(`/lists/${todoListId}`);
      }
    }
  }
);

// Delete a todo list
app.post("/lists/:todoListId/destroy", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const selectedList = loadTodoList(+todoListId, req.session.todoLists);
  if (!selectedList) {
    next(new Error("Not found"));
  } else {
    req.session.todoLists = req.session.todoLists.filter(
      (list) => list.id !== Number(todoListId)
    );
    req.flash("success", "Todo list deleted");
    res.redirect("/lists");
  }
});

// Edit title of todo list
app.post("/lists/:todoListId/edit", validateTodoListTitle, (req, res, next) => {
  const todoListId = +req.params.todoListId;
  const selectedList = loadTodoList(todoListId, req.session.todoLists);
  if (!selectedList) next(new Error("Not found"));
  else {
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => req.flash("error", error.msg));
      res.render("edit-list", {
        flash: req.flash(),
        todoList: selectedList,
        todoListTitle: req.body.todoListTitle,
      });
    } else {
      selectedList.title = req.body.todoListTitle;
      req.flash("success", "Todo list has been renamed");
      res.redirect(`/lists/${todoListId}`);
    }
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).send(err.msg);
});

app.listen(port, host, () => console.log(`Listening on ${port} of ${host}`));
