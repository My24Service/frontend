<template>
  <NavBrand
    v-if="memberInfo"
    :member-info="memberInfo"
  />
</template>

<script>
import NavBrand from "./NavBrand.vue"
import {useMainStore} from "@/stores/main";
import {computed} from "vue";

export default {
  setup() {
    const mainStore = useMainStore()
    mainStore.checkInitialData()
    const memberInfo = computed(() => mainStore.memberInfo);

    return {
      memberInfo
    }
  },
  components: {
    NavBrand,
  },
  name: "TheNavLoggedOut",
  data() {
    return {
    }
  }
}

</script>

<style scoped>
div {
  text-align: center;
}
</style>
