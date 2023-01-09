<template>
  <div class="subnav-pills pills-small">
    <b-nav pills>
      <b-nav-item
        v-for="item in pillsItems"
        :active="item.value === activePillItem"
        :key="item.value"
        @click="doNav(item)"
      >
        {{ item.label }}
      </b-nav-item>
    </b-nav>
  </div>
</template>

<script>
export default {
  name: "PillsEngineer",
  methods: {
    doNav(item) {
      this.$router.push({name: item.url_name})
    },
    setActive() {
      const parts = this.$route.path.split('/')
      if (parts.length === 4) {
        this.activePillItem = 'engineers'
      } else {
        this.activePillItem = parts[4]
      }
    }
  },
  data() {
    return {
      activePillItem: 'engineers',
      pillsItems: [
      {
        label: 'List',
        url_name: 'users-engineers',
        value: 'engineers'
      },
      {
        label: 'Events',
        url_name: 'engineer-event-list',
        value: 'events'
      },
        {
          label: 'Event types',
          url_name: 'engineer-event-type-list',
          value: 'event-types'
        },
    ]
    }
  },
  created() {
    this.setActive()
  }
}
</script>

<style scoped>
.pills-small {
  font-size: 12px;
}
</style>
