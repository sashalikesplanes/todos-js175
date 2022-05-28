const SeedData = require("./seed-data");
const deepCopy = require("./deep-copy");
const { sortTodoLists } = require("./sort");

module.exports = class SessionPersistence {
  constructor(session) {
    this._todoLists = session.todoLists || deepCopy(SeedData);
    session.todoLists = this._todoLists;
  }

  sortedTodoLists() {
    const todoLists = deepCopy(this._todoLists);
    const undone = todoLists.filter((list) => !this.isDoneTodoList(list));
    const done = todoLists.filter((list) => this.isDoneTodoList(list));
    return sortTodoLists(undone, done);
  }

  isDoneTodoList(list) {
    return list.todos.length > 0 && list.todos.every((todo) => todo.done);
  }
};
