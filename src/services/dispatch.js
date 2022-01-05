import axios from 'axios'

import my24 from '@/services/my24'


class Dispatch {
  rowHeight = 24
  numSlots = 6
  fontface = 'Helvetica Neue'
  fontsize = 14
  xPadding = 4
  yPadding = 14
  endSlotPadding = 4
  startSlotPadding = 4
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

	monday = window.locale === 'en' ? 1 : 0
  // monday = 1
  numDays = 5
  startDate
  endDate = null
  daysInView = []
  dateToIndex = {}
  userYPositions = []

  debug = false

  statuscodes = null

  url = '/company/dispatch-assignedorders-user-list-v2/'

  constructor(canvas, tipCanvas, statuscodes, component) {
    this.canvas = canvas
    this.tipCanvas = tipCanvas
    this.component = component
    this.tipCtx = tipCanvas.getContext("2d")
    this.ctx = canvas.getContext('2d')

	  this.width = canvas.clientWidth
	  this.slotWidth = this.width/this.numSlots
    this.statuscodes = statuscodes

    this.startDate = component.$moment().weekday(this.monday)
  }

  setSearchQuery(query) {
    this.searchQuery = query
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
          this.ctx.fillRect(x, y, w, h); // will redraw the area each time
          i++
          if(i === steps) { // stop if done
            clearInterval(interval)
            resolve()
          }
        }, 20);
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
          this.ctx.fillRect(x, y, w, h); // will redraw the area each time
          i++
          if(i === steps) { // stop if done
            clearInterval(interval)
            resolve()
          }
        }, 30);
      })
  }


  loadToday() {
    this.startDate = this.component.$moment().weekday(this.monday)
    this.drawDispatch()
  }

  drawDispatch() {
    this.component.showOverlay = true
    this.fetchData().then((results) => {
      this.canvas.height = results.data.length * this.rowHeight + 300;

      this.component.showOverlay = true

      this.lastY = 1
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.hotspots = []

      this.reOffset()
      this.setDates()
      this.drawHeader()

      this.reOffset()
      this.createUserRows(results.data)

      this.component.showOverlay = false
    }).catch((error) => {
      this.component.showOverlay = false
      console.log('error fetching dispatch data', error)
      this.component.flashMessage.show({
        status: 'error',
        title: this.component.$trans('Error'),
        message: this.component.$trans('Error loading dispatch data')
      })
    })
  }

  setStartDate(dateString) {
    this.startDate = this.component.$moment(dateString, 'YYYY/MM/DD')
  }

  setStartDateComponent() {
    this.component.startDate = this.startDate.toDate();
  }

  reOffset() {
    const BB = this.canvas.getBoundingClientRect();
    this.offsetX = BB.left;
    this.offsetY = BB.top;
  }

  setDates() {
    this.daysInView = [];
    this.dateToIndex = [];

    for (let date=this.startDate.clone(), i=0; i<this.numDays; i++) {
    	const dateFormated = date.format('YYYY-MM-DD');
    	const dateHeader = i === 0 ? date.format('ddd DD/MM, [week] W') : date.format('ddd DD/MM'); // display week in first column

      this.daysInView.push({
      	dateFormated,
      	dateHeader,
        orders: []
      });

      this.dateToIndex[dateFormated] = i;

      date.add(1, 'days');
	    this.endDate = date;
    }
  }

  drawHeader() {
    // horizontal header line
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = '#000';

    this.ctx.moveTo(this.slotWidth-1, this.lastY);
    this.ctx.lineTo(this.width, this.lastY);

    this.lastY += 1;

    for (let x=this.slotWidth, i=0; x<this.width; x+=this.slotWidth, i++) {
      this.ctx.moveTo(x, this.lastY);
      this.ctx.lineTo(x, this.lastY + this.rowHeight);

      this.setText(this.daysInView[i].dateHeader, x+this.xPadding, this.yPadding, this.slotWidth-this.xPadding);
    }

    // last vertical line
    this.ctx.moveTo(this.width-1, this.lastY);
    this.ctx.lineTo(this.width-1, this.lastY + this.rowHeight);

    this.lastY += 1;

    this.lastY += this.rowHeight;

    this.ctx.stroke();

    this.horizontalLine(this.lastY);
  }

  fetchData() {
    const url = `${this.url}?start_date=${this.getCurrentDate()}`;

    return new Promise((resolve, reject) => {
      axios.get(url)
        .then((response) => {
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    })
  }

  createUserRows(data) {
    for (let i=0; i<data.length; i++) {
      if (this.debug) {
        console.log(`creating row for ${data[i].full_name}, lastY=${this.lastY}`);
      }
      this.createUserRow(data[i]);

      if (this.debug) {
        break;
      }
    }

    if (this.debug) {
      for(let i=0; i<this.daysInView.length; i++) {
        console.log(`${this.daysInView[i].dateFormated}`, this.daysInView[i].orders);
      }
    }
  }

  createUserRow(data) {
    const startY = this.lastY;
    let rowInfo = []

    this.resetDayOrders();
    this.setText(data.full_name, 1+this.xPadding, this.lastY+this.yPadding, this.slotWidth);
    rowInfo.push(data.full_name)

    for (const [date, orders] of Object.entries(data.assignedorders.start)) {
      for(let i=0; i<orders.length; i++) {
        // fill searchable info
        rowInfo.push(orders[i].order_pk)
        rowInfo.push(orders[i].assignedorder_status)
        rowInfo.push(orders[i].order_status)
        rowInfo.push(orders[i].order_info)

        const endOrder = this.getEnd(orders[i].order_pk, data.assignedorders.end);
        if (this.debug) {
          console.log(`order ${orders[i].order_pk}, start: ${date}, end: ${endOrder.date}`);
        }

        // start outside window, end within
        if (!(date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          const endIndex = this.dateToIndex[endOrder.date];
          const startPosX = this.getSlotsStartX();
          const endPosX = this.getEndXPos(endIndex);

          // find an empty slot in index 0
          const ySlot = this.findEmptyYSlot(0);

          // set y slots in all slots
          this.setYSlot(orders[i].order_pk, ySlot, 0, endIndex);

          // draw the line
          this.drawOrderLine(startPosX, endPosX, ySlot, orders[i], data.user_id);
        }

        // start inside window, end outside
        else if ((date in this.dateToIndex) && !(endOrder.date in this.dateToIndex)) {
          const startIndex = this.dateToIndex[date];
          const startPosX = this.getStartXPos(startIndex);
          const endPosX = this.getSlotsEndX();

          // find an empty slot
          const ySlot = this.findEmptyYSlot(startIndex);

          // set y slots in all slots
          this.setYSlot(orders[i].order_pk, ySlot, startIndex, this.numSlots-2);

          // draw the line
          this.drawOrderLine(startPosX, endPosX, ySlot, orders[i], data.user_id);
        }

        // start & end inside window
        else if ((date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          // same day
          if (date === endOrder.date) {
            const index = this.dateToIndex[date];

            const startPosX = this.getStartXPosSameDay(index);
            const endPosX = this.getEndXPosSameDay(index);
            if (this.debug) {
              console.log(`same day index: ${index}, startPosX: ${startPosX}, endPosX: ${endPosX}`);
            }

            // find an empty slot
            const ySlot = this.findEmptyYSlot(index);

            // set y slots in all slots
            this.setYSlot(orders[i].order_pk, ySlot, index, index);

            // draw the line
            this.drawOrderLine(startPosX, endPosX, ySlot, orders[i], data.user_id);
          } else {
            const startIndex = this.dateToIndex[date];
            const endIndex = this.dateToIndex[endOrder.date];
            const startPosX = this.getStartXPos(startIndex);
            const endPosX = this.getEndXPos(endIndex);

            // find an empty slot
            const ySlot = this.findEmptyYSlot(startIndex);

            // set y slots in all slots
            this.setYSlot(orders[i].order_pk, ySlot, startIndex, endIndex);

            // draw the line
            this.drawOrderLine(startPosX, endPosX, ySlot, orders[i], data.user_id);
          }

        }
      } // for orders.length
    } // for data.assignedorders.start

    // store info positions
    this.rowInfoPositions[this.lastY] = rowInfo.join(' ')

    // vertial lines
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = '#000';

    for (let x=0, i=0; x<this.width; x+=this.slotWidth, i++) {
      this.ctx.moveTo(x, this.lastY);
      this.ctx.lineTo(x, this.lastY + this.getRowHeight());
    }

    // last vertical line
    this.ctx.moveTo(this.width-1, this.lastY);
    this.ctx.lineTo(this.width-1, this.lastY + this.getRowHeight());

    this.ctx.stroke();

    this.lastY += this.getRowHeight();

    this.userYPositions.push({
      start: startY,
      end: this.lastY,
      user_id: data.user_id,
      full_name: data.full_name,
      isEmpty: true
    });

    this.horizontalLine(this.lastY);
  }

  getSlotHeight() {
    return this.orderLinePaddingTop + this.orderLineWidth + this.orderLinePaddingBottom;
  }

  getYPosForYSlot(ySlot) {
    return ySlot*this.getSlotHeight() + this.orderLinePaddingTop + 2;
  }

  drawOrderLine(startX, endX, ySlot, order, user_id) {
    const yPos = this.getYPosForYSlot(ySlot) + this.lastY
    const status = order.assignedorder_status !== null ? order.assignedorder_status : order.order_status
    const color = my24.status2color(this.statuscodes, status)
    if (this.debug) {
      console.log(`yPos for line=${yPos}, lastY=${this.lastY}, ySlot=${ySlot}, color: ${color}`);
    }

    let path = new Path2D()
    this.ctx.lineWidth = this.orderLineWidth
    this.ctx.strokeStyle = color
    path.moveTo(startX, yPos)
    path.lineTo(endX, yPos)
    this.ctx.stroke(path)

    this.hotspots.push({
      obj: path,
      order,
      user_id
    })
  }

  setText(text, xPosition, yPosition, maxWidth) {
    let fontsize = this.fontsize;

    if (process.env.JEST_WORKER_ID === undefined && this.ctx.measureText(text).width > maxWidth) {
      do {
        fontsize--;
        this.ctx.font = `${fontsize}px ${this.fontface}`;
      } while(this.ctx.measureText(text).width > maxWidth);
    }

    this.ctx.fillText(text, xPosition, yPosition);
  }

  horizontalLine(yPosition) {
    this.ctx.beginPath();
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = '#000';

    this.ctx.moveTo(0, yPosition);
    this.ctx.lineTo(this.width, yPosition);

    this.ctx.stroke();

    this.lastY += this.lineWidth;
  }

  resetDayOrders() {
    for(let i=0; i<this.daysInView.length; i++) {
      this.daysInView[i].orders = [];
    }
  }

  getRowHeight() {
    let max = 0;
    for(let i=0; i<this.daysInView.length; i++) {
      if (this.daysInView[i].orders.length > max) {
        max = this.daysInView[i].orders.length;
      }
    }

    const height = max * this.getSlotHeight();
    if (this.debug) {
      console.log(`max num slots=${max}, height=${height} (slotHeight=${this.getSlotHeight()}`);
    }

    return height > this.rowHeight ? height : this.rowHeight;
  }

  setYSlot(orderPk, ySlot, startIndex, endIndex) {
    if (this.debug) {
      console.log(`setYSlot(${orderPk}, ${ySlot}, ${startIndex}, ${endIndex})`);
    }
    for(let i=startIndex; i<=endIndex; i++) {
      if (this.debug) {
        console.log(`${this.daysInView[i].dateFormated}, i=${i}`);
      }
      this.daysInView[i].orders[ySlot] = orderPk;
    }
  }

  findEmptyYSlot(slotIndex) {
    if (this.debug) {
      console.log(`empty slot for ${slotIndex}: ${this.daysInView[slotIndex].orders.length}`);
    }

    return this.daysInView[slotIndex].orders.length;
  }

  getSlotsStartX() {
    return this.slotWidth + 1;
  }

  getSlotsEndX() {
    return this.width - 1;
  }

  getStartXPos(slotIndex) {
    // startXPos is slotWith*(slotIndex-1) + slotWidth/2 + this.startSlotPadding
    let startPos = this.getSlotsStartX() + this.slotWidth*(slotIndex);
    startPos += (this.slotWidth/2) + this.startSlotPadding;

    return startPos;
  }

  getEndXPos(slotIndex) {
    // endXPost is slotWith*(slotIndex-1) + slotWidth/2 - this.endSlotPadding
    let endPos = this.getSlotsStartX() + this.slotWidth*(slotIndex);
    endPos += (this.slotWidth/2) - this.endSlotPadding;

    return endPos;
  }

  getStartXPosSameDay(slotIndex) {
    return this.getSlotsStartX() + this.slotWidth*slotIndex + this.startSlotPadding;
  }

  getEndXPosSameDay(slotIndex) {
    return this.getSlotsStartX() + this.slotWidth*slotIndex + this.slotWidth - this.endSlotPadding;
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

  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    const mouseX = parseInt(e.clientX - this.offsetX);
    const mouseY = parseInt(e.clientY - this.offsetY);

    if (this.component.assignMode) {
      this.checkOverUserClick(mouseX, mouseY);
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
    e.preventDefault();
    e.stopPropagation();

    const mouseX = parseInt(e.clientX - this.offsetX);
    const mouseY = parseInt(e.clientY - this.offsetY);

    if (this.component.assignMode) {
      this.checkOverUser(mouseX, mouseY);
    }

    this.ctx.clearRect(0, 0, this.cw, this.ch);

    let hit = false;

    for (let i=0; i<this.hotspots.length; i++) {
      const h = this.hotspots[i];

      if (this.inStroke(h.obj, mouseX, mouseY)) {
        this.canvas.style.cursor = "pointer"
        this.showInfo(h.order.order_info, mouseX, mouseY);
        hit = true;
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
    this.tipCanvas.style.left = "-2000px";
  }

  showInfo(text, mouseX, mouseY) {
    this.tipCanvas.style.left = (mouseX + 20) + "px";
    this.tipCanvas.style.top = (mouseY) + "px";
    this.tipCtx.clearRect(0, 0, this.tipCanvas.width, this.tipCanvas.height);

    for (let i=0, y=14, lines=text.split('\n'); i<lines.length; i++) {
      this.tipCtx.fillText(lines[i], 5, y);
      y += this.fontsize;
    }
  }

  checkOverUser(x, y) {
    const startX = 1;
    const endX = startX + this.slotWidth;

    if (x < startX || x > endX) {
      // only loop if not all empty
      this.canvas.style.cursor = "default"

      if (this.overUserLineAllEmpty) {
        return;
      }

      for (let i=0; i<this.userYPositions.length; i++) {
        if (!this.userYPositions[i].isEmpty) {
          const yData = this.userYPositions[i];
          const lineStartY = yData.start + this.overUserLinePaddingTop;
          const lineEndY = yData.end - this.overUserLinePaddingBottom;
          this.drawOverUserLine(lineStartY, lineEndY, 'white');
          this.userYPositions[i].isEmpty = true;
          this.canvas.style.cursor = "default"
        }
      }

      this.overUserLineAllEmpty = true;

      return;
    }

    for (let i=0; i<this.userYPositions.length; i++) {
      const yData = this.userYPositions[i]
      const lineStartY = yData.start + this.overUserLinePaddingTop
      const lineEndY = yData.end - this.overUserLinePaddingBottom

      let color = 'white'
      if (y > yData.start && y < yData.end) {
        this.canvas.style.cursor = "pointer"
        color = 'red'
      }

      this.drawOverUserLine(lineStartY, lineEndY, color)

      if (color === 'red') {
        this.overUserLineAllEmpty = false
        this.userYPositions[i].isEmpty = false
      }
    }
  }

  checkOverUserClick(x, y) {
    const startX = 1;
    const endX = startX + this.slotWidth;

    if (x < startX || x > endX) {
      return;
    }

    for (let i=0; i<this.userYPositions.length; i++) {
      const yData = this.userYPositions[i];

      if (y > yData.start && y < yData.end) {
        if (!this.userAlreadySelected(yData.user_id)) {
          if (this.debug) {
            console.log(`adding ${yData.full_name} to selectedUsers`);
          }
          this.component.selectedUsers.push({
            user_id: yData.user_id,
            full_name: yData.full_name
          });
        }
      }
    }
  }

  userAlreadySelected(user_id) {
    for( let i=0; i<this.component.selectedUsers.length; i++) {
      if (this.component.selectedUsers[i].user_id === user_id) {
        return true
      }
    }

    return false
  }

  drawOverUserLine(startY, endY, color, alpha) {
    const startX = this.slotWidth - this.overUserLinePaddingRight
    const endX = this.slotWidth - this.overUserLinePaddingRight
    let path = new Path2D()
    this.ctx.lineWidth = this.overUserLineWidth
    this.ctx.strokeStyle = this.getRgba(color, alpha)
    path.moveTo(startX, startY)
    path.lineTo(endX, endY)
    this.ctx.stroke(path)
  }

  inStroke(obj, x, y) {
    for(let i=-5; i<5; i++) {
      if (this.ctx.isPointInStroke(obj, x+i, y+i)) {
        return true
      }
    }
  }

  getRgba(colorString, alpha) {
    if (!alpha) {
      alpha = 1
    }

    if (colorString === 'red') {
      return `rgba(255, 0, 0, ${alpha})`
    }

    if (colorString === 'white') {
      return `rgba(0, 0, 0, ${alpha})`
    }

    if (colorString === 'black') {
      return `rgba(255, 255, 255, ${alpha})`
    }

    throw(`unknow color: ${colorString}`)
  }

  timeForward() {
    this.startDate.add(1, 'days');
    this.setStartDateComponent();
  }

  timeForwardWeek() {
    this.startDate.add(7, 'days');
    this.setStartDateComponent();
  }

  timeBack() {
    this.startDate.subtract(1, 'days');
    this.setStartDateComponent();
  }

  timeBackWeek() {
    this.startDate.subtract(7, 'days');
    this.setStartDateComponent();
  }

  getCurrentDate() {
    return this.startDate.format('YYYY-MM-DD');
  }

  getEndDate() {
    return this.endDate.format('YYYY-MM-DD');
  }
}

export default Dispatch;
