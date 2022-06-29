const express = require("express");
const morgan = require("morgan");
const flash = require("express-flash");
const session = require("express-session");
const { body, validationResult } = require("express-validator");
const { sortTodos } = require("./lib/sort");
const store = require("connect-loki");
const PgPersistence = require("./lib/pg-persistence");
const catchError = require("./lib/catch-errors");

const app = express();
const host = "localhost";
const port = 3000;
const LokiStore = store(session);

const { urlencoded } = require("express");

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

// New datastore
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

const validateTodoListTitle = [
  body("todoListTitle")
    .trim()
    .isLength({ min: 1 })
    .withMessage("The list title is required.")
    .isLength({ max: 100 })
    .withMessage("List title must be between 1 and 100 characters.")
    // .custom((title, { req }) =>
      // req.session.todoLists.every((list) => list.title !== title)
    // )
    // .withMessage("List title must be unique"),
];

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists", catchError(async (req, res, next) => {
  const store = res.locals.store;

  const todoLists = await store.sortedTodoLists();
  const todosInfo = todoLists.map((todoList) => ({
    countAllTodos: todoList.todos.length,
    countDoneTodos: todoList.todos.filter((todo) => todo.done).length,
    isDone: store.isDoneTodoList(todoList),
  }));

  res.render("lists", {
    todoLists,
    todosInfo,
  });
}));



app.get("/lists/new", (req, res) => {
  res.render("new-list");
});

// View a Single Todo List
app.get("/lists/:todoListId", catchError(async (req, res, next) => {
  const store = res.locals.store;
  const todoListId = req.params.todoListId;

  const todoList = await store.loadTodoList(+todoListId);

  if (todoList === undefined) throw new Error("Not found");

  res.render("list", {
    todoList,
    todos: await store.sortedTodos(todoList),
  });
}));

// Edit a todo list
app.get("/lists/:todoListId/edit", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const selectedList = res.locals.store.loadTodoList(+todoListId);

  if (!selectedList) {
    next(new Error("Not found"));
  }

  res.render("edit-list", { todoList: selectedList });
});

// Add new todo list
app.post("/lists", validateTodoListTitle, (req, res) => {
  const errors = validationResult(req);

  const rerender = () => {
    res.render("new-list", {
      flash: req.flash(),
      todoListTitle: req.body.todoListTitle,
    });
  }

  if (!errors.isEmpty()) {
    errors.array().forEach((message) => req.flash("error", message.msg));
    rerender()
  } 

  if (res.locals.store.existsTodoListTitle(req.body.todoListTitle)) {
    flash("error", "Todo list with title already exists");
  }

  const created = res.locals.store.createTodoList(req.body.todoListTitle);
  if (!created) {
    next(new Error("Failed to create list"));
  }

  req.flash("success", "New todo list created successfully");
  res.redirect("/lists");
});

// Toggle a todo item in a specific list
app.post("/lists/:todoListId/todos/:todoId/toggle", catchError(async (req, res) => {
  const { todoListId, todoId } = { ...req.params };
  const toggledTodo = await res.locals.store.toggleTodoCompletion(+todoListId, +todoId);

  if (!toggledTodo) {
    throw new Error("Not found");
  } 

  const todo = await res.locals.store.loadTodo(+todoListId, +todoId);
  req.flash("success", `Todo marked ${todo.done ? "Done" : "Undone"}`);
  res.redirect(`/lists/${todoListId}`);
}));

// Delete a todo
app.post("/lists/:todoListId/todos/:todoId/destroy", catchError(async (req, res) => {
  const { todoListId, todoId } = { ...req.params };
  const deleted = await res.locals.store.deleteTodo(+todoListId, +todoId);

  if (!deleted) {
    throw new Error("Not found");
  }

  req.flash("success", `Todo deleted`);
  res.redirect(`/lists/${todoListId}`);
}));

// Mark all todos in a list as done
app.post("/lists/:todoListId/complete_all", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const compledtedList = res.locals.store.markAllDone(+todoListId);

  if (compledtedList === undefined) {
    next(new Error("Not found"));
  }

  req.flash("success", "All todos marked as complete");
  res.redirect(`/lists/${todoListId}`);
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
    const selectedList = res.locals.store.loadTodoList(+todoListId);

    if (selectedList === undefined) {
      next(new Error("Not found"));
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => req.flash("error", error.msg));

      res.render("list", {
        flash: req.flash(),
        todoListTitle: selectedList.title,
        todos: res.locals.store.sortedTodos(selectedList),
        todoTitle: req.body.todoTitle,
        todoList: selectedList,
      });
    }

    flash("success", "Todo added to the list");
    res.locals.store.addTodo(+todoListId, req.body.todoTitle);
    res.redirect(`/lists/${todoListId}`);
  }
);

// Delete a todo list
app.post("/lists/:todoListId/destroy", (req, res, next) => {
  const todoListId = req.params.todoListId;
  const deletedList = res.locals.store.deleteList(+todoListId);

  if (deletedList === undefined) {
    next(new Error("Not found"));
  }

  req.flash("success", "Todo List deleted");
  res.redirect("/lists");
});

// Edit title of todo list
app.post("/lists/:todoListId/edit", validateTodoListTitle, (req, res, next) => {
  const todoListId = +req.params.todoListId;

  const rerenderList = () => {
    const selectedList = res.locals.store.loadTodoList(todoListId);

    if (selectedList === undefined) {
      next(new Error("Not found"));
    }

    res.render("edit-list", {
      flash: req.flash(),
      todoList: selectedList,
      todoListTitle: req.body.todoListTitle,
    });
  }


  errors = validationResult(req);
  if (!errors.isEmpty()) {
    errors.array().forEach((error) => req.flash("error", error.msg));
    rerenderList();
  }

  if (res.locals.store.existsTodoListTitle(req.body.todoListTitle)) {
    req.flash("error", "The titel must be unique");
    rerenderList();
  }

  const renamedList = res.locals.store.renameList(todoListId, req.body.todoListTitle);
  if (renamedList === undefined) {
    next(new Error("Not found"));
  }

  req.flash("success", "Todo list has been renamed");
  res.redirect(`/lists/${todoListId}`);
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).send(err.msg);
});

app.listen(port, host, () => console.log(`Listening on ${port} of ${host}`));
