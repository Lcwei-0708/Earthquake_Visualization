<template>
  <Header />
  <Earthquake />
  <Footer />
</template>

<script>
import Header from './components/header.vue';
import Earthquake from './components/earthquake.vue';
import Footer from './components/footer.vue';
export default {
  components: {
    Header,
    Earthquake,
    Footer
  }
}
</script>

<style>

</style>