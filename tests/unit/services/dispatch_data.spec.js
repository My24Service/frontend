import axios from "axios";
import { describe, expect, vi, test } from 'vitest'
import DispatchData from '@/services/dispatch_data'
import dispatchResponse from '../fixtures/dispatch_dates'

vi.mock('axios')


describe('dispatch data class', () => {
  test('has correct data',() => {
    const dispatchData = new DispatchData(
      1, '2023/11/20', dispatchResponse.data)
    console.log(JSON.stringify(dispatchData.userRows))

    expect(dispatchData.userRows.length).to.equal(1) // 24468
    expect(dispatchData.daysInView[2].orders.indexOf(24468)).not.to.equal(-1)
  })

})
