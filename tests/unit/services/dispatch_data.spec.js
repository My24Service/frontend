import axios from "axios";
import { expect } from 'chai'
import DispatchData from '@/services/dispatch_data'
import dispatchData from '../fixtures/dispatch_dates'

jest.mock('axios')


describe('dispatch service', () => {
  it('exists',() => {
    axios.get.mockResolvedValueOnce(dispatchData);
    const dispatch = new DispatchData(1, '2023/11/20')
    const userRows = dispatch.createUserRows(dispatchData.data)
    // console.log(JSON.stringify(userRows))

    expect(userRows.length).to.equal(1) // 24468
    expect(dispatch.daysInView[2].orders.indexOf(24468)).not.to.equal(-1)
  })

})
