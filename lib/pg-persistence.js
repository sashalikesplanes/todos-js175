const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  async createTodoList(title) {
    const CREATE_LIST = "INSERT INTO todolists (title) VALUES ($1);";

    try {
      const result = await dbQuery(CREATE_LIST, title);
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
    const FIND_LIST = "SELECT * FROM todolists WHERE title = $1;";

    const result = await dbQuery(FIND_LIST, title);

    return result.rowCount > 0;
  }

  async renameList(id, name) {
    const RENAME_LIST = "UPDATE todolists SET title = $1 WHERE id = $2;";

    const result = await dbQuery(RENAME_LIST, name, id);

    return result.rowCount > 0;
  }

  async deleteList(id) {
    const DELETE_TODOS = "DELETE FROM todos WHERE todolist_id = $1;";
    const DELETE_LIST = "DELETE FROM todolists WHERE id = $1;";

    const results = await Promise.all([dbQuery(DELETE_TODOS, id), dbQuery(DELETE_LIST, id)]);

    return results[1].rowCount > 0;
  }

  async addTodo(listId, todoTitle) {
    const INSERT_TODO = "INSERT INTO todos (title, done, todolist_id) VALUES ($1, false, $2);";

    const result = await dbQuery(INSERT_TODO, todoTitle, listId);
  }

  async markAllDone(listId) {
    const MARK_ALL_DONE = "UPDATE todos SET done = true WHERE todolist_id = $1;";

    const result = await dbQuery(MARK_ALL_DONE, listId);

    return result.rowCount > 0;
  }

  async deleteTodo(listId, todoId) {
    const DELETE_TODO = "DELETE FROM todos WHERE todolist_id = $1 AND id = $2;";

    const result = await dbQuery(DELETE_TODO, listId, todoId);

    return result.rowCount > 0;
  }

  async loadTodo(listId, todoId) {
    const LOAD_TODO = "SELECT * FROM todos WHERE todolist_id = $1 AND id = $2;";

    const result = await dbQuery(LOAD_TODO, listId, todoId);
    return result.rows[0];
  }

  async toggleTodoCompletion(listId, todoId) {
    const TOGGLE_DONE = "UPDATE todos SET done = NOT done WHERE todolist_id = $1 AND id = $2;";

    const result = await dbQuery(TOGGLE_DONE, listId, todoId);

    return result.rowCount > 0;
  }


  async loadTodoList(id) {
    const TODOLIST = "SELECT * FROM todolists WHERE id = $1;";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1;";

    const resultBoth = await Promise.all([dbQuery(TODOLIST, id), dbQuery(FIND_TODOS, id)]);

    const todolist = resultBoth[0].rows[0];
    if (!todolist) return undefined;

    todolist.todos = resultBoth[1].rows;

    return todolist;
  }

  async sortedTodos(todoList) {
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1 ORDER BY done ASC, title ASC;";

    const id = todoList.id;
    const result = await dbQuery(FIND_TODOS, id);

    return result.rows;
  }

  async sortedTodoLists() {
    // Returns a promise that resolves to a sorted list of all todo lists 
    // with their assosiated todos. Sorted by completion status and title
    // title - case insensitive, the todos per list are unsorted
    const ALL_TODOLISTS = "SELECT * FROM todolists ORDER BY lower(title) ASC;";
    const FIND_TODOS = "SELECT * FROM todos WHERE todolist_id = $1";

    const result = await dbQuery(ALL_TODOLISTS);
    const todoLists = result.rows;

    // Doesnt work cuz something is up with async functions and array iteration methods
    // todoLists.map(async (list, i) => {
      // const todos = await dbQuery(FIND_TODOS, todoList.id);
      // list.todos = todos;
    // });

    for (let i = 0; i < todoLists.length; i++) {
      const todoList = todoLists[i];
      const todos = await dbQuery(FIND_TODOS, todoList.id);
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
