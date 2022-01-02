import TheAppLayout from '@/components/TheAppLayout'
import SubNavCompany from '@/components/SubNavCompany'

import Dashboard from '@/views/company/Dashboard'
import Info from '@/views/company/Info'
import Settings from '@/views/company/Settings'

import UserEngineerList from '@/views/company/UserEngineerList'
import UserEngineerForm from '@/views/company/UserEngineerForm'
import UserSalesList from '@/views/company/UserSalesList'
import UserSalesForm from '@/views/company/UserSalesForm'
import UserCustomerList from '@/views/company/UserCustomerList'
import UserCustomerForm from '@/views/company/UserCustomerForm'
import UserPlanningList from '@/views/company/UserPlanningList'
import UserPlanningForm from '@/views/company/UserPlanningForm'
import UserStudentList from '@/views/company/UserStudentList'
import UserStudentForm from '@/views/company/UserStudentForm'

import PartnerList from '@/views/company/PartnerList'
import PartnerRequestsSentList from '@/views/company/PartnerRequestsSentList'
import PartnerRequestsSentForm from '@/views/company/PartnerRequestsSentForm'
import PartnerRequestsReceivedList from '@/views/company/PartnerRequestsReceivedList'

import ActivityList from '@/views/company/ActivityList'

import PictureList from '@/views/company/PictureList'
import PictureForm from '@/views/company/PictureForm'


export default [
{
  path: '/customers',
  component: TheAppLayout,
  children: [
      {
        name: 'company-dashboard',
        path: '/company/dashboard',
        components: {
          'app-content': Dashboard,
          'app-subnav': SubNavCompany
        },
        props: {
          'app-content': {},
          'app-subnav': {}
        },
      },
    {
      name: 'company-info',
      path: '/company/company/info',
      components: {
        'app-content': Info,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-settings',
      path: '/company/company/settings',
      components: {
        'app-content': Settings,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // users
    {
      name: 'users-engineers',
      path: '/company/users/engineers',
      components: {
        'app-content': UserEngineerList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'engineer-edit',
      path: '/company/users/engineers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserEngineerForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'engineer-add',
      path: '/company/users/engineers/form',
      components: {
        'app-content': UserEngineerForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'users-salesusers',
      path: '/company/users/salesusers',
      components: {
        'app-content': UserSalesList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'salesuser-edit',
      path: '/company/users/salesusers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserSalesForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'salesuser-add',
      path: '/company/users/salesusers/form',
      components: {
        'app-content': UserSalesForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'users-customerusers',
      path: '/company/users/customerusers',
      components: {
        'app-content': UserCustomerList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'customeruser-edit',
      path: '/company/users/customerusers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserCustomerForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'customeruser-add',
      path: '/company/users/customerusers/form',
      components: {
        'app-content': UserCustomerForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'users-planningusers',
      path: '/company/users/planningusers',
      components: {
        'app-content': UserPlanningList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'planninguser-edit',
      path: '/company/users/planningusers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserPlanningForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'planninguser-add',
      path: '/company/users/planningusers/form',
      components: {
        'app-content': UserPlanningForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'users-studentusers',
      path: '/company/users/studentusers',
      components: {
        'app-content': UserStudentList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'studentuser-edit',
      path: '/company/users/studentusers/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': UserStudentForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'studentuser-add',
      path: '/company/users/studentusers/form',
      components: {
        'app-content': UserStudentForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // partners
    {
      name: 'company-partners-active',
      path: '/company/partners/active',
      components: {
        'app-content': PartnerList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-partners-requests-sent',
      path: '/company/partners/requests-sent',
      components: {
        'app-content': PartnerRequestsSentList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'partner-request-add',
      path: '/company/partners/requests/form',
      components: {
        'app-content': PartnerRequestsSentForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-partners-requests-received',
      path: '/company/partners/requests-received',
      components: {
        'app-content': PartnerRequestsReceivedList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // activity
    {
      name: 'company-activity',
      path: '/company/activity',
      components: {
        'app-content': ActivityList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // pictures
    {
      name: 'company-pictures',
      path: '/company/pictures',
      components: {
        'app-content': PictureList,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      name: 'company-picture-edit',
      path: '/company/pictures/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': PictureForm,
        'app-subnav': SubNavCompany
      },
    },
    {
      name: 'company-picture-add',
      path: '/company/pictures/form',
      components: {
        'app-content': PictureForm,
        'app-subnav': SubNavCompany
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
  ]
}]
