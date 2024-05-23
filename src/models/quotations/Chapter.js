import BaseModel from '../../models/base'
import priceMixin from "../../mixins/price";


class ChapterModel {
  id
  quotation
  name
  description

  lines = []
  costs = []

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
  url = '/quotation/chapter/'
  listArgs = []
}

export { ChapterService, ChapterModel }
