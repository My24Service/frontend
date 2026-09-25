// The seam between application code and the generated API client.
//
// Everything generated from `openapi/schema.yaml` is reachable through here
// under one name, which `auto-imports.config.js` auto-imports as a value and as
// a type at once - so most files use `Api.CompanyBranch.Record` and
// `Api.CompanyBranch.list.options()` without saying where either came from:
//
//     Api.CompanyBranch.list.options()   // a value: the generated query options
//     Api.CompanyBranch.Record           // a type: the record it answers with
//     Api.Branch                         // a type from types.gen
//
// A file that prefers to be explicit writes
// `import * as Api from '@/services/api-client'` instead; the two reach the
// same thing.
//
// The point is that a screen naming a resource gets the query options, the
// mutations, the body schemas and the types that belong to it from the same
// place, instead of naming four generated exports and hoping they agree.
//
// It lives here rather than in `src/api/` because that directory is the
// generator's output and is emptied on every `npm run codegen` - a
// hand-written file there is deleted at the next run, for the same reason
// ./runtimeConfig.ts and ./interceptors.ts are here.

export * from '@/api/resources.gen'
// ./model-types.gen, not `type * from '@/api/types.gen'`: a blanket
// re-export cannot skip a name, and eleven model types share a name with a
// resource. The generated file lists what is left, with the reason in its
// header.
export type * from '@/api/model-types.gen'