<template>
  <div class="bg-gray-100 font-sans text-gray-800 overflow-x-hidden">
    <!-- Fundo com gradiente sutil -->
    <div class="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-50"></div>

    <NavBar />

    <HeroBanner />
    <div class="px-4">
      <PaymentForm />
    </div>

    <FooterEnd />
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import PaymentForm from './components/PaymentForm.vue'
import HeroBanner from './components/HeroBanner.vue'
import FooterEnd from './components/FooterEnd.vue'
</script>
