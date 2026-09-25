<template>
  <div v-if="documents.length">
    <h6>{{ title }}</h6>
    <table class="table table-borderless table-sm">
      <tbody>
        <tr
          v-for="document in documents"
          :key="document.url"
        >
          <td>
            <BLink
              :href="document.url"
              target="_blank"
              class="flex-columns"
            >
              {{ $trans('Order') }} {{ orderId ?? '' }}
              <small class="dimmed">{{ document.name }}</small>
            </BLink>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <h6
    v-else
    class="dimmed"
  >{{ title }}</h6>
</template>

<script lang="ts" setup>

/**
 * One of the "Workorder documents" blocks on the order detail: a heading
 * and a list of PDF links, or the heading dimmed when there is nothing.
 */
defineProps<{
  title: string
  orderId: string | null
  documents: Api.WorkorderDocument[]
}>()
</script>
