const { dbQuery } = require("./db-query");

module.exports = class PgPersistence {
  constructor(session) {
    // this._todoLists = session.todoLists || deepCopy(SeedData);
    // // Debug line to reset the store
    // // this._todoLists = deepCopy(SeedData);
    // session.todoLists = this._todoLists;
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

  loadTodoList(id) {
    // return deepCopy(this._findTodoList(id));
  }

  loadTodo(listId, todoId) {
    // const list = this._findTodo;
    // if (list === undefined) return undefined;
// 
    // const todos = list.todos;
    // return deepCopy(todos.find((todo) => todo.id === todoId));
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

  toggleTodoCompletion(listId, todoId) {
    // const todo = this._findTodo(listId, todoId);
    // if (todo === undefined) return undefined;
// 
    // todo.done = !todo.done;
    // return todo;
  }

  deleteTodo(listId, todoId) {
    // const list = this._findTodoList(listId);
    // if (list === undefined) return undefined;
// 
    // const todoIdx = list.todos.findIndex(todo => todo.id === todoId);
    // if (todoIdx === -1) return undefined;
    // else {
      // return list.todos.splice(todoIdx, 1);
    // }
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

  sortedTodos(todoList) {
    // const todos = todoList.todos;
    // const done = todos.filter((todo) => todo.done);
    // const undone = todos.filter((todo) => !todo.done);
    // return sortTodoLists(undone, done);
  }
};
