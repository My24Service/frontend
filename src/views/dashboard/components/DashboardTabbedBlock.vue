<template>
  <div class="section_block">
    <div class="section_head">
      <div class="d-flex align-items-center"><h5 class="m-0"><span>{{ title }}</span></h5></div>
    </div>
    <b-tabs content-class="section_block_content" :pills="pills" :card="isCard">
      <b-tab
        v-for="(tab, index) in tabList"
        :key="index"
        :title="tab.title"
        :active="index === 0">
        <div v-html="tab.content"></div>
      </b-tab>
    </b-tabs>
  </div>
</template>

<style scoped>
div.section_block div.tabs div ul.nav.nav-pills {
  margin: 4px;
  height: 4px;
  justify-content: center;
}
</style>

<script setup>
// tabList: [{ title: 'Tab 1', content: 'Content 1' }]
defineProps({
  title: {
    type: String,
    required: true,
  },
  tabList: {
    type: Array,
    required: true,
  },
  pills: {
    type: Boolean,
    default: false
  },
  isCard: {
    type: Boolean,
    default: false
  }
});
</script>
