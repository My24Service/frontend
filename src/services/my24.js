import BaseModel from '@/models/base';
import {normalClient} from "@/services/api";
import auth from '@/services/auth'

class My24 extends BaseModel {
  getInitialData() {
    return this.axios.get('/get-initial-data/').then((response) => response.data)
  }

  getLanguageVars() {
    return this.axios.get('/get-language-vars/', {withCredentials:true}).then((response) => response.data)
  }

  getParameterByName(name, url) {
    if (!url) url = window.location.href
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
  }

  downloadItem(url, name, callback, requestMethod='get') {
    let headers = { responseType: 'blob' }
    let client;

    if (requestMethod === 'post') {
      auth.setInterceptors(normalClient)
      client = normalClient.post(url, {}, headers)
    } else {
      client = normalClient.get(url, headers)
    }

    client
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

  status2color(statuscodes, status, text_color=false) {
    const defaultColor = '#ccc'
    const defaultTextColor = '#000'
    if (!status) {
      //console.log(`no status, returning ${text_color ? 'text color' : 'color'} ${text_color ? defaultTextColor : defaultColor}`)
      return text_color ? defaultTextColor : defaultColor
    }

    for (let i=0; i<statuscodes.length; i++) {
      const statuscode = statuscodes[i]
      let color = text_color ? statuscode.text_color : statuscode.color
      if (!color) {
        color = text_color ? defaultTextColor : defaultColor
        //console.log(`could not find ${text_color ? 'text color' : 'color'} for: ${statuscode.statuscode}, defaulting to ${color}`)
      }

      if (color.substring(0, 1) !== '#') color = '#' + color

      const re = new RegExp(statuscode.statuscode, 'i');
      if (re.test(status) || status === statuscode) {
        return color
      }
    }

    return defaultColor
  }

  getStatuscode(statuscodes, status) {
    if (!status) {
      // console.debug('getStatuscode: no status, return')
      return null
    }

    if (!statuscodes) {
      // console.debug('getStatuscode: no statuscodes, return')
      return null
    }

    for (let i=0; i<statuscodes.length; i++) {
      const statuscode = statuscodes[i]
      const re = new RegExp(statuscode.statuscode, 'i');
      if (re.test(status) || status === statuscode) {
        return statuscode
      }
    }

    return null
  }

  getStatuscodeForOrder(statuscodes, order) {
    let statuscode = this.getStatuscode(statuscodes, order.order_status)
    if (statuscode) {
      return statuscode
    }

    statuscode = this.getStatuscode(statuscodes, order.last_status)
    if (statuscode) {
      return statuscode
    }

    if (statuscode && statuscode.color_for_assignedorders || order.assignedorder_status === null) {
      return statuscode
    }

    return this.getStatuscode(statuscodes, order.assignedorder_status)
  }

  getStatuscodeColor(statuscode, text_color=false) {
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

  hasAccessToModule(config) {
    const debug = true
    // console.log(config)

    if (config.isSuperuser) return true

    // just pages like / and /no-access
    if (config.lenParts === 1) {
      if (debug) console.debug(`allowed: only one route part (${config.part})`)
      return true;
    }

    // members exception
    if ((config.isStaff || config.isSuperuser) && config.module === 'members') {
      if (debug) console.debug(`allowed: member exception (module=${config.module})`)
      return true;
    }

    if (!(config.module in config.contract)) {
      if (debug) console.debug(`not allowed: module not in contract (module=${config.module})`)
      return false;
    }

    if (!config.part) {
      if (debug) console.debug(`allowed: no part (module=${config.module})`)
      return true;
    }

    const parts_always_allowed = [
      'form', 'view', 'info', 'company', 'activity', 'pictures',
      'planning-users', 'employee-users', 'import', 'statuscodes',
      'api-users', 'map', 'filter'
    ]
    if (parts_always_allowed.indexOf(config.part) !== -1) {
      if (debug) console.debug(`allowed: part "${config.part}" in always allowed (${parts_always_allowed.join('/')})`)
      return true;
    }

    if (config.isStaff || config.isSuperuser) {
      const allowed_staff = ['members', 'contracts', 'deleted-members', 'modules', 'module-parts']

      if (allowed_staff.indexOf(config.part) !== -1) {
        if (debug) console.debug('allowed because member or staff and member', config.part)
        return true;
      }
    }

    // TODO remove when new dispatch (html and no canvas) live
    if (config.part === 'dispatch-new') {
      config.part = 'dispatch'
    }

    const contract_result = config.contract[config.module].indexOf(config.part) !== -1;
    if (debug) console.debug(`end of hasAccessToModule, config.part=${config.part}, contract_result=${contract_result}`)
    return contract_result
  }

  getModelsFromString(member_contract) {
    let memberContract = {};
    const paths = member_contract.split('|');

    for(let i=0; i<paths.length; i++) {
      const module_data = paths[i].split(':');
      memberContract[module_data[0]] = module_data[1].split(',');
    }

    return memberContract;
  }

  isAllowed(userInfo) {
    return !(!userInfo.user.planning_user && userInfo.user.is_staff === false && userInfo.user.is_superuser === false);
  }

}

const my24 = new My24();

export default my24;
