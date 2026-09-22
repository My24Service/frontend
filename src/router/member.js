import TheAppLayout from '../components/TheAppLayout.vue'
import SubNav from '../components/SubNav.vue'

// The whole Member Slice — lists and forms, #321-#325 — lives in the feature
// folder; this file only routes it.
import {AUTH_LEVELS} from "@/constants";

// Route screens, split per chunk: the router holds a loader, not the module.
const ContractForm = () => import('@/features/member/contract/ContractForm.vue')
const ContractList = () => import('@/features/member/contract/ContractList.vue')
const MemberForm = () => import('@/features/member/member/MemberForm.vue')
const MemberList = () => import('@/features/member/member/MemberList.vue')
const ModuleForm = () => import('@/features/member/module/ModuleForm.vue')
const ModuleList = () => import('@/features/member/module/ModuleList.vue')
const ModulePartForm = () => import('@/features/member/module-part/ModulePartForm.vue')
const ModulePartList = () => import('@/features/member/module-part/ModulePartList.vue')

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
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params, variant: 'active'}),
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-deleted-list',
      path: '/members/deleted-members',
      components: {
        'app-content': MemberList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params, variant: 'deleted'}),
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-requested-list',
      path: '/members/requested-members',
      components: {
        'app-content': MemberList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params, variant: 'requested'}),
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-edit',
      path: '/members/members/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'members' }
      },
      components: {
        'app-content': MemberForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'member-add',
      path: '/members/members/form',
      components: {
        'app-content': MemberForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'member-request',
      // Its own path: sharing member-add's meant a reload matched member-add.
      path: '/members/members/request-form',
      components: {
        'app-content': MemberForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': route => ({...route.params, isRequest: true}),
        'app-subnav': { section: 'members' }
      },
    },
    // contracts
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'contract-list',
      path: '/members/contracts',
      components: {
        'app-content': ContractList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'contract-edit',
      path: '/members/contracts/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'members' }
      },
      components: {
        'app-content': ContractForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.STAFF },
      name: 'contract-add',
      path: '/members/contracts/form',
      components: {
        'app-content': ContractForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
    // modules
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-list',
      path: '/members/modules',
      components: {
        'app-content': ModuleList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-edit',
      path: '/members/modules/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'members' }
      },
      components: {
        'app-content': ModuleForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-add',
      path: '/members/modules/form',
      components: {
        'app-content': ModuleForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
    // module parts
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-part-list',
      path: '/members/module-parts',
      components: {
        'app-content': ModulePartList,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-part-edit',
      path: '/members/module-parts/form/:pk',
      props: {
        'app-content': route => ({...route.params}),
        'app-subnav': { section: 'members' }
      },
      components: {
        'app-content': ModulePartForm,
        'app-subnav': SubNav
      },
    },
    {
      meta: { authLevelNeeded: AUTH_LEVELS.SUPERUSER },
      name: 'module-part-add',
      path: '/members/module-parts/form',
      components: {
        'app-content': ModulePartForm,
        'app-subnav': SubNav
      },
      props: {
        'app-content': {},
        'app-subnav': { section: 'members' }
      },
    },
  ]
}]
