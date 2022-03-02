import axios from '@/services/api'
import my24 from '@/services/my24'

const COMPACT = 'compact'
const WIDE = 'wide'


class Dispatch {
  rowHeightCompact = 28
  rowHeightWide = 28
  numSlots = 6

  mode

  fontface = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"'
  fontsize
  fontsizeCompact = 14
  fontsizeWide = 16
  fontPaddingWide = 4

  xPadding = 4
  yPaddingCompact = 14
  yPaddingWide = 20

  endSlotPadding = 6
  startSlotPadding = 6

  orderLineWidth = 10
  orderLinePaddingTop = 6
  orderLinePaddingBottom = 2

  overUserLineWidth = 4
  overUserLinePaddingRight = 4
  overUserLinePaddingTop = 2
  overUserLinePaddingBottom = 2
  overUserLineAllEmpty = true
  overUserLineYOffset = 110

  hotspots = []
  rowInfoPositions = {}

  canvas
  tipCanvas
  ctx
  tipCtx
  width
  slotWidth
  strokeStyle = 'red'
  lineWidth = 1
  lastY = 1
  cw
  ch
  offsetX
  offsetY

  component

  searchQuery = null

	monday
  numDays = 5
  startDate
  endDate = null
  daysInView = []
  dateToIndex = {}
  userYPositions = []

  debug = false
  debugNumUsers = 3

  statuscodes = null

  url = '/company/dispatch-assignedorders-user-list-v2/'

  constructor(canvas, tipCanvas, statuscodes, component, monday) {
    this.canvas = canvas
    this.tipCanvas = tipCanvas
    this.component = component
    this.monday = monday
    this.tipCtx = tipCanvas.getContext("2d")
    this.ctx = canvas.getContext('2d')

	  this.width = canvas.clientWidth
	  this.slotWidth = this.width/this.numSlots
    this.statuscodes = statuscodes

    this.startDate = component.$moment().weekday(this.monday)
    this.ctx.font = `${this.getFontsize()}px ${this.fontface}`
  }

  setMonday(day) {
    this.om
  }

  setSearchQuery(query) {
    this.searchQuery = query
  }

  setMode(mode) {
    this.mode = mode
  }

  search() {
    for (const [posY, info] of Object.entries(this.rowInfoPositions)) {
      let re = new RegExp(this.searchQuery, 'gi')
      if (info.match(re)) {
        window.scrollTo({
          top: posY,
          left: 0,
          behavior: 'smooth'
        })

        const startX = this.slotWidth - this.overUserLinePaddingRight - 5
        for (let i=0; i<this.userYPositions.length; i++) {
          const yData = this.userYPositions[i]
          if (posY+5 > yData.start && posY < yData.end) {
            this.doFade(startX, yData.start+2, 5, yData.end - yData.start-4)
            break
          }
        }

        return
      }
    }
  }

  async doFade(x, y, w, h, cb) {
    await this.fadeInRectangle(x, y, w, h, 255, 0, 0)
    await this.fadeOutRectangle(x, y, w, h, 255, 0, 0)
    await this.fadeInRectangle(x, y, w, h, 255, 0, 0)
    await this.fadeOutRectangle(x, y, w, h, 255, 0, 0)
  }

  fadeOutRectangle(x, y, w, h, r, g, b) {
    return new Promise((resolve, reject) => {
      let steps = 50,
        dr = (255 - r) / steps, // how much red should be added each time
        dg = (255 - g) / steps, // green
        db = (255 - b) / steps, // blue
        i = 0, // step counter
        interval = setInterval(() => {
          this.ctx.fillStyle = 'rgb(' + Math.round(r + dr * i) + ','
                                 + Math.round(g + dg * i) + ','
                                 + Math.round(b + db * i) + ')'
          this.ctx.fillRect(x, y, w, h) // will redraw the area each time
          i++
          if(i === steps) { // stop if done
            clearInterval(interval)
            resolve()
          }
        }, 20)
    })
  }

