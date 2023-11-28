import moment from 'moment/min/moment-with-locales'

class DispatchData {
  // we should move to using this for creating an array of items that need to be rendered
  // only used in a test right now
  startDate
  endDate
  daysInView
  dateToIndex
  numDays = 5
  numSlots = 6
  debug = false

  constructor(monday, dateString) {
    if (!dateString) {
      this.startDate = moment().weekday(monday)
    } else {
      this.startDate = moment(dateString, 'YYYY/MM/DD')
    }

    this.setDates()
  }

  setDates() {
    this.daysInView = []
    this.dateToIndex = []

    for (let date=this.startDate.clone(), i=0; i<this.numDays; i++) {
      const dateFormatted = date.format('YYYY-MM-DD')
      const dateHeader = i === 0 ? date.format('ddd DD/MM, [week] W') : date.format('ddd DD/MM') // display week in first column

      this.daysInView.push({
        dateFormatted: dateFormatted,
        dateHeader,
        orders: []
      })

      this.dateToIndex[dateFormatted] = i

      date.add(1, 'days')
      this.endDate = date
    }
  }

  createUserRows(data) {
    let result = []
    for (let i=0; i<data.length; i++) {
      result.push(this.createUserRow(data[i], i))
    }

    return result
  }

  createUserRow(data, index) {
    // this.resetDayOrders()

    // prio 1 = start outside, end within window
    // prio 2 = start inside, end outside window
    // prio 3 = start/end inside window
    // prio 4 = same day
    // prio 5 = start/end outside window
    let result = {
      start_outside_end_within: [],
      start_inside_end_outside: [],
      start_end_inside: [],
      same_day: [],
      start_end_outside: []
    }

    const format = 'YYYY-MM-DD'

    const startDateView = moment(this.startDate.format(format))
    const endDateView = moment(this.endDate.format(format)).subtract(1, 'days')

    for (const [date, orders] of Object.entries(data.assignedorders.start)) {
      for(let i=0; i<orders.length; i++) {
        const endOrder = this.getEnd(orders[i].order_pk, data.assignedorders.end)
        const startDateOrder = moment(moment(date).format(format))
        const endDateOrder = moment(endOrder.date)

        // start outside window, end within
        if (startDateOrder.isBefore(startDateView) && endDateOrder.isSameOrBefore(endDateView)) {
          result.start_outside_end_within.push({
            order: orders[i],
            startIndex: 0,
            endIndex: this.dateToIndex[endOrder.date],
          })
        }

          // start inside window, end outside
        // else if ((date in this.dateToIndex) && !(endOrder.date in this.dateToIndex)) {
        else if (startDateOrder.isSameOrAfter(startDateView) && endDateOrder.isAfter(endDateView)) {
          result.start_inside_end_outside.push({
            order: orders[i],
            startIndex: this.dateToIndex[date],
            endIndex: this.numSlots-2,
          })
        }

        // start & end inside window
        else if (startDateOrder.isSameOrAfter(startDateView) && endDateOrder.isSameOrBefore(endDateView)) {
          // else if ((date in this.dateToIndex) && (endOrder.date in this.dateToIndex)) {
          // not same day
          if (date !== endOrder.date) {
            result.start_end_inside.push({
              order: orders[i],
              startIndex: this.dateToIndex[date],
              endIndex: this.dateToIndex[endOrder.date],
            })
          } else {
            // console.log(`same day date: ${date}`, orders[i])
            result.same_day.push({
              order: orders[i],
              startIndex: this.dateToIndex[date],
              endIndex: this.dateToIndex[date],
            })
          }
          // start & end outside window
        } else if (startDateOrder.isBefore(startDateView) && endDateOrder.isAfter(endDateView)) {
          result.start_end_outside.push({
            order: orders[i],
            startIndex: 0,
            endIndex: this.numSlots-2,
          })
        } else  {
          throw "HELP"
          // console.log('adding same_day (same day)')
          // same_day.push({
          //   order: orders[i],
          //   startIndex: this.dateToIndex[date],
          //   endIndex: this.dateToIndex[date],
          //   startPosX: this.getStartXPosSameDay(this.dateToIndex[date]),
          //   endPosX: this.getEndXPosSameDay(this.dateToIndex[date]),
          // })
          // } else {
          //   console.error('HELP unknown mode')
        }
      } // for orders.length
    } // for data.assignedorders.start

    // draw order lines
    result.start_outside_end_within.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex, lineData.endIndex, lineData.order.assignedorder_pk)

      // set slot in all slots
      this.setYSlot(lineData.order.assignedorder_pk, ySlot, lineData.startIndex, lineData.endIndex)
    })

    result.start_inside_end_outside.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex, lineData.endIndex, lineData.order.assignedorder_pk)

      // set slot in all slots
      this.setYSlot(lineData.order.order_id, ySlot, lineData.startIndex, lineData.endIndex)
    })

    result.start_end_inside.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex, lineData.endIndex, lineData.order.assignedorder_pk)

      // set slot in all slots
      this.setYSlot(lineData.order.assignedorder_pk, ySlot, lineData.startIndex, lineData.endIndex)
    })

    result.same_day.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex, lineData.endIndex, lineData.order.assignedorder_pk)

      // set slot in all slots
      this.setYSlot(lineData.order.assignedorder_pk, ySlot, lineData.startIndex, lineData.endIndex)
    })

    result.start_end_outside.forEach(lineData => {
      // find an empty slot
      const ySlot = this.findEmptyYSlot(lineData.startIndex, lineData.endIndex, lineData.order.assignedorder_pk)

      // set slot in all slots
      this.setYSlot(lineData.order.assignedorder_pk, ySlot, lineData.startIndex, lineData.endIndex)
    })

    // console.log(this.daysInView)

    return result
  }

  resetDayOrders() {
    for(let i=0; i<this.daysInView.length; i++) {
      this.daysInView[i].orders = []
    }
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

  setYSlot(assigned_order_id, ySlot, startIndex, endIndex) {
    if (this.debug) {
      console.log(`setYSlot(assigned_order_id=${assigned_order_id}, ySlot=${ySlot}, startIndex=${startIndex}, endIndex=${endIndex})`)
    }

    for(let i=startIndex; i<=endIndex; i++) {
      if (this.daysInView[i].orders[ySlot] !== undefined) {
        console.log(`HELP ITS NOT EMPTY!! ${assigned_order_id}, i=${i}`)
      }
      this.daysInView[i].orders[ySlot] = assigned_order_id
    }
  }

  findEmptyYSlot(startIndex, endIndex, assigned_order_id) {
    if (this.debug) {
      console.log(`findEmptyYSlot(startIndex=${startIndex}, endIndex=${endIndex}, assigned_order_id=${assigned_order_id})`)
    }

    if (!(startIndex in this.daysInView) || !(endIndex in this.daysInView)) {
      if (this.debug) {
        console.log(`startIndex=${startIndex}, or endIndex=${endIndex} not in daysInView`)
      }
      return
    }

    let freeSlot = 0
    let found = false

    // check if empty
    while(!found) {
      let isEmpty = true
      for(let i=startIndex; i<=endIndex; i++) {
        if (this.daysInView[i].orders[freeSlot] !== undefined) {
          isEmpty = false
        }
      }

      if (isEmpty) {
        found = true
        break
      } else {
        freeSlot++
      }
    }

    if (this.debug) {
      console.log(`findEmptyYSlot: startIndex=${startIndex}, endIndex=${endIndex}, freeSlot=${freeSlot}`)
    }
    return freeSlot
  }
}

export default DispatchData
