INSERT INTO todolists (title, username)
  VALUES ('Work Todos', 'sasha'),
         ('Home Todos', 'adele'),
         ('Additional Todos', 'sasha'),
         ('social todos', 'adele');

-- Note: in the following statement, get the todo list IDs from
-- the todolists table. If the todo list IDs are 1, 2, 3, and 4, then our code looks like this:
INSERT INTO todos (title, done, todolist_id, username)
  VALUES ('Get coffee', TRUE, 1, 'sasha'),
         ('Chat with co-workers', TRUE, 1, 'sasha'),
         ('Duck out of meeting', FALSE, 1, 'sasha'),
         ('Feed the cats', TRUE, 2, 'adele'),
         ('Go to bed', TRUE, 2, 'adele'),
         ('Buy milk', TRUE, 2, 'adele'),
         ('Study for Launch School', TRUE, 2, 'adele'),
         ('Go to Libby''s birthday party', FALSE, 4, 'adele');