  fadeInRectangle(x, y, w, h, r, g, b) {
    return new Promise((resolve, reject) => {
      let steps = 50,
        dr = (255-r) / steps, // how much red should be removed each time
        dg = (255-g) / steps, // green
        db = (255-b) / steps, // blue
        i = 0, // step counter
        interval = setInterval(() => {
          const rgb = 'rgb(' + Math.round(r - dr * i) + ','
                             + Math.round(r - dg * i) + ','
                             + Math.round(r- db * i) + ')'
          this.ctx.fillStyle = rgb
          this.ctx.fillRect(x, y, w, h) // will redraw the area each time
          i++
          if(i === steps) { // stop if done
            clearInterval(interval)
            resolve()
          }
        }, 30)
      })
  }


  loadToday() {
    this.startDate = this.component.$moment().weekday(this.monday)
    this.drawDispatch()
  }

  fetchData() {
    const url = `${this.url}?start_date=${this.getCurrentDate()}`

    return axios.get(url).then(response => response.data)
  }

  async drawDispatch() {
    this.component.showOverlay = true
    try {
      this.userYPositions = []
      const results = await this.fetchData()
      this.canvas.height = results.data.length * this.rowHeight + 300
      this._draw(results.data)
      this.component.showOverlay = false
      this.component.newData = false
    } catch(error) {
      this.component.showOverlay = false
      console.log('error fetching dispatch data', error)
      this.component.errorToast(this.component.$trans('Error loading dispatch data'))
      return
    }
  }

  _draw(data, timesDone=0) {
    if (this.debug) {
      console.log('Doing empty run to get lastY')
    }

    this.lastY = 1
    this.setLastY(data)
    let finalLastY = this.lastY + 250
    this.canvas.height = finalLastY

    if (this.debug) {
      console.log(`------------- empty run done, lastY: ${finalLastY}`)
    }

    this.component.showOverlay = true

    this.lastY = 1
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.hotspots = []

    this.reOffset()
    this.setDates()
    this.drawHeader()

    this.reOffset()
    this.createUserRows(data)
    if (this.debug) {
      console.log(finalLastY, this.lastY, finalLastY - this.lastY)
    }

    if (finalLastY - this.lastY < 0) {
      console.log('second pass', timesDone)
      if (timesDone > 2) {
        throw 'HELP'
      }

      this._draw(data, ++timesDone)
    }
  }

  setStartDate(dateString) {
    this.startDate = this.component.$moment(dateString, 'YYYY/MM/DD')
  }

  setStartDateComponent() {
    this.component.startDate = this.startDate.toDate()
  }

  reOffset() {
    const BB = this.canvas.getBoundingClientRect()
    this.offsetX = BB.left
    this.offsetY = BB.top
  }

  setDates() {
    this.daysInView = []
    this.dateToIndex = []

    for (let date=this.startDate.clone(), i=0; i<this.numDays; i++) {
    	const dateFormated = date.format('YYYY-MM-DD')
    	const dateHeader = i === 0 ? date.format('ddd DD/MM, [week] W') : date.format('ddd DD/MM') // display week in first column

      this.daysInView.push({
      	dateFormated,
      	dateHeader,
        orders: []
      })

      this.dateToIndex[dateFormated] = i

      date.add(1, 'days')
	    this.endDate = date
    }
  }

  drawHeader() {
    // horizontal header line
    this.ctx.beginPath()
    this.ctx.lineWidth = this.lineWidth
    this.ctx.strokeStyle = '#000'

    this.ctx.moveTo(this.slotWidth-1, this.lastY)
    this.ctx.lineTo(this.width, this.lastY)

    this.lastY += 1

    for (let x=this.slotWidth, i=0; x<this.width; x+=this.slotWidth, i++) {
      this.ctx.moveTo(x, this.lastY)
      this.ctx.lineTo(x, this.lastY + this.getRowHeightInt())

      this.setText(this.daysInView[i].dateHeader, x+this.xPadding, this.getYPadding(), this.slotWidth-this.xPadding)
    }

    // last vertical line
    this.ctx.moveTo(this.width-1, this.lastY)
    this.ctx.lineTo(this.width-1, this.lastY + this.getRowHeightInt())

    this.lastY += 1

    this.lastY += this.getRowHeightInt()

    this.ctx.stroke()

    this.horizontalLine(this.lastY)
  }

