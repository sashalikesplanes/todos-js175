const config = require("./lib/config");
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
const host = config.HOST;
const port = config.PORT;
const LokiStore = store(session);

const { urlencoded } = require("express");

const validateTodoListTitle = [
  body("todoListTitle")
    .trim()
    .isLength({ min: 1 })
    .withMessage("The list title is required.")
    .isLength({ max: 100 })
    .withMessage("List title must be between 1 and 100 characters.")
];

const requiresAuth = (req, res, next) => {
  if (!res.locals.signedIn) {
    console.log("Unauthorized");
    res.status(302).redirect("/users/signin");
  } else next();
};

app.set("views", "./views");
app.set("view engine", "pug");

app.use(morgan("common"));

app.use(express.static("public"));

app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    cookie: { httpOnly: true,
      maxAge: 31 * 24 * 60 * 60 * 1000,
      path: "/",
      secure: false,
    },
    name: "launch-school-todos-session-id",
    resave: false,
    saveUninitialized: true,
    secret: config.SECRET,
    store: new LokiStore({}),
  })
);

app.use(flash());

app.use((req, res, next) => {
  res.locals.flash = req.session.flash;
  res.locals.username = req.session.username;
  res.locals.signedIn = req.session.signedIn;
  delete req.session.flash;
  next();
});

// New datastore
app.use((req, res, next) => {
  res.locals.store = new PgPersistence(req.session);
  next();
});

app.get("/", (req, res) => {
  res.redirect("/lists");
});

app.get("/lists", requiresAuth, catchError(async (req, res, next) => {
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



app.get("/lists/new", requiresAuth, (req, res) => {
  res.render("new-list");
});

// View a Single Todo List
app.get("/lists/:todoListId", requiresAuth, catchError(async (req, res, next) => {
  const store = res.locals.store;
  const todoListId = req.params.todoListId;

  const todoList = await store.loadTodoList(+todoListId);

  if (todoList === undefined) throw new Error("Not found");

  res.render("list", {
    todoList,
    todos: await store.sortedTodos(todoList),
    listIsDone: todoList.todos.every(todo => todo.done),
  });
}));

// Edit a todo list
app.get("/lists/:todoListId/edit", requiresAuth, catchError(async (req, res) => {
  const todoListId = req.params.todoListId;
  const selectedList = await res.locals.store.loadTodoList(+todoListId);

  if (!selectedList) {
    throw new Error("Not found");
  }

  res.render("edit-list", { todoList: selectedList });
}));

app.get("/users/signin", (req, res) => {
  req.flash("info", "Please sign in.");
  res.render("signin", { flash: req.flash() });
});

// Process user sign in
app.post("/users/signin", catchError(async (req, res) => {
  const username = req.body.username.trim();
  const password = req.body.password;

  if (await res.locals.store.isValidUser(username, password)) {
    req.session.username = username;
    req.session.signedIn = true;

    req.flash("success", "Welcome!");
    res.redirect("/lists");
  } else {
    req.flash("error", "Invalid Credentials");
    res.render("signin", { flash: req.flash(), username });
  }
}));

app.post("/users/signout", (req, res) => {
  delete req.session.username;
  delete req.session.signedIn;

  res.redirect("/users/signin");
});

// Add new todo list
app.post("/lists", validateTodoListTitle, requiresAuth, catchError(async (req, res) => {
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
  } else if (await res.locals.store.existsTodoListTitle(req.body.todoListTitle)) {
    req.flash("error", "Todo list with title already exists");
  } else {
    const created = await res.locals.store.createTodoList(req.body.todoListTitle);
    if (!created) {
      throw new Error("Failed to create list");
    }

    req.flash("success", "New todo list created successfully");
    res.redirect("/lists");
  }
}));

// Toggle a todo item in a specific list
app.post("/lists/:todoListId/todos/:todoId/toggle", requiresAuth, catchError(async (req, res) => {
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
app.post("/lists/:todoListId/todos/:todoId/destroy", requiresAuth, catchError(async (req, res) => {
  const { todoListId, todoId } = { ...req.params };
  const deleted = await res.locals.store.deleteTodo(+todoListId, +todoId);

  if (!deleted) {
    throw new Error("Not found");
  }

  req.flash("success", `Todo deleted`);
  res.redirect(`/lists/${todoListId}`);
}));

// Mark all todos in a list as done
app.post("/lists/:todoListId/complete_all", requiresAuth, catchError(async (req, res) => {
  const todoListId = req.params.todoListId;
  const completed = await res.locals.store.markAllDone(+todoListId);

  if (!completed) {
    throw new Error("Not found");
  }

  req.flash("success", "All todos marked as complete");
  res.redirect(`/lists/${todoListId}`);
}));

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
  requiresAuth, catchError(async (req, res) => {
    const todoListId = req.params.todoListId;
    const selectedList = await res.locals.store.loadTodoList(+todoListId);

    if (selectedList === undefined) {
      throw new Error("Not found");
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => req.flash("error", error.msg));

      res.render("list", {
        flash: req.flash(),
        todoListTitle: selectedList.title,
        todos: await res.locals.store.sortedTodos(selectedList),
        todoTitle: req.body.todoTitle,
        todoList: selectedList,
      });
    }

    flash("success", "Todo added to the list");
    await res.locals.store.addTodo(+todoListId, req.body.todoTitle);
    res.redirect(`/lists/${todoListId}`);
  }));

// Delete a todo list
app.post("/lists/:todoListId/destroy", requiresAuth, catchError(async (req, res) => {
  const todoListId = req.params.todoListId;
  const deleted = await res.locals.store.deleteList(+todoListId);

  if (!deleted) {
    throw new Error("Not found");
  }

  req.flash("success", "Todo List deleted");
  res.redirect("/lists");
}));

// Edit title of todo list
app.post("/lists/:todoListId/edit", validateTodoListTitle, requiresAuth, catchError(async (req, res) => {
  const todoListId = +req.params.todoListId;

  const rerenderList = async () => {
    const selectedList = await res.locals.store.loadTodoList(todoListId);

    if (selectedList === undefined) {
      throw new Error("Not found");
    }

    res.render("edit-list", {
      flash: req.flash(),
      todoList: selectedList,
      todoListTitle: req.body.todoListTitle,
    });
  }

  try {
    errors = validationResult(req);
    if (!errors.isEmpty()) {
      errors.array().forEach((error) => req.flash("error", error.msg));
      await rerenderList();
    } else if (res.locals.store.existsTodoListTitle(req.body.todoListTitle)) {
      req.flash("error", "The list title must be unique");
      await rerenderList();
    } else {
      const renamed = await res.locals.store.renameList(todoListId, req.body.todoListTitle);
      if (!renamed) throw new Error("Not found");

      req.flash("success", "Todo list has been renamed");
      res.redirect(`/lists/${todoListId}`);
    }
  } catch (e) {
    if (res.locals.store.isUniqueConstraintViolation(e)) {
      req.flash("error", "The list title must be unique");
      await rerenderList();
    } else throw e;
  }
}));

app.use((err, req, res, next) => {
  console.log(err);
  res.status(404).send(err.msg);
});

app.listen(port, host, () => console.log(`Listening on ${port} of ${host}`));
