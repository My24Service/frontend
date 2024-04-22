import TheAppLayout from '../components/TheAppLayout.vue'
import SubNavMembers from '../components/SubNavMembers.vue'

import MemberList from '../views/member/MemberList.vue'
import MemberForm from '../views/member/MemberForm.vue'
import ContractList from '../views/member/ContractList.vue'
import ContractForm from '../views/member/ContractForm.vue'
import ModuleList from '../views/member/ModuleList.vue'
import ModuleForm from '../views/member/ModuleForm.vue'
import ModulePartList from '../views/member/ModulePartList.vue'
import ModulePartForm from '../views/member/ModulePartForm.vue'
import {AUTH_LEVELS} from "@/constants";


export default [
{
  path: '/member',
  component: TheAppLayout,
  children: [
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-list',
      path: '/members/members',
      components: {
        'app-content': MemberList,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-deleted-list',
      path: '/members/deleted-members',
      components: {
        'app-content': MemberList,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': route => ({...route.params, deleted: true}),
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-requested-list',
      path: '/members/requested-members',
      components: {
        'app-content': MemberList,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': route => ({...route.params, requested: true}),
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-edit',
      path: '/members/members/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': MemberForm,
        'app-subnav': SubNavMembers
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'member-add',
      path: '/members/members/form',
      components: {
        'app-content': MemberForm,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'member-request',
      path: '/members/members/form',
      components: {
        'app-content': MemberForm,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': route => ({...route.params, isRequest: true}),
        'app-subnav': {}
      },
    },
    // contracts
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'contract-list',
      path: '/members/contracts',
      components: {
        'app-content': ContractList,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'contract-edit',
      path: '/members/contracts/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': ContractForm,
        'app-subnav': SubNavMembers
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'contract-add',
      path: '/members/contracts/form',
      components: {
        'app-content': ContractForm,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // modules
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-list',
      path: '/members/modules',
      components: {
        'app-content': ModuleList,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-edit',
      path: '/members/modules/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': ModuleForm,
        'app-subnav': SubNavMembers
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-add',
      path: '/members/modules/form',
      components: {
        'app-content': ModuleForm,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    // module parts
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-part-list',
      path: '/members/module-parts',
      components: {
        'app-content': ModulePartList,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-part-edit',
      path: '/members/module-parts/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': {}
      },
      components: {
        'app-content': ModulePartForm,
        'app-subnav': SubNavMembers
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-part-add',
      path: '/members/module-parts/form',
      components: {
        'app-content': ModulePartForm,
        'app-subnav': SubNavMembers
      },
      props: {
        'app-content': {},
        'app-subnav': {}
      },
    },
  ]
}]
