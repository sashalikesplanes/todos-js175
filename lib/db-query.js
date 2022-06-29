const { Client } = require("pg");

const logQuery = (statement, parameters) => {
  const timeStamp = new Date();
  const formattedTimeStamp = timeStamp.toString().substring(4,24);
  console.log("DB LOGGER: ", formattedTimeStamp, statement, parameters);
}

module.exports = {
  async dbQuery(statement, ...parameters) {
    const client = new Client({ database: 'todo-lists' });
    await client.connect();
    logQuery(statement, parameters);

    const result = await client.query(statement, parameters);

    await client.end();
    return result
  }
}
