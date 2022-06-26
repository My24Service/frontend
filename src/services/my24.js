import BaseModel from '@/models/base';


class My24 extends BaseModel {
  getInitialData() {
    return this.axios.get('/get-initial-data/').then((response) => response.data)
  }

  getLanguageVars() {
    return this.axios.get('/get-language-vars/').then((response) => response.data)
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

  downloadItem(url, name) {
    this.axios
      .get(url, { responseType: 'blob' })
      .then((response) => {
        const blob = new Blob([response.data], { type: response.data.type });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = name;
        link.click();
        URL.revokeObjectURL(link.href);
      })
      .catch(console.error);
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
      console.log('getStatuscode: no status, return')
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
    const statuscode = this.getStatuscode(statuscodes, order.order_status)
    if (!statuscode) {
      // console.log(`no statuscode found for "${order.order_status}"`)
      return
    }

    if (statuscode.color_for_assignedorders || order.assignedorder_status === null) {
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
    // console.log(config)
    // staff and superuser can see all
    if (config.isStaff || config.isSuperuser) {
      return true
    }

    // just pages like / and /no-access
    if (config.lenParts === 1) {
      return true;
    }

    if (!(config.module in config.contract)) {
      return false;
    }

    if (!config.part) {
      return true;
    }

    const allowed = ['form', 'view', 'info', 'users'];

    if (allowed.indexOf(config.part) !== -1) {
      return true;
    }

    return config.contract[config.module].indexOf(config.part) !== -1;
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
    return !(!userInfo.planning_user && userInfo.is_staff === false && userInfo.is_superuser === false);
  }

}

const my24 = new My24();

export default my24;
