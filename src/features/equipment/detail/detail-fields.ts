/**
 * One row of a detail page's details list.
 *
 * The view assembles these from whatever record it loaded; each family's
 * layout decides how to frame them - `DetailLayoutDefault` renders them in
 * order, `DetailLayoutShltr` buckets them into two columns by `col`. That
 * split is the whole reason the field data stays in the view rather than in
 * the layout.
 */
export interface DetailField {
  label: string
  value: unknown
  /** 1 is the left column, 2 the right; ignored by the default layout. */
  col?: 1 | 2
}
