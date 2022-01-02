<template>
  <div ref="index">
    <SubNav>
      <b-nav-text>
        <h1>{{ memberInfo.name }}</h1>
        <hr/>
      </b-nav-text>
    </SubNav>
    <b-row>
      <b-col cols="4">
        <h2>{{ $trans('Address') }}</h2>
        <address>
          {{ memberInfo.address }}<br/>
          {{ memberInfo.country_code }} - {{ memberInfo.postal }}<br/>
          {{ memberInfo.city }}<br/>
          <abbr v-bind:title="$trans('Phone')">P: </abbr> {{ memberInfo.tel }}<br/>
          <a v-bind:href="memberInfo.www" target="_blank">{{ memberInfo.www }}</a>
        </address>
        <h2>{{ $trans('Contact') }}</h2>
        <p><small>{{ memberInfo.contacts }}</small></p>
        <h2>{{ $trans('Company info') }}</h2>
        <p><small>{{ memberInfo.info }}</small></p>
        <h2>{{ $trans('Activities') }}</h2>
        <p><small>{{ memberInfo.activities }}</small></p>
      </b-col>
      <b-col cols="8">
        <div>
          <b-carousel
            class="company-carousel"
            v-model="slide"
            :interval="2000"
            controls
            indicators
            background="#fff"
          >
            <b-carousel-slide :key="image.id" thumbnail v-for="image in memberInfo.pictures" v-bind:img-src="image">
            </b-carousel-slide>
          </b-carousel>
        </div>
      </b-col>
    </b-row>
  </div>
</template>

<script>
import SubNav from "@/components/SubNav";

export default {
  name: 'TheIndex',
  components: {
    SubNav
  },
  data() {
    return {
      slide: 0,
      memberInfo: this.$store.state.memberInfo
    }
  }
}
</script>

<style scoped>
</style>
