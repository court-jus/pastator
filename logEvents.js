const events = document.getElementById("events");

// Add a state change message.
export const showEvent = (event) => {
  const row = document.createElement("tr");

  const type = document.createElement("td");
  type.innerText = event.type;
  row.appendChild(type);

  const id = document.createElement("td");
  id.innerText = event.port.id;
  row.appendChild(id);

  const name = document.createElement("td");
  name.innerText = event.port.name;
  row.appendChild(name);

  const direction = document.createElement("td");
  direction.innerText = event.port.type;
  row.appendChild(direction);

  const connection = document.createElement("td");
  connection.innerText = event.port.connection;
  row.appendChild(connection);

  const state = document.createElement("td");
  state.innerText = event.port.state;
  row.appendChild(state);

  const time = document.createElement("td");
  time.innerText = event.timeStamp.toFixed(3);
  row.appendChild(time);

  while (events.childElementCount > 10) events.firstChild.remove();
  events.appendChild(row);
};
