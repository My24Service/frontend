export default {
  methods: {
    infoToast(title, message) {
      this.$root.$bvToast.toast(message, {
        variant: 'info',
        title,
        solid: true
      });
    },
    errorToast(message, title=this.$trans('Error')) {
      this.$root.$bvToast.toast(message, {
        variant: 'danger',
        title,
        solid: true
      });
    },
  }
}
