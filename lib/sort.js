const compareByTitle = (itemA, itemB) => {
  const titleA = itemA.title.toLowerCase();
  const titleB = itemB.title.toLowerCase();
  console.log(titleA, titleB);
  if (titleA < titleB) return -1;
  else if (titleA > titleB) return 1;
  else return 0;
};

const sortItems = (undone, done) => {
  undone.sort(compareByTitle);
  done.sort(compareByTitle);
  return undone.concat(done);
};

module.exports = { sortTodos: sortItems, sortTodoLists: sortItems };
