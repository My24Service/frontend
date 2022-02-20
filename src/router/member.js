import TheAppLayout from '@/components/TheAppLayout.vue'
import SubNavMembers from '@/components/SubNavMembers.vue'

import MemberList from '@/views/member/MemberList.vue'
import MemberForm from '@/views/member/MemberForm.vue'
import ContractList from '@/views/member/ContractList.vue'
import ContractForm from '@/views/member/ContractForm.vue'
import ModuleList from '@/views/member/ModuleList.vue'
import ModuleForm from '@/views/member/ModuleForm.vue'
import ModulePartList from '@/views/member/ModulePartList.vue'
import ModulePartForm from '@/views/member/ModulePartForm.vue'


export default [
{
  path: '/members',
  component: TheAppLayout,
  children: [
      {
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
      // contracts
      {
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