  setLastY(data) {
    this.headerLastY()
    for (let i=0; i<data.length; i++) {
      this.updateLastYUser(data[i])
      if (this.debug && this.debugNumUsers === i+1) {
        break
      }
    }
  }

  headerLastY() {
    this.lastY += 1
    this.lastY += 1
    this.lastY += this.getRowHeightInt()
  }

  updateLastYUser(data) {
    const startY = this.lastY
    const rowHeight = this.getRowHeight()
    this.resetDayOrders()

    for (const [date, orders] of Object.entries(data.assignedorders.start)) {
      for(let i=0; i<orders.length; i++) {
        const endOrder = this.getEnd(orders[i].order_pk, data.assignedorders.end)

        // start outside window, end within
        if (!(date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          const endIndex = this.dateToIndex[endOrder.date]
          const ySlot = this.findEmptyYSlot(0)
          this.setYSlot(orders[i].order_pk, ySlot, 0, endIndex)
        }

        // start inside window, end outside
        else if ((date in this.dateToIndex) && !(endOrder.date in this.dateToIndex)) {
          const startIndex = this.dateToIndex[date]
          const ySlot = this.findEmptyYSlot(startIndex)
          this.setYSlot(orders[i].order_pk, ySlot, startIndex, this.numSlots-2)
        }

        // start & end inside window
        else if ((date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          // same day
          if (date === endOrder.date) {
            const index = this.dateToIndex[date]
            const ySlot = this.findEmptyYSlot(index)
            this.setYSlot(orders[i].order_pk, ySlot, index, index)
          } else {
            const startIndex = this.dateToIndex[date]
            const endIndex = this.dateToIndex[endOrder.date]
            const ySlot = this.findEmptyYSlot(startIndex)
            this.setYSlot(orders[i].order_pk, ySlot, startIndex, endIndex)
          }
        }
      } // for orders.length
    } // for data.assignedorders.start

    this.lastY += rowHeight
  }

  createUserRows(data) {
    for (let i=0; i<data.length; i++) {
      if (this.debug) {
        console.log(`creating row for ${data[i].full_name}, lastY=${this.lastY}`)
      }
      this.createUserRow(data[i])

      if (this.debug && this.debugNumUsers === i+1) {
        break
      }
    }

    if (this.debug) {
      for(let i=0; i<this.daysInView.length; i++) {
        console.log(`${this.daysInView[i].dateFormated}`, this.daysInView[i].orders)
      }
    }
  }

  createUserRow(data) {
    const startY = this.lastY
    let rowInfo = []

    this.resetDayOrders()
    this.setText(data.full_name, 1+this.xPadding, this.lastY+this.getYPadding(), this.slotWidth)
    rowInfo.push(data.full_name)

    // prio 1 = start outside, end within window
    // prio 2 = start inside, end outside window
    // prio 3 = start/end inside window
    // prio 4 = same day
    let rowOrderLinesPrio1 = []
    let rowOrderLinesPrio2 = []
    let rowOrderLinesPrio3 = []
    let rowOrderLinesPrio4 = []

    for (const [date, orders] of Object.entries(data.assignedorders.start)) {
      for(let i=0; i<orders.length; i++) {
        // fill searchable info
        rowInfo.push(orders[i].order_pk)
        rowInfo.push(orders[i].assignedorder_status)
        rowInfo.push(orders[i].order_status)
        rowInfo.push(orders[i].order_info)

        const endOrder = this.getEnd(orders[i].order_pk, data.assignedorders.end)
        if (this.debug) {
          console.log(`order ${orders[i].order_pk}, start: ${date}, end: ${endOrder.date}`)
        }

        // start outside window, end within
        if (!(date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          rowOrderLinesPrio1.push({
            order: orders[i],
            startIndex: 0,
            endIndex: this.dateToIndex[endOrder.date],
            startPosX: this.getSlotsStartX(),
            endPosX: this.getEndXPos(this.dateToIndex[endOrder.date]),
          })
        }

        // start inside window, end outside
        else if ((date in this.dateToIndex) && !(endOrder.date in this.dateToIndex)) {
          rowOrderLinesPrio2.push({
            order: orders[i],
            startIndex: this.dateToIndex[date],
            endIndex: this.numSlots-2,
            startPosX:this.getStartXPos(this.dateToIndex[date]),
            endPosX: this.getSlotsEndX(),
          })
        }

        // start & end inside window
        else if ((date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          // not same day
          if (date !== endOrder.date) {
            rowOrderLinesPrio3.push({
              order: orders[i],
              startIndex: this.dateToIndex[date],
              endIndex: this.dateToIndex[endOrder.date],
              startPosX: this.getStartXPos(this.dateToIndex[date]),
              endPosX: this.getEndXPos(this.dateToIndex[endOrder.date]),
            })
          } else {
            rowOrderLinesPrio4.push({
              order: orders[i],
              startIndex: this.dateToIndex[date],
              endIndex: this.dateToIndex[date],
              startPosX: this.getStartXPosSameDay(this.dateToIndex[date]),
              endPosX: this.getEndXPosSameDay(this.dateToIndex[date]),
            })
          }

        }
      } // for orders.length
    } // for data.assignedorders.start

    // draw order lines
    rowOrderLinesPrio1.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(0)

      if (this.debug) {
        console.log('drawOrderLine: start outside window, end within')
        console.log(`order_pk=${lineData.order.order_pk}, ySlot=${ySlot}, startIndex=${lineData.startIndex}, endIndex=${lineData.endIndex}`)
      }

      // set y slots in all slots
      this.setYSlot(lineData.order.order_pk, ySlot, lineData.startIndex, lineData.endIndex)

      // draw the line
      this._drawOrderLine(lineData, ySlot, data.user_id)
    })

    rowOrderLinesPrio2.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex)

      if (this.debug) {
        console.log('drawOrderLine: start inside window, end outside')
        console.log(`order_pk=${lineData.order.order_pk}, ySlot=${ySlot}, startIndex=${lineData.startIndex}, endIndex=${lineData.endIndex}`)
      }

      // set y slots in all slots
      this.setYSlot(lineData.order.order_pk, ySlot, lineData.startIndex, lineData.endIndex)

      // draw the line
      this._drawOrderLine(lineData, ySlot, data.user_id)
    })

