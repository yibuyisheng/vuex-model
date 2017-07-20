export default {
  beforeCreate() {
    this.$constants = this.getConstants(this.$options.namespace);
  },
  beforeDestroy() {
    this.$store.dispatch(this.$constants.LEAVE);
  }
};
