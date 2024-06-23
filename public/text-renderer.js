// Custom class and functions for rendering Texts in HTML Canvas

function getTextHeight(c, text) {
  return c.measureText(text).actualBoundingBoxAscent + c.measureText(text).actualBoundingBoxDescent;
}

function getTextWidth(c, text) {
  return c.measureText(text).width
}


class TextButton {
  
  constructor(context, text, x, y, font, color, bgcolor) {
    this.c = context
    this.text = text
    this.x = x
    this.y = y
    this.font = font
    this.color = color
    this.bgcolor = bgcolor

    // Default values for text decoration
    this.padding = 8
    this.wordSpacing = 8
  } 

  renderTextButton() {
    this.c.font = this.font
    let height = getTextHeight(this.c, this.text) + this.padding * 2
    let width = getTextWidth(this.c, this.text) + this.padding * 2
    let quad = {
      x: this.x,
      y: this.y,
      width: width,
      height: height
    }
    let textQuad = new TextQuad(this.c, this.text, quad, this.font, this.color, this.bgcolor)
    textQuad.padding = this.padding
    textQuad.wordSpacing = this.wordSpacing
    textQuad.renderTextQuad()
  }

}


class TextQuad {

  constructor(context, text, quad, font, color, bgcolor) {
    this.c = context
    this.text = text
    this.quad = quad
    this.font = font
    this.color = color
    this.bgcolor = bgcolor

    // Default values for word and line separation
    this.padding = 14
    this.wordSpacing = 8
    this.lineSpacing = 14
  }

  renderTextQuad() {
    this.c.fillStyle = this.bgcolor
    this.c.fillRect(this.quad.x, this.quad.y, this.quad.width, this.quad.height)
    this.c.font = this.font
    this.c.fillStyle = this.color
    const textHeight = getTextHeight(this.c, this.text)
    const initialOffsetX = this.quad.x + this.padding
    const initialOffsetY = this.quad.y + textHeight + this.padding
    let offsetX = initialOffsetX
    let offsetY = initialOffsetY
    let lines = this.text.split("\n")
    for (let line of lines) {
      let words = line.split(" ")
      for (let word of words) {
        const textWidth = getTextWidth(this.c, word) 
        if (offsetX + textWidth > this.quad.x + this.quad.width - this.padding) {
          offsetX = initialOffsetX
          offsetY += textHeight + this.lineSpacing
        }
        this.c.fillText(word, offsetX, offsetY)
        offsetX += textWidth + this.wordSpacing
      }
      offsetX = initialOffsetX
      offsetY += textHeight + this.lineSpacing
    }
  }

}

class Renderer {

  constructor(context) {
    this.c = context
  }

  renderText(text, x, y, font, color) {
    this.c.font = font
    this.c.fillStyle = color
    this.c.fillText(text, x, y)
  }

  getTextButton(text, x, y, font, color, bgcolor) {
    return new TextButton(this.c, text, x, y, font, color, bgcolor)
  }

  getTextQuad(text, quad, font, color, bgcolor) {
    return new TextQuad(this.c, text, quad, font, color, bgcolor)
  }
}
