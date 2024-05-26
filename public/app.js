const canvas = document.querySelector("canvas");

let ww = window.innerWidth;
let wh = window.innerHeight;

canvas.width = ww
canvas.height = wh

const c = canvas.getContext("2d");

function drawSurround() {

}

function drawPlayground(width, height) {
  c.fillStyle = "#778da9"
  c.fillRect(100, 100, width, height) 
}

function animatePlayground() {
  requestAnimationFrame(animatePlayground);
  drawPlayground(800, 600)
}

animatePlayground()

let socket = new WebSocket("ws://localhost:5000/ws");

socket.onopen = function(event) {
  let playerName = prompt("Hey! You have entered into the arena. State you name: ")
  let data = {
    action: "new",
    name: playerName
  }
  socket.send(JSON.stringify(data))
};

socket.onmessage = function(event) {
  console.log("Message received from the client: ", event.data)
  c.font = "20px Monospace"
  c.fillStyle = "#ffffff"
  c.fillText(event.data, 50, 50)
};

socket.onclose = function(event) {
  console.log("Connection has been closed with the client.")
};

socket.onerror = function(error) {
  console.log(error)
};

