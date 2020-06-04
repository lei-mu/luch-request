<template>
  <div class="notice-wrap">{{message}}</div>
</template>
<script>
  export default {
    name: 'CmNotice',
    props: {
      message: {
        type: String,
        default: ''
      }
    },
    data () {
      return {

      }
    }
  }
</script>
<style scoped>
.notice-wrap {
  font-size: 35px;
  color: red;
}
@media screen and ( max-width: 980px ) {
 .notice-wrap {
   font-size: 25px;
 }
}
</style>
