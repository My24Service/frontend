import axios from 'axios';

import BaseModel from '@/models/base';


class My24 extends BaseModel {
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
    axios
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

  status2color(statuscodes, status) {
    if (!status) {
      console.log('no status');
      return;
    }

    for (let i=0; i<statuscodes.length; i++) {
      const statuscode = statuscodes[i];
      let color = statuscode.color;

      if (color.substr(0, 1) !== '#') color = '#' + color;

      // first try regex
      const re = new RegExp(statuscode.statuscode, 'i');
      if (re.test(status)) {
        return color;
        // return resolve(color);
      }

      if (status === statuscode) {
        return color;
        // return resolve(color);
      }
    }

    return '';
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

  getInitialData() {
    return new Promise((resolve, reject) => {
      axios.get('/get-initial-data/')
        .then((response) => {
          document.title = response.data.memberInfo.name;
          resolve(response.data);
        })
        .catch(() => {
          reject();
        });
    });
  }

  isAllowed(userInfo) {
    return !(!userInfo.planning_user && userInfo.is_staff === false && userInfo.is_superuser === false);
  }

}

const my24 = new My24();

export default my24;
