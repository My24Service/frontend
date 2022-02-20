export default {
  methods: {
    infoToast(title, message) {
      this.$bvToast.toast(message, {
        variant: 'info',
        title
      });
    },
    errorToast(message, title=this.$trans('Error')) {
      this.$bvToast.toast(message, {
        variant: 'danger',
        title
      });
    },
  }
}
