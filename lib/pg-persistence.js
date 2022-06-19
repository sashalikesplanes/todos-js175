const { Client } = require("pg");

module.exports = class PgPersistence {
  async testQ() {
    const SQL = "SELECT * FROM todolists;";

    const client = new Client({ database: "todo-lists" });
    await client.connect();
    const result = await client.query(SQL);
    console.log("q1", result.rows);
    await client.end();
  }

  async testQ2() {
    const SQL = "SELECT * FROM todos;";

    const client = new Client({ database: "todo-lists" });
    await client.connect();
    const result = await client.query(SQL);
    console.log("q2", result.rows);
    await client.end();
  }
    
  constructor(session) {
    // this._todoLists = session.todoLists || deepCopy(SeedData);
    // // Debug line to reset the store
    // // this._todoLists = deepCopy(SeedData);
    // session.todoLists = this._todoLists;
  }

  sortedTodoLists() {
    // const lists = deepCopy(this._todoLists);
    // const undone = lists.filter((list) => !this.isDoneTodoList(list));
    // const done = lists.filter((list) => this.isDoneTodoList(list));
    // return sortTodoLists(undone, done);
  }

  isDoneTodoList(list) {
    // return list.todos.length > 0 && list.todos.every((todo) => todo.done);
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
