import client from '@/services/api'
import BaseModel from "@/models/base";
import type {
  AuthorizeResponse,
  CheckTokenResponse,
  Config,
  CreateLinkResponse,
  Department,
  Enabled,
  InvoiceTemplate,
  PaginatedProductCategoryList,
  PaginatedTaxRateList,
  Product,
  ProductCategoryJson,
  ProductList,
  StatusOkResponse,
  TeamleaderProductCreateRequest,
  TravelHoursProduct,
  WorkHoursProduct,
} from '@/api/types.gen'

/** What the reset endpoints tally. An empty object means there was no valid token. */
export interface TeamleaderResetResult {
  delete_result?: unknown[]
  created?: number
}

/**
 * The product-list and product-detail endpoints pass Teamleader's own answer
 * through, which the API schema therefore types as an open object. These are
 * the parts of Teamleader's product shapes this client reads.
 */
export interface TeamleaderProductSummary {
  id: string
  name: string
  code: string
  description: string
}

export interface TeamleaderPrice {
  amount: string
  currency: string
}

export interface TeamleaderProductDetail {
  name: string
  code: string
  description: string
  product_category_detail: { name: string }
  purchase_price: TeamleaderPrice | null
  selling_price: TeamleaderPrice | null
  tax_detail: { rate: string }
  added_at: string
  updated_at: string
}

/** The create-and-link body: the generated request plus the prices' currency. */
export type TeamleaderCreateLinkRequest = TeamleaderProductCreateRequest & {
  purchase_price_currency?: string
  selling_price_currency?: string
}

class TeamleaderService extends BaseModel {
  axios = client
  base_url = 'teamleader'
  config: Config | null = null

  async oauthPost(code: string, state: string): Promise<StatusOkResponse> {
    const data = { code, state }
    const url = `${this.base_url}/oauth/`

    return this.axios.post<StatusOkResponse>(url, data).then(response => response.data)
  }

  async configDetail(): Promise<Config> {
    const url = `${this.base_url}/config/`

    const result = await this.axios.get<Config>(url)
    this.config = result.data

    return result.data
  }

  async departmentList(): Promise<Record<string, unknown>> {
    const url = `${this.base_url}/department/`

    return this.axios.get<Record<string, unknown>>(url).then(response => response.data)
  }

  async invoiceDocumentTemplateList(): Promise<Record<string, unknown>> {
    const url = `${this.base_url}/invoice-document-template/`

    return this.axios.get<Record<string, unknown>>(url).then(response => response.data)
  }

  async authorize(): Promise<AuthorizeResponse> {
    const data = {}
    const url = `${this.base_url}/authorize/`

    return this.axios.post<AuthorizeResponse>(url, data).then(response => response.data)
  }

  async emptyTokens(): Promise<StatusOkResponse> {
    const data = {}
    const url = `${this.base_url}/empty-tokens/`

    return this.axios.post<StatusOkResponse>(url, data).then(response => response.data)
  }

  async checkTokens(): Promise<CheckTokenResponse> {
    const data = {}
    const url = `${this.base_url}/check-tokens/`

    return this.axios.post<CheckTokenResponse>(url, data).then(response => response.data)
  }

  async updateInvoiceDocumentTemplateSetting(templateUuid: string, name: string): Promise<InvoiceTemplate> {
    const data = {
      invoice_template_uuid: templateUuid,
      invoice_template_name: name
    }
    const url = `${this.base_url}/update-invoice-document-template/`

    return this.axios.patch<InvoiceTemplate>(url, data).then(response => response.data)
  }

  async updateDepartmentSetting(departmentUuid: string, name: string): Promise<Department> {
    const data = {
      department_uuid: departmentUuid,
      department_name: name,
    }
    const url = `${this.base_url}/update-department/`

    return this.axios.patch<Department>(url, data).then(response => response.data)
  }

  async updateWorkHoursProduct(id: string, name: string): Promise<WorkHoursProduct> {
    const data = {
      workhours_product_uuid: id,
      workhours_product_name: name,
    }
    const url = `${this.base_url}/work-hours-product/`

    return this.axios.patch<WorkHoursProduct>(url, data).then(response => response.data)
  }

  async updateTravelHoursProduct(id: string, name: string): Promise<TravelHoursProduct> {
    const data = {
      travel_hours_product_uuid: id,
      travel_hours_product_name: name,
    }
    const url = `${this.base_url}/travel-hours-product/`

    return this.axios.patch<TravelHoursProduct>(url, data).then(response => response.data)
  }

  async updateEnabled(enabled: boolean): Promise<Enabled> {
    const data = {
      'api_enabled': enabled
    }

    const url = `${this.base_url}/update-enabled/`

    return this.axios.patch<Enabled>(url, data).then(response => response.data)
  }

  async fetchTaxRates(): Promise<PaginatedTaxRateList> {
    const url = `${this.base_url}/tax-rate/`

    return this.axios.get<PaginatedTaxRateList>(url).then(response => response.data)
  }

  async resetTaxRates(): Promise<TeamleaderResetResult> {
    const url = `${this.base_url}/tax-rate-reset/`

    return this.axios.post<TeamleaderResetResult>(url, {}).then(response => response.data)
  }

  async fetchProductCategories(): Promise<PaginatedProductCategoryList> {
    const url = `${this.base_url}/product-category/`

    return this.axios.get<PaginatedProductCategoryList>(url).then(response => response.data)
  }

  async resetProductCategories(): Promise<TeamleaderResetResult> {
    const url = `${this.base_url}/product-category-reset/`

    return this.axios.post<TeamleaderResetResult>(url, {}).then(response => response.data)
  }

  async updateProductCategory(product_category_uuid: string): Promise<ProductCategoryJson> {
    const data = {
      product_category_uuid
    }
    console.log({data})

    const url = `${this.base_url}/update-product-category/`

    return this.axios.patch<ProductCategoryJson>(url, data).then(response => response.data)
  }

  async fetchBusinessTypes(): Promise<Record<string, unknown>> {
    const url = `${this.base_url}/business-type-list/`

    return this.axios.get<Record<string, unknown>>(url).then(response => response.data)
  }


  async fetchProducts(query: string | null): Promise<TeamleaderProductSummary[]> {
    let url = `${this.base_url}/product-list/`
    if (query) {
      url = `${url}?query=${query}`
    }

    return this.axios.get<TeamleaderProductSummary[]>(url).then(response => response.data)
  }

  async fetchProductDetail(id: string): Promise<TeamleaderProductDetail> {
    const url = `${this.base_url}/product-detail/?id=${id}`

    return this.axios.get<TeamleaderProductDetail>(url).then(response => response.data)
  }

  async createLinkProduct(data: TeamleaderCreateLinkRequest): Promise<CreateLinkResponse> {
    const url = `${this.base_url}/tl-product-create-link/`

    return this.axios.post<CreateLinkResponse>(url, data).then(response => response.data)
  }

  async linkProduct(data: TeamleaderProductCreateRequest): Promise<Product> {
    const url = `${this.base_url}/tl-product-create/`

    return this.axios.post<Product>(url, data).then(response => response.data)
  }

  async fetchTeamleaderProducts(ids: number[]): Promise<ProductList[]> {
    const url = `${this.base_url}/tl-product-list/?ids=${ids.join(',')}`

    return this.axios.get<ProductList[]>(url).then(response => response.data)
  }
}

export {TeamleaderService}
