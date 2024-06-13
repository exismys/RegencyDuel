const canvas = document.querySelector("canvas");

let ww = window.innerWidth;
let wh = window.innerHeight;

canvas.width = ww
canvas.height = wh

const c = canvas.getContext("2d");


let arenaId, lenGlobal
let players = ["", ""]
let playerLeft = false

// Configure playground
const playground = {
  x: 150,
  y: 185,
  width: 720,
  height: 400,
  labelFont: "monospace",
  labelFontSize: "20px"
}


// Game metric declaration
const playerOne = "🛩️"
const playerTwo = "🚁"
const playerTwoW = c.measureText(playerTwo).width
let gameMetric = {
  type: "metric",
  arenaId: "",
  scores: [0, 0],
  playerOnePos: [playground.x, playground.y + playground.height / 2],
  playerTwoPos: [playground.x + playground.width - playerTwoW - 5, playground.y + playground.height / 2]
}

function getTextHeight(text) {
  return c.measureText(text).actualBoundingBoxAscent + c.measureText(text).actualBoundingBoxDescent;
}

function getTextWidth(text) {
  return c.measureText(text).width
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

function drawMessage(data) {
  let rect = {
    x: 50,
    y: 0,
    width: 500,
    height: 50
  }
  renderContent(rect, data.message)
}

function drawSurround(data) {
  arenaIdText = `Arena ID: ${data.arenaId}`
  arenaId = data.arenaId
  playersText = `Players in the Arena: [${data.players[0]}, ${data.players[1]}]`
  players = data.players
  let text = `${arenaIdText}\n${playersText}`
  let rect = {
    x: 50,
    y: 50,
    width: 500,
    height: 150
  }
  renderContent(rect, text)
  console.log("surround")
}



// p: playground rectange, data: json websocket message
function drawPlayground() {
  // Render playground outline
  c.fillStyle = "#120804"
  c.fillRect(playground.x, playground.y, playground.width, playground.height)

  // Render players and player labels
  let player = players[0]
  if (player != "") {
    let labelHeight = getTextHeight(player)
    let width = getTextWidth(player)
    c.fillStyle = "rgba(255, 204, 0, 0.5)"
    c.fillRect(playground.x, playground.y, width, labelHeight)
    c.fillStyle = "#ffffff"
    c.fillText(player, playground.x, playground.y + labelHeight)
    console.log(gameMetric.playerOnePos)
    c.fillText(playerOne, gameMetric.playerOnePos[0], gameMetric.playerOnePos[1])
  }
  player = players[1]
  if (player != "") {
    let labelHeight = getTextHeight(player)
    let width = getTextWidth(player)
    c.fillStyle = "rgba(255, 204, 0, 0.5)"
    c.fillRect(playground.x + playground.width - width, playground.y, width, labelHeight)
    c.fillStyle = "#ffffff"
    c.fillText(player, playground.x + playground.width - width, playground.y + labelHeight)
    console.log(gameMetric.playerTwoPos)
  c.fillText(playerTwo, gameMetric.playerTwoPos[0], gameMetric.playerTwoPos[1])
  }
}

// Call refresh
function animatePlayground() {
  requestAnimationFrame(animatePlayground);
  drawPlayground()
}

animatePlayground()

// Socket connection events
let socket = new WebSocket("ws://localhost:5000/ws");

socket.onopen = function(event) {
  let username = prompt("Hey! State your username to join the arena: ")
  let data = {
    type: "new conn",
    username: username,
    score: 0,
    playerOnePos: gameMetric.playerOnePos,
    playerTwoPos: gameMetric.playerTwoPos
  }
  console.log("sent: ", data)
  socket.send(JSON.stringify(data))
};

socket.onmessage = function(event) {
  console.log("Message received from the server: ", event.data)
  let data = JSON.parse(event.data)
  if (data.lenGlobal % 2 != 0) {
    playerLeft = true
  }
  if (data.type == "surround") {
    drawSurround(data)
  } else if (data.type == "message") {
    drawMessage(data)
  } else if (data.type == "metric") {
    gameMetric = data
  }
};

socket.onclose = function(event) {
  console.log("Connection has been closed with the client.")
};

socket.onerror = function(error) {
  console.log(error)
};

window.addEventListener("keydown", (event) => {
  if (event.key == "j" || event.key == "k") {
    updatePlayerPos(event.key)
  }
})

function updatePlayerPos(key) {
  let delta = key == "j" ? 1 : -1
  if (playerLeft) {
    if (gameMetric.playerOnePos[1] < playground.y + playground.height) {
      gameMetric.playerOnePos[1] += delta 
    }
  } else {
    if (gameMetric.playerTwoPos[1] < playground.y + playground.height) {
      gameMetric.playerTwoPos[1] += delta 
    }
  }
  gameMetric.arenaId = arenaId
  socket.send(JSON.stringify(gameMetric))
}
