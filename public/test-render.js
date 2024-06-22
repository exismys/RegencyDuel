let canvas = document.querySelector("canvas")
canvas.width = window.innerWidth
canvas.height = window.innerHeight
let c = canvas.getContext("2d")

let r = new Renderer(c)

r.renderText("Hello World", 50, 100, "16px monospace", "#ffffff")

let tb = r.getTextButton("Button", 100, 200, "18x Arial", "#00ffff", "#000000") 
tb.renderTextButton()

// Todo: It works accurately only for one word
let tb2 = r.getTextButton("Hello", 200, 300, "24px Monospace", "#770000", "#000000")
tb2.renderTextButton()

// Animate button

function animate() {
  requestAnimationFrame(animate)
  c.fillStyle = "#0d1b2a"
  c.fillRect(0, 0, canvas.width, canvas.height)
  tb.x = tb.x + 1
  tb.renderTextButton()
}

// animate()
