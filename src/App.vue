<template>
  <div class="relative bg-gray-100 font-sans text-gray-800 overflow-x-hidden min-h-screen">
    <!-- Fundo com gradiente sutil -->
    <div class="absolute inset-0 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-50"></div>

    <!-- Navbar fixa no topo -->
    <NavBar />

    <!-- Hero banner com título e descrição -->
    <HeroBanner />

    <!-- Área principal de conteúdo -->
    <div class="px-4 py-10">
      <!-- Alterna entre PaymentForm e PaymentSuccess -->
      <component
        :is="showSuccess ? 'PaymentSuccess' : 'PaymentForm'"
        @payment-success="handlePaymentSuccess"
        @new-payment="handleNewPayment"
      />
    </div>

    <!-- Rodapé da página -->
    <FooterEnd />
  </div>
</template>

<script setup lang="ts">
import NavBar from './components/NavBar.vue'
import HeroBanner from './components/HeroBanner.vue'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PaymentForm from './components/PaymentForm.vue'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import PaymentSuccess from './components/PaymentSuccess.vue'
import FooterEnd from './components/FooterEnd.vue'

import { ref } from 'vue'

// Estado para alternar entre formulário e sucesso
const showSuccess = ref(false)

// Mostra a tela de sucesso
function handlePaymentSuccess() {
  showSuccess.value = true
}

// Volta para o formulário e limpa campos
function handleNewPayment() {
  showSuccess.value = false
}
</script>