    rowOrderLinesPrio3.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex)

      if (this.debug) {
        console.log('drawOrderLine: start & end inside window, not same day')
        console.log(`order_pk=${lineData.order.order_pk}, ySlot=${ySlot}, startIndex=${lineData.startIndex}, endIndex=${lineData.endIndex}`)
      }

      // set y slots in all slots
      this.setYSlot(lineData.order.order_pk, ySlot, lineData.startIndex, lineData.endIndex)

      // draw the line
      this._drawOrderLine(lineData, ySlot, data.user_id)
    })

    rowOrderLinesPrio4.forEach(lineData => {
      if (this.debug) {
        console.log('drawOrderLine: start & end inside window, same day')
        console.log(`same day index: ${lineData.startIndex}, startPosX: ${lineData.startPosX}, endPosX: ${lineData.endPosX}`)
      }

      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex)

      // set y slots in all slots
      this.setYSlot(lineData.order.order_pk, ySlot, lineData.startIndex, lineData.endIndex)

      // draw the line
      this._drawOrderLine(lineData, ySlot, data.user_id)
    })

    // store info positions
    this.rowInfoPositions[this.lastY] = rowInfo.join(' ')

    // vertical lines
    const rowHeight = this.getRowHeight()
    this.ctx.beginPath()
    this.ctx.lineWidth = this.lineWidth
    this.ctx.strokeStyle = '#000'
    this.ctx.moveTo(1, this.lastY)
    this.ctx.lineTo(1, this.lastY + rowHeight)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.lineWidth = this.lineWidth
    this.ctx.strokeStyle = '#000'
    this.ctx.moveTo(this.slotWidth, this.lastY)
    this.ctx.lineTo(this.slotWidth, this.lastY + rowHeight)
    this.ctx.stroke()

    for (let x=this.slotWidth*2, i=1; x<this.width; x+=this.slotWidth, i++) {
      this.ctx.beginPath()
      this.ctx.strokeStyle = '#ccc'
      this.ctx.moveTo(x, this.lastY)
      this.ctx.lineTo(x, this.lastY + rowHeight)
      this.ctx.stroke()
    }

    // last vertical line
    this.ctx.beginPath()
    this.ctx.strokeStyle = '#000'
    this.ctx.moveTo(this.width-1, this.lastY)
    this.ctx.lineTo(this.width-1, this.lastY + rowHeight)
    this.ctx.stroke()

    if (this.debug) {
      console.log(`updating lastY (${this.lastY}) with height ${rowHeight}`)
    }
    this.lastY += rowHeight

    const shape = new Path2D()
    shape.moveTo(1, startY)
    shape.lineTo(1, this.lastY)
    shape.lineTo(this.width, this.lastY)
    shape.lineTo(this.width, startY)
    shape.closePath()

    const image = this.ctx.getImageData(this.slotWidth, startY, this.width-this.slotWidth, this.lastY - startY)

    this.userYPositions.push({
      hover: false,
      transImage: this.createTransparentImg(image),
      image,
      shape,
      start: startY,
      end: this.lastY,
      user_id: data.user_id,
      full_name: data.full_name,
      isEmpty: true
    })

    this.horizontalLine(this.lastY)
    if (this.debug) {
      console.log(`--- end drawing row for user`)
    }
  }

  getFontsize() {
    if (this.mode === COMPACT) {
      return this.fontsizeCompact
    }

    return this.fontsizeWide
  }

  getRowHeightInt() {
    if (this.mode === COMPACT) {
      return this.rowHeightCompact
    }

    return this.rowHeightWide
  }

  getYPadding() {
    if (this.mode === COMPACT) {
      return this.yPaddingCompact
    }

    return this.yPaddingWide
  }

  getOrderLineWidth() {
    if (this.mode === COMPACT) {
      return this.orderLineWidth
    }

    // we have 3 rows of fontsize height plus 4 x padding
    return 4 * this.getFontsize() + 5 * this.fontPaddingWide
  }

  getSlotHeight() {
    return this.orderLinePaddingTop + this.getOrderLineWidth() + this.orderLinePaddingBottom
  }

  getYPosForYSlot(ySlot) {
    return ySlot*this.getSlotHeight() + this.orderLinePaddingTop + 2
  }

  _drawOrderLine(lineData, ySlot, user_id) {
    if (this.mode == COMPACT) {
      this.drawOrderLine(lineData.startPosX, lineData.endPosX, ySlot, lineData.order, user_id)
    } else {
      this.drawOrderLineWide(lineData.startPosX, lineData.endPosX, ySlot, lineData.order, user_id)
    }
  }

  drawOrderLine(startX, endX, ySlot, order, user_id) {
    const yPos = this.getYPosForYSlot(ySlot) + this.lastY
    const status = order.assignedorder_status !== null ? order.assignedorder_status : order.order_status
    const color = my24.status2color(this.statuscodes, status)
    if (this.debug) {
      console.log(`yPos for line=${yPos}, lastY=${this.lastY}, ySlot=${ySlot}, color: ${color}, startX=${startX}, endX=${endX}`)
    }

    let path = new Path2D()
    this.ctx.lineWidth = this.getOrderLineWidth()
    this.ctx.strokeStyle = color
    path.moveTo(startX, yPos)
    path.lineTo(endX, yPos)
    this.ctx.stroke(path)

    this.hotspots.push({
      obj: path,
      order,
      user_id
    })
    if (this.debug) {
      console.log('drawOrderLine done')
    }
  }

  drawOrderLineWide(startX, endX, ySlot, order, user_id) {
    const yPos = this.getYPosForYSlot(ySlot) + this.lastY + this.getRowHeightInt() + 4
    const status = order.assignedorder_status !== null ? order.assignedorder_status : order.order_status
    const color = my24.status2color(this.statuscodes, status)
    if (this.debug) {
      console.log(`yPos for line=${yPos}, lastY=${this.lastY}, ySlot=${ySlot}, color: ${color}`)
    }

    /**   -------------------------
     *   | padding 1
     *   | OrderID
     *   | padding 2
     *   | Order name
     *   | padding 3
     *   | Order city
     *   | padding 4
     *   | Order type
     *   | padding 5
     *    -------------------------
     *
     **/

    let rgbString
    try {
      // draw the line with alpha to .2
      const rgb = this.hexToRgbA(color)
      rgbString = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, .2)`
    } catch (e) {
      // bad hex, fallback to normal color string
      rgbString = color
    }

    const path = new Path2D()
    this.ctx.lineWidth = this.getOrderLineWidth()
    this.ctx.strokeStyle = rgbString
    path.moveTo(startX, yPos + 6)
    path.lineTo(endX, yPos + 6)
    this.ctx.stroke(path)

    let textY = yPos + this.fontPaddingWide - this.getRowHeightInt() + 4

    this.setText(order.order_id, startX + 4, textY, endX - startX)

    textY += this.getFontsize() + this.fontPaddingWide
    this.setText(`${order.order_name.slice(0, 20)}`, startX + 4, textY, endX - startX)

    textY += this.getFontsize() + this.fontPaddingWide
    this.setText(`${order.order_city.slice(0, 20)}`, startX + 4, textY, endX - startX)

    textY += this.getFontsize() + this.fontPaddingWide
    this.setText(order.order_type, startX + 4, textY, endX - startX)

    this.hotspots.push({
      obj: path,
      order,
      user_id
    })
    if (this.debug) {
      console.log('drawOrderLineWide done')
    }
  }

  setText(text, xPosition, yPosition, maxWidth) {
    let fontsize = this.getFontsize()

    if (import.meta.env.JEST_WORKER_ID === undefined && this.ctx.measureText(text).width > maxWidth) {
      do {
        fontsize--
        this.ctx.font = `${fontsize}px ${this.fontface}`
      } while(fontsize > 10 && this.ctx.measureText(text).width > maxWidth)
    }

    this.ctx.font = `${fontsize}px ${this.fontface}`
    this.ctx.fillText(text, xPosition, yPosition)
    this.ctx.font = `${this.getFontsize()}px ${this.fontface}`
  }

  horizontalLine(yPosition) {
    this.ctx.beginPath()
    this.ctx.lineWidth = this.lineWidth
    this.ctx.strokeStyle = '#000'

    this.ctx.moveTo(0, yPosition)
    this.ctx.lineTo(this.width, yPosition)

    this.ctx.stroke()

    this.lastY += this.lineWidth
  }

  resetDayOrders() {
    for(let i=0; i<this.daysInView.length; i++) {
      this.daysInView[i].orders = []
    }
  }

  getRowHeight() {
    let max = 0
    for(let i=0; i<this.daysInView.length; i++) {
      if (this.daysInView[i].orders.length > max) {
        max = this.daysInView[i].orders.length
      }
    }

    const height = max * this.getSlotHeight()
    if (this.debug) {
      console.log(`max num slots=${max}, height=${height} (slotHeight=${this.getSlotHeight()})`)
    }

    return height > this.getRowHeightInt() ? height : this.getRowHeightInt()
  }

  setYSlot(orderPk, ySlot, startIndex, endIndex) {
    if (this.debug) {
      console.log(`setYSlot(${orderPk}, ySlot=${ySlot}, startIndex=${startIndex}, endIndex=${endIndex})`)
    }

    for(let i=startIndex; i<=endIndex; i++) {
      if (this.debug) {
        console.log(`${this.daysInView[i].dateFormated}, index=${i}`)
      }

      this.daysInView[i].orders[ySlot] = orderPk
    }
  }

  findEmptyYSlot(slotIndex) {
    if (this.debug) {
      console.log(`empty slot for index ${slotIndex}: ${this.daysInView[slotIndex].orders.length}`)
    }

    return this.daysInView[slotIndex].orders.length
  }

  getSlotsStartX() {
    return this.slotWidth + 1
  }

  getSlotsEndX() {
    return this.width - 2
  }

  getStartXPos(slotIndex) {
    // startXPos is slotWith*(slotIndex-1) + slotWidth/2 + this.startSlotPadding
    let startPos = this.getSlotsStartX() + this.slotWidth*slotIndex
    startPos += this.startSlotPadding

    return startPos
  }

  getEndXPos(slotIndex) {
    // endXPost is slotWith*(slotIndex-1) + slotWidth/2 - this.endSlotPadding
    let endPos = this.getSlotsStartX() + this.slotWidth*slotIndex
    endPos += this.slotWidth - this.endSlotPadding

    return endPos
  }

  getStartXPosSameDay(slotIndex) {
    return this.getSlotsStartX() + this.slotWidth*slotIndex + this.startSlotPadding
  }

  getEndXPosSameDay(slotIndex) {
    return this.getSlotsStartX() + this.slotWidth*slotIndex + this.slotWidth - this.endSlotPadding - 2
  }

  getEnd(orderPk, endDates) {
    for (const [date, orders] of Object.entries(endDates)) {
      for(let i=0; i<orders.length; i++) {
        if (orders[i].order_pk === orderPk) {
          return {
            date,
            orderData: orders[i]
          }
        }
      }
    }
  }

  overUser = {}

  createTransparentImg(image) {
    this.ctx.globalAlpha = .5
    const imageDataCopy = new ImageData(
      new Uint8ClampedArray(image.data),
      image.width,
      image.height
    )

    let imageData = imageDataCopy.data
    length = imageData.length

    for (let i=3; i < length; i+=4) {
      imageData[i-3] = imageData[i-3] + 100
      imageData[i-2] = imageData[i-2] + 100
      imageData[i-1] = imageData[i-1] + 100
      imageData[i] = 40
    }

    // after the manipulation, reset the data
    imageDataCopy.data.set(imageData)

    this.ctx.globalAlpha = 1
    return imageDataCopy
  }

  handleClick(e) {
    e.preventDefault()
    e.stopPropagation()

    const mouseX = parseInt(e.clientX - this.offsetX)
    const mouseY = parseInt(e.clientY - this.offsetY)

    if (this.component.assignMode) {
      this.checkOverUserClick(mouseX, mouseY)
    }

    for (let i=0; i<this.hotspots.length; i++) {
      const h = this.hotspots[i]

      if (this.inStroke(h.obj, mouseX, mouseY)) {
        this.component.selectedOrderUserId = h.user_id
        this.component.openActionsModal(h.order.order_pk)
      }
    }
  }

  handleMouseMove(e) {
    e.preventDefault()
    e.stopPropagation()

    const mouseX = parseInt(e.clientX - this.offsetX)
    const mouseY = parseInt(e.clientY - this.offsetY)

    if (this.component.assignMode) {
      this.userYPositions.forEach(position => position.hover = this.ctx.isPointInPath(position.shape, mouseX, mouseY))

      this.userYPositions.forEach(position => {
        if (position.hover || this.userAlreadySelected(position.user_id)) {
          this.ctx.putImageData(position.transImage, this.slotWidth, position.start)
        } else {
          this.ctx.putImageData(position.image, this.slotWidth, position.start)
        }
      })
    }

    this.ctx.clearRect(0, 0, this.cw, this.ch)

    let hit = false

    for (let i=0; i<this.hotspots.length; i++) {
      const h = this.hotspots[i]

      if (this.inStroke(h.obj, mouseX, mouseY)) {
        this.canvas.style.cursor = "pointer"
        this.showInfo(h.order.order_info, mouseX, mouseY)
        hit = true
      }
    }

    if (!hit) {
      this.hideTipCanvas()
      if (!this.component.assignMode) {
        this.canvas.style.cursor = "default"
      }
    }
  }

  hideTipCanvas() {
    this.tipCanvas.style.left = "-2000px"
  }

  showInfo(text, mouseX, mouseY) {
    const lines=text.split('\n')
    let maxLen = 0
    for (let i=0; i<lines.length; i++) {
      if (lines[i].length > maxLen) {
        maxLen = lines[i].length
      }
    }

    this.tipCanvas.width = maxLen * (this.getFontsize()-8) + 10
    this.tipCanvas.height = lines.length * this.getFontsize() + 5

    this.tipCanvas.style.left = (mouseX + 20) + "px"
    this.tipCanvas.style.top = (mouseY) + "px"
    this.tipCtx.clearRect(0, 0, this.tipCanvas.width, this.tipCanvas.height)

    for (let i=0, y=14; i<lines.length; i++) {
      this.tipCtx.fillText(lines[i], 5, y)
      y += this.getFontsize()
    }
  }

  checkOverUserClick(x, y) {
    const position = this.userYPositions.find(position => position.hover)

    if (this.userAlreadySelected(position.user_id)) {
      console.log('userAlreadySelected', this.userAlreadySelected(position.user_id))
      this.component.selectedUsers = this.component.selectedUsers.filter(user => user.user_id !== position.user_id)
    } else {
      console.log('NOT userAlreadySelected')
      this.component.selectedUsers.push({
        user_id: position.user_id,
        full_name: position.full_name
      })
      return
    }
  }

  userAlreadySelected(user_id) {
    return this.component.selectedUsers.find(user => user.user_id === user_id)
  }

  inStroke(obj, x, y) {
    const height = this.mode === COMPACT ? 5 : this.getRowHeight() + 10
    for(let i=-1*height; i<height; i++) {
      if (this.ctx.isPointInStroke(obj, x+i, y+i)) {
        return true
      }
    }
  }

  hexToRgbA(hex){
    var c
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
      c = hex.substring(1).split('')
      if (c.length== 3){
          c= [c[0], c[0], c[1], c[1], c[2], c[2]];
      }
      c = '0x' + c.join('')
      return {
        r: (c>>16)&255,
        g: (c>>8)&255,
        b: c&255
      }
      // return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+',1)';
    }
    throw new Error('Bad Hex');
  }

  timeForward() {
    this.startDate.add(1, 'days')
    this.setStartDateComponent()
  }

  timeForwardWeek() {
    this.startDate.add(7, 'days')
    this.setStartDateComponent()
  }

  timeBack() {
    this.startDate.subtract(1, 'days')
    this.setStartDateComponent()
  }

  timeBackWeek() {
    this.startDate.subtract(7, 'days')
    this.setStartDateComponent()
  }

  getCurrentDate() {
    return this.startDate.format('YYYY-MM-DD')
  }

  getEndDate() {
    return this.endDate.format('YYYY-MM-DD')
  }
}

export default Dispatch
