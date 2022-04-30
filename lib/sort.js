const compareByTitle = (itemA, itemB) => {
  const titleA = itemA.title.toLowerCase();
  const titleB = itemB.title.toLowerCase();
  if (titleA < titleB) return -1;
  else if (titleA > titleB) return 1;
  else return 0;
};

const sortTodoLists = (lists) => {
  const sortedNotDoneLists = lists
    .filter((list) => !list.isDone())
    .sort(compareByTitle);
  const sortedDoneLists = lists
    .filter((list) => list.isDone())
    .sort(compareByTitle);
  return sortedNotDoneLists.concat(sortedDoneLists);
};

const sortTodos = (list) => {
  const done = list.todos.filter((todo) => todo.isDone());
  const undone = list.todos.filter((todo) => !todo.isDone());
  return undone.sort(compareByTitle).concat(done.sort(compareByTitle));
};

module.exports = { sortTodos, sortTodoLists };
