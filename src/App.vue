<template>
  <div class="bg-gray-100 font-sans text-gray-800 overflow-x-hidden">
    <HeroBanner />
    <div class="py-12 px-4 -mt-24 sm:-mt-48 relative z-20">
      <PaymentForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import PaymentForm from './components/PaymentForm.vue'
import HeroBanner from './components/HeroBanner.vue'
</script>
