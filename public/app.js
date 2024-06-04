const canvas = document.querySelector("canvas");

let ww = window.innerWidth;
let wh = window.innerHeight;

canvas.width = ww
canvas.height = wh

const c = canvas.getContext("2d");

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
    console.log(text)
    let rect = {
      x: 50,
      y: 50,
      width: 500,
      height: 150
    }
    renderContent(rect, text)
  } else if (data.type == "message") {
    console.log("inside message")
    let rect = {
      x: 50,
      y: 0,
      width: 500,
      height: 50
    }
    renderContent(rect, data.message)
  }
}

function drawPlayground(width, height) {
  c.fillStyle = "#778da9"
  c.fillRect(150, 185, width, height) 
}

function animatePlayground() {
  requestAnimationFrame(animatePlayground);
  drawPlayground(720, 400)
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
  drawSurround(JSON.parse(event.data))
};

socket.onclose = function(event) {
  console.log("Connection has been closed with the client.")
};

socket.onerror = function(error) {
  console.log(error)
};

