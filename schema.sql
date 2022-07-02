CREATE TABLE users (
    username text PRIMARY KEY,
    password text NOT NULL
);

CREATE TABLE todolists (
    id serial PRIMARY KEY,
    username text
        NOT NULL
        REFERENCES users(username)
        ON DELETE CASCADE,
    title varchar(100) UNIQUE NOT NULL
);

CREATE TABLE todos (
    id serial PRIMARY KEY,
    title varchar(100) NOT NULL,
    done boolean NOT NULL DEFAULT false,
    todolist_id int
        NOT NULL
        REFERENCES todolists(id)
        ON DELETE CASCADE,
    username text
        NOT NULL
        REFERENCES users(username)
        ON DELETE CASCADE
);

