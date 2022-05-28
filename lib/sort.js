const compareByTitle = (itemA, itemB) => {
  const titleA = itemA.title.toLowerCase();
  const titleB = itemB.title.toLowerCase();
  console.log(titleA, titleB);
  if (titleA < titleB) return -1;
  else if (titleA > titleB) return 1;
  else return 0;
};

const sortTodoLists = (undone, done) => {
  console.log(undone);
  undone.sort(compareByTitle);
  console.log(undone);
  done.sort(compareByTitle);
  return undone.concat(done);
};

const sortTodos = (list) => {
  const done = list.todos.filter((todo) => todo.isDone());
  const undone = list.todos.filter((todo) => !todo.isDone());
  return undone.sort(compareByTitle).concat(done.sort(compareByTitle));
};

module.exports = { sortTodos, sortTodoLists };
