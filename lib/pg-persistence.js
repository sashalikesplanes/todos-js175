const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  constructor(session) {
    // this._todoLists = session.todoLists || deepCopy(SeedData);
    // // Debug line to reset the store
    // // this._todoLists = deepCopy(SeedData);
    // session.todoLists = this._todoLists;
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

  _findTodoList(id) {
    // return this._todoLists.find(list => list.id === id);
  }

  _findTodo(todoListId, todoId) {
    // const list = this._findTodoList(todoListId);
    // if (list === undefined) return undefined;
// 
    // return list.todos.find(todo => todo.id === todoId);
  }

  deleteList(id) {
    // const listIdx = this._todoLists.findIndex(list => list.id === id)
    // if (listIdx === -1) return undefined;
    // return this._todoLists.splice(listIdx, 1);
  }

  renameList(id, name) {
    // const list = this._findTodoList(id);
    // if (list === undefined) return undefined;
    // list.title = name;
    // return list;
  }

  addTodo(listId, todoTitle) {
    // const list = this._findTodoList(listId);
    // console.log(list);
    // if (list === undefined) return undefined;
// 
    // list.todos.push({ title: todoTitle, id: nextId(), done: false });
    // return list;
  }

  markAllDone(listId) {
    // const list = this._findTodoList(listId);
    // if (list === undefined) return undefined;
// 
    // list.todos = list.todos.map(todo => {
      // todo.done = true;
      // return todo;
    // });
    // return list;
  }

  existsTodoListTitle(title) {
    // return this._todoLists.some(list => list.title === title);
  }

  createTodoList(title) {
    // this._todoLists.push({ id: nextId(), title: title, todos: [] });
    // return true
  }

};
