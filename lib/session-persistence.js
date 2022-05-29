const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodoLists } = require("./sort");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  sortedTodoLists() {
    const lists = deepCopy(this._todoLists);
    const undone = lists.filter((list) => !this.isDoneTodoList(list));
    const done = lists.filter((list) => this.isDoneTodoList(list));
    return sortTodoLists(undone, done);
  }

  isDoneTodoList(list) {
    return list.todos.length > 0 && list.todos.every((todo) => todo.done);
  }

  loadTodoList(id) {
    return deepCopy(this._todoLists.find((list) => list.id === id));
  }

  sortedTodos(todoList) {
    const todos = todoList.todos;
    const done = todos.filter((todo) => todo.done);
    const undone = todos.filter((todo) => !todo.done);
    return sortTodoLists(undone, done);
  }
};
