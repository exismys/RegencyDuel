const canvas = document.querySelector("canvas");

let ww = window.innerWidth;
let wh = window.innerHeight;

canvas.width = ww
canvas.height = wh

const c = canvas.getContext("2d");


// Configure playground
const playground = {
  x: 150,
  y: 185,
  width: 720,
  height: 400,
  labelFont: "monospace",
  labelFontSize: "20px"
}

function getTextHeight(text) {
  return c.measureText(text).actualBoundingBoxAscent + c.measureText(text).actualBoundingBoxDescent;
}

function renderContent(rectangle, text) {
  const marginX = 15
  const marginY = 20
  const wordSpacing = 8
  const lineSpacing = 15
  c.fillStyle = "#0d1b2a"
  c.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height)
  c.font = "16px Monospace";
  c.fillStyle = "#ffffff"
  const textHeight = getTextHeight(text)
  const initialOffsetX = rectangle.x + marginX
  const initialOffsetY = rectangle.y + textHeight + marginY
  let offsetX = initialOffsetX
  let offsetY = initialOffsetY
  let lines = text.split("\n")
  for (let line of lines) {
    let words = line.split(" ")
    for (let word of words) {
      const textWidth = c.measureText(word).width
      if (offsetX + textWidth > rectangle.x + rectangle.width - marginX) {
        offsetX = initialOffsetX
        offsetY += textHeight + lineSpacing
      }
      c.fillText(word, offsetX, offsetY)
      offsetX += textWidth + wordSpacing
    }
    offsetX = initialOffsetX
    offsetY += textHeight + lineSpacing
  }
}

function drawSurround(data) {
  let arenaId, lenGlobal, players
  if (data.type == "metric") {
    arenaId = `Arena ID: ${data.arenaId}`
    players = `Players in the Arena: [${data.players[0]}, ${data.players[1]}]`
    lenGlobal = `Number of players globally: ${data.lenGlobal}`
    let text = `${arenaId}\n${players}\n${lenGlobal}`
    let rect = {
      x: 50,
      y: 50,
      width: 500,
      height: 150
    }
    renderContent(rect, text)
  } else if (data.type == "message") {
    let rect = {
      x: 50,
      y: 0,
      width: 500,
      height: 50
    }
    renderContent(rect, data.message)
  }
}

// p: playground rectange, data: json websocket message
function drawPlayground(p, data) {
    c.fillStyle = "#778da9"
    c.fillRect(p.x, p.y, p.width, p.height)
      // Render player labels
  if (Object.keys(data).length != 0) {
        player1 = data.players[0].username == "" ? "Player 1" : data.players[0].username
    player2 = data.players[1].username == "" ? "Player 2" : data.players[1].username
    let labelHeight = getTextHeight(player1)
    let width1 = c.measureText(player1).width
    let width2 = c.measureText(player2).width
    c.fillStyle = "rgba(255, 204, 0, 0.5)"
    c.fillRect(p.x, p.y, width1, labelHeight)
    c.fillRect(p.x - width2, p.y, width2, labelHeight)
    c.fillStyle = "#ffffff"
    c.fillText(player1, p.x, p.y + labelHeight)
    c.fillText(player2, p.x + p.width - width2, p.y + labelHeight)
  }
}

// Call refresh
function animatePlayground() {
  requestAnimationFrame(animatePlayground);
  drawPlayground(playground, {})
}

animatePlayground()

let socket = new WebSocket("ws://localhost:5000/ws");

socket.onopen = function(event) {
  let username = prompt("Hey! You have entered into the arena. State your username: ")
  let data = {
    type: "new conn",
    username: username
  }
  socket.send(JSON.stringify(data))
};

socket.onmessage = function(event) {
  console.log("Message received from the server: ", event.data)
  let data = JSON.parse(event.data)
  drawSurround(data)
  drawPlayground(playground, data)
};

socket.onclose = function(event) {
  console.log("Connection has been closed with the client.")
};

socket.onerror = function(error) {
  console.log(error)
};

