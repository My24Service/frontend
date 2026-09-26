import type { AxiosResponse } from 'axios'
import type {
  GetInitialDataResponse,
  LanguageVarsResponse,
  UserInfoResponse,
} from '@/api/types.gen'
import type { MainMemberInfo } from '@/stores/main'
import client, {normalClient} from "@/services/api";
import setInterceptors from '@/services/auth/clientDriver'

/**
 * The get-initial-data answer as the main store consumes it. `memberInfo`
 * takes the store's `MainMemberInfo` shape (an absent logo reads `undefined`,
 * never `null`), and `member_texts` the `Record<string, string>` the
 * `window.member_type_text` contract in `src/services/i18n.ts` declares.
 */
export interface My24InitialData extends Omit<GetInitialDataResponse, 'memberInfo'> {
  memberInfo: Omit<MainMemberInfo, 'member_texts'> & {
    member_texts?: Record<string, string>
  }
}

/**
 * The least a statuscode row needs for the colour/pick helpers: the code
 * itself, plus the colour columns when the row carries them. Full
 * `Api.Statuscode` rows satisfy this, and so do the `{statuscode}` picker
 * rows (TableStatusInfo).
 */
export interface StatuscodeLike {
  statuscode: string
  color?: string | null
  text_color?: string | null
  color_for_assignedorders?: boolean
}

/**
 * The order keys the status picker reads. `DispatchBoardOrder` plus the
 * assignment status the dispatch board stitches on satisfies this.
 */
export interface OrderStatusSource {
  order_status?: string | null
  last_status?: string | null
  assignedorder_status?: string | null
}

/**
 * The route-access inputs: the tenant's contract (`modules`, `parts`) plus
 * the caller's place in it (`module`, `part`) and the role flags. Every field
 * is optional because the options-API mixins and `hasAccessToModule('orders')`
 * style calls omit `part`/`lenParts`.
 */
export interface ModuleAccessConfig {
  isSuperuser?: boolean
  isStaff?: boolean
  lenParts?: number
  module?: string
  part?: string
  modules?: string[]
  parts?: Record<string, string[]>
}

class My24 {
  axios = client
  getInitialData(): Promise<My24InitialData> {
    return this.axios.get<My24InitialData>('/get-initial-data/').then((response) => response.data)
  }

  getLanguageVars(): Promise<LanguageVarsResponse> {
    return this.axios.get<LanguageVarsResponse>('/get-language-vars/', {withCredentials:true}).then((response) => response.data)
  }

