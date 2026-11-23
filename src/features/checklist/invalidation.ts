import type { QueryClient } from '@tanstack/vue-query'

/**
 * A checklist write stales the questions too, which the schema cannot connect:
 * the form saves both in one go, and deleting a checklist deletes its
 * questions with it, while they live under a path of their own.
 */
export async function invalidateChecklistQueries(queryClient: QueryClient): Promise<void> {
  await Promise.all([
    Api.ChecklistChecklist.invalidate(queryClient),
    Api.ChecklistChecklistQuestion.invalidate(queryClient),
  ])
}
