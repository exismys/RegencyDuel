let ww = window.innerWidth;
let wh = window.innerHeight;

const canvas = document.querySelector("canvas");
canvas.width = 1366
canvas.height = 700

const c = canvas.getContext("2d");

// This is my custom class for text related renderings
// This requires text-renderer.js import
const r = new Renderer(c)


// Playground configurations
const playground = {
  x: 50,
  y: 50,
}
playground["width"] = canvas.width - playground.x * 2
playground["height"] = canvas.height - playground.y - 50

// Styles
let sbgcolor = "#7E6363"
let scolor = "#cde617"
let pbgcolor = "#3E3232"
let lbgcolor = "#000000"
let lcolor = "#ffffff"
let bcolor = "#ffffff"

let dfont = "18px Monospace"
let iconFont = "30px Monospace"
let labelFont = "24px Monospace"

const iconLeft = "🛩️"
const iconRight = "🚁"
const paddingH = 5

// Load a custom font
// The font is linked in HTML head tag
document.fonts.load('10pt "Lobster"').then(() => {
  dfont = "18px Lobster"
  iconFont = "30px Lobster"
  labelFont = "24px Lobster"
});

c.font = labelFont
const iconRightWidth = getTextWidth(c, iconRight)

// Pertinent global variables
let usernames = ["", ""]
let left = false
let bullets = []
let arenaId, numConn
let health = [3, 3]

// Metric variables
let lpos = [playground.x + paddingH, playground.y + playground.height / 2]
let rpos = [playground.x + playground.width - iconRightWidth - paddingH - 1, playground.y + playground.height / 2]
let scores = [0, 0]


class Bullet {

  constructor(id, x, y, from) {
    this.id = id
    this.x = x
    this.y = y
    this.from = from

    let b = "*"
    c.font = dfont
    this.width = getTextWidth(c, b)
    this.height = getTextHeight(c, b)
  }

  // Todo: There are bugs like bullet deleting at wrong places without hitting the icons
  update() {

    if (this.from == 1) {

      c.font = iconFont
      let rtextHeight = getTextHeight(c, iconRight)
      if (this.x + 10 > rpos[0] && this.y < rpos[1] && this.y > rpos[1] - rtextHeight) {
        this.x = rpos[0]
        health[1] += -1
        this.delete(this)
        return
      }

      let rbound = playground.x + playground.width - this.width
      if (this.x < rbound) {
        if (this.x + 10 > rbound) {
          this.x = rbound
          return
        }
        this.x += 10
      } else {
        this.delete(this)
      }

    }

    if (this.from == 2) {

      c.font = iconFont
      let ltextWidth = getTextWidth(c, iconLeft)
      let ltextHeight = getTextHeight(c, iconLeft)
      if (this.x - 10 < lpos[0] + ltextWidth && this.y < lpos[1] && this.y > lpos[1] - ltextHeight) {
        this.x = lpos[0] + ltextWidth
        health[0] += -1
        this.delete(this)
        return
      }
      
      if (this.x > playground.x) {
        if (this.x - 10 < playground.x) {
          this.x = playground.x
          return
        }
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


function drawSurround(data) {
  usernames = data.players
  arenaId = data.arenaId
  let messageText = data.message // This is redundant, leaving it to just remember the incoming data
  let arenaIdText = `Arena ID: ${data.arenaId}`
  let playersText = `Players in the Arena: [${data.players[0]}, ${data.players[1]}]`

  const x = 75
  const y = 0
  const pad = 5

  c.font = dfont
  const adjustedy = y + getTextHeight(c, arenaIdText) + pad + 7
  const adjustedx = x + canvas.width - x * 2 - getTextWidth(c, playersText) - pad 
  c.fillStyle = sbgcolor
  c.fillRect(0, 0, canvas.width, canvas.height)
  r.renderText(arenaIdText, x + pad, adjustedy, dfont, scolor)
  r.renderText(playersText, adjustedx, adjustedy, dfont, scolor)
}


function drawPlayground() {

  // Render playground outline
  c.fillStyle = pbgcolor
  c.fillRect(playground.x, playground.y, playground.width, playground.height)

  // Render players and player labels
  let username = usernames[0]
  if (username != "") {
    let lives = ""
    for (let i = 0; i < health[0]; i++) {
      lives = lives + "🤎"
    }
    let labell = r.getTextButton(`${username} ${lives}`, playground.x, playground.y, labelFont, lcolor, lbgcolor)
    labell.renderTextButton()
    r.renderText(iconLeft, lpos[0], lpos[1], iconFont, lcolor)
  }

  username = usernames[1]
  if (username != "") {
    c.font = labelFont
    let lives = ""
    for (let i = 0; i < health[1]; i++) {
      lives = lives + "🤎"
    }
    let width = getTextWidth(c, `${username} ${lives}`)
    let labelr = r.getTextButton(`${username} ${lives}`, playground.x + playground.width - width - 16, playground.y, labelFont, lcolor, lbgcolor)
    labelr.renderTextButton()
    r.renderText(iconRight, rpos[0], rpos[1], iconFont, lcolor)
  }

  // Render line
  let text = "🤎"
  c.font = labelFont
  let liney = playground.y + getTextHeight(c, text) + 16
  let linex1 = playground.x
  let linex2 = playground.x + playground.width
  c.fillStyle = "#aaa"
  c.beginPath()
  c.moveTo(linex1, liney)
  c.lineTo(linex2, liney)
  c.stroke()


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

  let text = "🤎"
  c.font = labelFont
  let upbound = playground.y + getTextHeight(c, text) + 16
  c.font = iconFont
  upbound = upbound + getTextHeight(c, iconLeft)
  
  if (left) {

    if (key == "j" && lpos[1] < playground.y + playground.height - 6) {
      lpos[1] += 1 
    }

    if (key == "k" && lpos[1] > upbound) {
      lpos[1] += -1
    }

  } else {

    if (key == "j" && rpos[1] < playground.y + playground.height - 6) {
      rpos[1] += 1 
    }

    if (key == "k" && rpos[1] > upbound) {
      rpos[1] += -1
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
