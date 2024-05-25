let socket = new WebSocket("ws://localhost:5000/ws");

socket.onopen = function(event) {
  console.log("Connection has been established with the client.")
};

socket.onmessage = function(event) {
  console.log("Message received from the client: ", event.data)
};

socket.onclose = function(event) {
  console.log("Connection has been closed with the client.")
};

socket.onerror = function(error) {
  console.log(error)
};
