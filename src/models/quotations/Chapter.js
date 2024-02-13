import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";


class ChapterModel {
  id
  quotation
  name
  description

  constructor(chapter) {
    for (const [k, v] of Object.entries(chapter)) {
      this[k] = v
    }
  }
}

Object.assign(ChapterModel.prototype, priceMixin);

class ChapterService extends BaseModel {
  model = ChapterModel
  collection = []
  fields = {
    id: null,
    quotation: null,
    name: null,
    description: null
  }
  url = '/quotation/chapter/'
  listArgs = []
}

export default new ChapterService()

export { ChapterService, ChapterModel }
