let ww = window.innerWidth;
let wh = window.innerHeight;

const canvas = document.querySelector("canvas");
canvas.width = ww
canvas.height = wh
const c = canvas.getContext("2d");

// This is my custom class for text related renderings
// This requires text-renderer.js import
const r = new Renderer(c)


// Playground configurations
const playground = {
  x: 100,
  y: 185,
}
playground["width"] = canvas.width * 0.8 - playground.x
playground["height"] = canvas.height * 0.8 - playground.y


// Pertinent global variables
let usernames = ["", ""]
let left = false
let bullets = []
let arenaId, numConn


window.addEventListener("resize", () => {
  ww = window.innerWidth;
  wh = window.innerHeight;
  canvas.width = ww;
  canvas.height = wh;
  playground["width"] = canvas.width * 0.8 - playground.x
  playground["height"] = canvas.height * 0.8 - playground.y
})


class Bullet {

  constructor(id, x, y, from) {
    this.id = id
    this.x = x
    this.y = y
    this.from = from
  }

  update() {
    if (this.from == 1) {
      if (this.x < playground.x + playground.width - 1) {
        this.x += 10
      } else {
        this.delete(this)
      }
    }
    if (this.from == 2) {
      if (this.x > playground.x) {
        this.x -= 10
      } else {
        this.delete(this)
      }
    }
  }

  delete() {
    let index = bullets.indexOf(this)
    if (index > -1) {
      bullets.splice(index, 1)
    }
  }

  static generateId() {
    let id = Math.floor(Math.random() * 100)
    return id
  }

}


// Style variables
const iconLeft = "🛩️"
const iconRight = "🚁"
const paddingH = 5
const dfont = "14px Monospace"

c.font = dfont
const iconRightWidth = getTextWidth(c, iconRight)


// Metric variables
let lpos = [playground.x + paddingH, playground.y + playground.height / 2]
let rpos = [playground.x + playground.width - iconRightWidth - paddingH, playground.y + playground.height / 2]
let scores = [0, 0]


function drawSurround(data) {
  usernames = data.players
  arenaId = data.arenaId
  let messageText = data.message
  let arenaIdText = `Arena ID: ${data.arenaId}`
  let playersText = `Players in the Arena: [${data.players[0]}, ${data.players[1]}]`
  let text = `${messageText}\n\n${arenaIdText}\n${playersText}`
  let rect = {
    x: 50,
    y: 0,
    width: 500,
    height: 200 
  }
  let textQuad = r.getTextQuad(text, rect, "14px Monospace", "#ffffff", "#333333")
  textQuad.renderTextQuad()
}


function drawPlayground() {

  // Render playground outline
  c.fillStyle = "#120804"
  c.fillRect(playground.x, playground.y, playground.width, playground.height)

  // Render players and player labels
  let username = usernames[0]
  if (username != "") {
    let labell = r.getTextButton(username, playground.x, playground.y, dfont, "#770000", "#333333")
    labell.renderTextButton()
    r.renderText(iconLeft, lpos[0], lpos[1], dfont, "#770000")
  }

  username = usernames[1]
  if (username != "") {
    c.font = dfont
    let width = getTextWidth(c, username)
    let labelr = r.getTextButton(username, playground.x + playground.width - width - 16, playground.y, dfont, "#770000", "#333333")
    labelr.renderTextButton()
    r.renderText(iconRight, rpos[0], rpos[1], dfont, "#770000")
  }

  // Render bullets
  for (let i = 0; i < bullets.length; i++) {
    c.font = dfont
    c.fillText("*", bullets[i].x, bullets[i].y)
    bullets[i].update()
  }

}


function animatePlayground() {
  requestAnimationFrame(animatePlayground);
  drawPlayground()
}

animatePlayground()


// Socket connection events
let socketUrl = "ws://localhost:5000/ws"
let socket = new WebSocket(socketUrl);

socket.onopen = function(event) {
  let username = prompt("Hey! State your username to join the arena: ")
  let data = {
    type: "new conn",
    username: username,
    score: 0,
    playerOnePos: lpos,
    playerTwoPos: rpos
  }
  console.log("sent: ", data)
  socket.send(JSON.stringify(data))
};

socket.onmessage = function(event) {
  console.log("Message received from the server: ", event.data)
  let data = JSON.parse(event.data)
  if (data.type == "new conn") {
    if (data.lenGlobal % 2 != 0) {
      left = true
    }
    drawSurround(data)
  } else if (data.type == "pos") {
    lpos = data.playerOnePos
    rpos = data.playerTwoPos
  } else if (data.type == "bullet") {
    let bullet = new Bullet(data.bulletId, data.bulletPos[0], data.bulletPos[1], data.from)
    bullets.push(bullet)
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

  if (event.key == "f") {

    let x, y, from, bulletId

    if (left) {
      x = lpos[0]
      y = lpos[1]
      from = 1
    } else {
      x = rpos[0]
      y = rpos[1]
      from = 2
    }
    
    bulletId = Bullet.generateId()

    let bullet = new Bullet(bulletId, x, y, from)
    bullets.push(bullet)

    let data = {
      type: "bullet",
      arenaId: arenaId,
      bulletId: bulletId,
      bulletPos: [x, y],
      from: from
    }

    socket.send(JSON.stringify(data))

  }

})

function updatePlayerPos(key) {
  
  let delta = key == "j" ? 1 : -1

  if (left) {
    if (lpos[1] < playground.y + playground.height) {
      lpos[1] += delta 
    }
  } else {
    if (rpos[1] < playground.y + playground.height) {
      rpos[1] += delta 
    }
  }

  let data = {
    type: "pos",
    arenaId: arenaId,
    playerOnePos: lpos,
    playerTwoPos: rpos
  }
  
  socket.send(JSON.stringify(data))
}
