<template>
  <div class='app-page'>
    <header>
      <div class='page-title'>
        <h3><IBiMouse2Fill></IBiMouse2Fill>{{ $trans("3D Module") }}</h3>
      </div>
    </header>
    <div class='page-detail'>
      <div class='panel'>
        <iframe src="https://4indoor.iv.navvis.com/"></iframe>
      </div>
    </div>
  </div>
</template>

<style scoped>
iframe {
  width: 100%;
  min-height: 65vh;
  border: none;
}
</style>

<script>
export default {
  name: 'BIMFrame'
}
</script>
