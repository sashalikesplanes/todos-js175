const { dbQuery } = require("./db-query");
const bcrypt = require("bcrypt");

module.exports = class PgPersistence {
  constructor(session) {
    this.username = session.username;
  }

  async isValidUser(username, password) {
    const FIND_HASHED_PASS = "SELECT password FROM users WHERE username = $1;";

    const result = await dbQuery(FIND_HASHED_PASS, username);
    if (result.rowCount === 0) return false;

    return bcrypt.compare(password, result.rows[0].password);
  }

  async createTodoList(title) {
    const CREATE_LIST = "INSERT INTO todolists (title, username) VALUES ($1, $2);";

    try {
      const result = await dbQuery(CREATE_LIST, title, this.username);
      return result.rowCount > 0;
    } catch (e) {
      if (this.isUniqueConstraintViolation(e)) return false;
      throw e;
    }
  }

  isUniqueConstraintViolation(error) {
    return /duplicate key value violates unique constraint/.test(String(error));
  }

  async existsTodoListTitle(title) {
    const FIND_LIST = "SELECT * FROM todolists WHERE title = $1 AND username = $2;";

    const result = await dbQuery(FIND_LIST, title, this.username);

    return result.rowCount > 0;
  }

  async renameList(id, name) {
    const RENAME_LIST = "UPDATE todolists SET title = $1" + 
                        "  WHERE id = $2 AND username = $2;";

    const result = await dbQuery(RENAME_LIST, name, id, this.username);

    return result.rowCount > 0;
  }

  async deleteList(id) {
    const DELETE_TODOS = "DELETE FROM todos WHERE todolist_id = $1 AND username = $2;";
    const DELETE_LIST = "DELETE FROM todolists WHERE id = $1 AND username = $2;";

    const results = await Promise.all([dbQuery(DELETE_TODOS, id, this.username),
                                       dbQuery(DELETE_LIST, id, this.username)]);

    return results[1].rowCount > 0;
  }

  async addTodo(listId, todoTitle) {
    const INSERT_TODO = "INSERT INTO todos (title, done, todolist_id, username)" + 
                        "  VALUES ($1, false, $2, $3);";

    const result = await dbQuery(INSERT_TODO, todoTitle, listId, this.username);
  }

  async markAllDone(listId) {
    const MARK_ALL_DONE = "UPDATE todos SET done = true" +
                          "  WHERE todolist_id = $1 AND username = $2;";

    const result = await dbQuery(MARK_ALL_DONE, listId, this.username);

    return result.rowCount > 0;
  }

  async deleteTodo(listId, todoId) {
    const DELETE_TODO = "DELETE FROM todos" +
                        "  WHERE todolist_id = $1 AND id = $2 AND username = $3;";

    const result = await dbQuery(DELETE_TODO, listId, todoId, this.username);

    return result.rowCount > 0;
  }

  async loadTodo(listId, todoId) {
    const LOAD_TODO = "SELECT * FROM todos" +
                      "  WHERE todolist_id = $1 AND id = $2 AND username = $3;";

    const result = await dbQuery(LOAD_TODO, listId, todoId, this.username);
    return result.rows[0];
  }

  async toggleTodoCompletion(listId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done" +
                        "  WHERE todolist_id = $1 AND id = $2 AND username = $3;";

    const result = await dbQuery(TOGGLE_DONE, listId, todoId, this.username);

    return result.rowCount > 0;
  }


  async loadTodoList(id) {
    const TODOLIST = "SELECT * FROM todolists WHERE id = $1 AND username = $2;";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2;";

    const resultBoth = await Promise.all([dbQuery(TODOLIST, id, this.username),
                                          dbQuery(FIND_TODOS, id, this.username)]);

    const todolist = resultBoth[0].rows[0];
    if (!todolist) return undefined;

    todolist.todos = resultBoth[1].rows;

    return todolist;
  }

  async sortedTodos(todoList) {
    const FIND_TODOS = "SELECT * FROM todos" +
                       "  WHERE todolist_id = $1 AND username = $2" +
                       "ORDER BY done ASC, title ASC;";

    const id = todoList.id;
    const result = await dbQuery(FIND_TODOS, id, this.username);

    return result.rows;
  }

  async sortedTodoLists() {
    // Returns a promise that resolves to a sorted list of all todo lists 
    // with their assosiated todos. Sorted by completion status and title
    // title - case insensitive, the todos per list are unsorted
    const ALL_TODOLISTS = "SELECT * FROM todolists WHERE username = $1" +
                          "  ORDER BY lower(title) ASC;";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 AND username = $2;";

    const result = await dbQuery(ALL_TODOLISTS, this.username);
    const todoLists = result.rows;

    // Doesnt work cuz something is up with async functions and array iteration methods
    // todoLists.map(async (list, i) => {
      // const todos = await dbQuery(FIND_TODOS, todoList.id);
      // list.todos = todos;
    // });

    for (let i = 0; i < todoLists.length; i++) {
      const todoList = todoLists[i];
      const todos = await dbQuery(FIND_TODOS, todoList.id, this.username);
      todoList.todos = todos.rows;
    }

    // Avoid the complexity of sorting by completion with SQL
    return this._paritionTodoLists(todoLists);
  }

  _paritionTodoLists(lists) {
    const undone = [];
    const done = [];

    lists.forEach(list => {
      if (this.isDoneTodoList(list)) {
        done.push(list);
      } else {
        undone.push(list);
      }
    });

    return undone.concat(done);
  }

  isDoneTodoList(list) {
    return list.todos.length > 0 && list.todos.every((todo) => todo.done);
  }
};
