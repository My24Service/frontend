export default {
  methods: {
    infoToast(title, message) {
      this.$root.$bvToast.toast(message, {
        variant: 'info',
        title,
        solid: true,
        toaster: 'b-toaster-top-center',
      });
    },
    errorToast(message, title=this.$trans('Error')) {

      this.$root.$bvToast.toast(message, {
        variant: 'warning',
        title,
        solid: true,
        toaster: 'b-toaster-top-center',
      });
    },
  }
}
