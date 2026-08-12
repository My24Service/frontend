<template>
  <div class="tw:relative" v-if="kpis.length">
    <div
      ref="scroller"
      class="kpi-scroller tw:flex tw:snap-x tw:snap-mandatory tw:gap-4 tw:overflow-x-auto tw:scroll-smooth"
      @scroll.passive="updateArrows"
    >
      <KpiTileShltr
        v-for="kpi in kpis"
        :key="kpi.key"
        class="tw:shrink-0 tw:snap-start tw:basis-[calc((100%-1rem)/2)] tw:md:basis-[calc((100%-3rem)/4)]"
        :value="kpi.value"
        :label="kpi.label"
        :icon="kpi.icon"
        :icon-class="kpi.iconClass"
        :hint="kpi.hint"
        :to="kpi.to"
      />
    </div>

    <button
      v-if="canScrollLeft"
      type="button"
      class="kpi-scroller-arrow tw:absolute tw:top-1/2 tw:-left-5 tw:-translate-y-1/2 tw:scale-75 tw:opacity-50 tw:hover:opacity-100"
      :title="$trans('Previous')"
      @click="scrollByPage(-1)"
    >
      <IBiChevronLeft></IBiChevronLeft>
    </button>
    <button
      v-if="canScrollRight"
      type="button"
      class="kpi-scroller-arrow tw:absolute tw:top-1/2 tw:-right-5 tw:-translate-y-1/2 tw:scale-75 tw:opacity-50 tw:hover:opacity-100"
      :title="$trans('Next')"
      @click="scrollByPage(1)"
    >
      <IBiChevronRight></IBiChevronRight>
    </button>
  </div>
</template>

<script setup>
import {ref, watch, nextTick, onMounted, onBeforeUnmount} from 'vue'
import KpiTileShltr from './KpiTileShltr.vue'
import {$trans} from '@/utils'

// The KPI row as a snapping carousel: four tiles per view (two on mobile),
// the rest reachable by scrolling. Snapping is pure CSS — scroll-snap-type on
// the scroller, scroll-snap-align on each tile — so the only script here is
// the two arrow buttons, which a mouse user has no other way to scroll with.
const props = defineProps({
  kpis: {
    type: Array,
    required: true,
  },
})

const scroller = ref(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

function updateArrows() {
  const el = scroller.value
  if (!el) return

  // 1px of slack: scrollLeft is fractional on fractional viewport widths
  canScrollLeft.value = el.scrollLeft > 1
  canScrollRight.value = el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

// One step moves a whole view of tiles.
//
// It has to land on an exact snap point. Under `scroll-snap-type: mandatory`
// a scroll that ends between snap points is not nudged to the nearest one —
// it is discarded outright, and the row stays put. So page by whole tile
// pitches (tile width + gap) rather than by clientWidth, which is a view of
// tiles *minus* the gap that follows it and therefore never a snap point.
function scrollByPage(direction) {
  const el = scroller.value
  if (!el || el.children.length < 2) return

  const pitch = el.children[1].offsetLeft - el.children[0].offsetLeft
  const perView = Math.max(1, Math.round(el.clientWidth / pitch))

  el.scrollBy({left: direction * perView * pitch, behavior: 'smooth'})
}

// Left/right anywhere on the page pages the carousel — it is the only thing
// on this screen the arrow keys could mean. Bail out while the user is typing
// or has a dropdown or modal open, where the keys already mean something.
function onKeydown(event) {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return

  const el = document.activeElement
  if (el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName))) return
  if (document.querySelector('.modal.show, .dropdown-menu.show')) return

  event.preventDefault()
  scrollByPage(event.key === 'ArrowLeft' ? -1 : 1)
}

// The tile count changes once memberInfo says which modules this member has.
watch(() => props.kpis.length, () => nextTick(updateArrows))

onMounted(() => {
  updateArrows()
  window.addEventListener('resize', updateArrows)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updateArrows)
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/*
  * The snapping itself is scroll-snap in the component's utility classes;
  * these two rules only cover what utilities can't. The scrollbar is hidden
  * because it would read as a second horizontal rule under the tiles — the
  * arrow buttons are the affordance instead.
  */
.kpi-scroller {
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.kpi-scroller-arrow {
  align-items: center;
  background: none;
  border: 0;
  display: flex;
  font-size: 1.25rem;
  height: 1.5rem;
  justify-content: center;
  padding: 0;
  width: 1.5rem;
}
</style>