  getParameterByName(name: string, url?: string): string | null {
    const href = url ? url : window.location.href
    const escapedName = name.replace(/[\[\]]/g, '\\$&');
    const regex = new RegExp('[?&]' + escapedName + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(href);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  downloadItem(url: string, name: string, callback?: () => void, requestMethod = 'get'): void {
    const headers: { responseType: 'blob' } = { responseType: 'blob' }
    let blobClient: Promise<AxiosResponse<Blob>>;

    if (requestMethod === 'post') {
      setInterceptors(normalClient)
      blobClient = normalClient.post<Blob>(url, {}, headers)
    } else {
      blobClient = normalClient.get<Blob>(url, headers)
    }

    blobClient
      .then((response) => {
        const blob = new Blob([response.data], { type: response.data.type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        link.click();
        URL.revokeObjectURL(link.href);
        link.remove()
      })
      .catch(console.error)
      .finally(function () {
        if (callback) {
          callback()
        }
      });
  }

  status2color(statuscodes: StatuscodeLike[], status: string | StatuscodeLike | null | undefined, text_color = false): string {
    const defaultColor = '#ccc'
    const defaultTextColor = '#000'
    if (!status) {
      return text_color ? defaultTextColor : defaultColor
    }

    const statusText = typeof status === 'string' ? status : status.statuscode

    for (let i=0; i<statuscodes.length; i++) {
      const statuscode = statuscodes[i]
      let color = text_color ? statuscode.text_color : statuscode.color
      if (!color) {
        color = text_color ? defaultTextColor : defaultColor
      }

      if (color.substring(0, 1) !== '#') color = '#' + color

      const re = new RegExp(statuscode.statuscode, 'i');
      if (re.test(statusText) || status === statuscode) {
        return color
      }
    }

    return defaultColor
  }

  getStatuscode(statuscodes: StatuscodeLike[], status: string | StatuscodeLike | null | undefined): StatuscodeLike | null {
    if (!status) {
      return null
    }

    if (!statuscodes) {
      return null
    }

    const statusText = typeof status === 'string' ? status : status.statuscode

    for (let i=0; i<statuscodes.length; i++) {
      const statuscode = statuscodes[i]
      const re = new RegExp(statuscode.statuscode, 'i');
      if (re.test(statusText) || status === statuscode) {
        return statuscode
      }
    }

    return null
  }

  getStatuscodeForOrder(statuscodes: StatuscodeLike[], order: OrderStatusSource): StatuscodeLike | null {
    let statuscode = this.getStatuscode(statuscodes, order.order_status)
    if (statuscode) {
      return statuscode
    }

    statuscode = this.getStatuscode(statuscodes, order.last_status)
    if (statuscode) {
      return statuscode
    }

    // `statuscode` is null here (both matches returned above), so the
    // original `statuscode && ...` disjunct is dead and only the null check
    // decides.
    if (order.assignedorder_status === null) {
      return statuscode
    }

    return this.getStatuscode(statuscodes, order.assignedorder_status)
  }

  getStatuscodeColor(statuscode: StatuscodeLike | null | undefined, text_color = false): string {
    const defaultColor = '#ccc'
    const defaultTextColor = '#000'
    if (!statuscode) {
      return text_color ? defaultTextColor : defaultColor
    }

    let color = text_color ? statuscode.text_color : statuscode.color
    if (!color) {
      color = text_color ? defaultTextColor : defaultColor
    }

    if (color.substring(0, 1) !== '#') color = '#' + color
    return color
  }

  hasAccessToModule(config: ModuleAccessConfig): boolean {
    const debug = false
    if (debug) console.log(config)

    if (config.isSuperuser) return true

    if (config.lenParts === 1) {
      if (debug) console.debug(`allowed: only one route part (${config.part})`)
      return true;
    }

    if ((config.isStaff || config.isSuperuser) && config.module === 'members') {
      if (debug) console.debug(`allowed: member exception (module=${config.module})`)
      return true;
    }

    if (config.module === 'dashboard' || config.module === 'settings') {
      return true;
    }

    const parts_always_allowed = [
      'form', 'view', 'info', 'company', 'activity', 'pictures',
      'planning-users', 'employee-users', 'import', 'statuscodes',
      'api-users', 'map', 'filter', 'schedule'
    ]
    if (parts_always_allowed.indexOf(config.part ?? '') !== -1) {
      if (debug) console.debug(`allowed: part "${config.part}" in always allowed (${parts_always_allowed.join('/')})`)
      return true;
    }

    if (config.isStaff || config.isSuperuser) {
      const allowed_staff = [
        'members',
        'contracts',
        'deleted-members',
        'modules',
        'module-parts',
        'settings'
      ]

      if (allowed_staff.indexOf(config.part ?? '') !== -1) {
        if (debug) console.debug('allowed because member or staff and member', config.part)
        return true;
      }
    }

    // config.modules and config.parts come from the profile (get-initial-data):
    // the module names in the contract, and per module its enabled parts.
    if (!(config.modules || []).includes(config.module ?? '')) {
      if (debug) console.debug(`not allowed: module not in contract (module=${config.module})`)
      return false;
    }

    if (!config.part) {
      if (debug) console.debug(`allowed: no part (module=${config.module})`)
      return true;
    }

    const parts = (config.parts || {})[config.module ?? ''] || []
    const contract_result = parts.indexOf(config.part ?? '') !== -1;
    if (debug) console.debug(`end of hasAccessToModule, config.part=${config.part}, contract_result=${contract_result}`)
    return contract_result
  }

  isAllowed(userInfo: UserInfoResponse): boolean {
    return !(!userInfo.user.planning_user && userInfo.user.is_staff === false && userInfo.user.is_superuser === false);
  }

}

const my24 = new My24();

export default my24;
