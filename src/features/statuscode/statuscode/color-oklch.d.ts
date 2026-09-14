// The `color` package (v5) converts to and from OKLCH at runtime — it builds a
// method per color-convert model — but its own index.d.ts stops at LCH. The
// palette needs the instance side; this augments just that. (The constructor
// side is a type alias, which cannot be augmented — palette.ts casts once.)
// The import is what makes this an augmentation rather than a replacement.
import 'color'

declare module 'color' {
  interface ColorInstance {
    oklch(): ColorInstance
  }
}
