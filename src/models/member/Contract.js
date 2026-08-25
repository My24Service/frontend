import BaseModel from '@/models/base'

/**
 * The hand-written Contract model, kept deliberately as a Shim (CONTEXT.md).
 *
 * #323 moved the Contract screens into `src/features/member/contract/`, but
 * the legacy MemberForm still reads this model for its assignment dropdown —
 * the one remaining caller, outside the Slice where a Shim belongs. It dies
 * when the Member form converts to vue-query (#325), whose contract picker
 * will read through the generated query options instead; nothing new may
 * import this file.
 *
 * Its `getModuleData` method went with the Contract form, its last caller;
 * what remains is the list call the dropdown makes.
 */
class ContractService extends BaseModel {
  fields = {
    'name': '',
    'modules_text': '',
    'max_users': 0,
    'module_paths_pks': ''
  }

  url = '/member/contract/'

}

let contractModel = new ContractService()

export default contractModel
export { ContractService }
