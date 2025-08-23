<template>
  <div
    class="max-w-md mx-auto bg-white backdrop-blur-sm shadow-md rounded-2xl p-8 text-center space-y-6"
  >
    <!-- Ícone de checkmark elegante -->
    <svg
      class="w-16 h-16 mx-auto text-teal-500"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>

    <!-- Título principal -->
    <h2 class="text-2xl font-bold text-slate-800">Pagamento Aprovado!</h2>

    <!-- Descrição detalhando a confirmação -->
    <p class="text-gray-600">
      Sua transação foi concluída com sucesso. Obrigado por utilizar a plataforma.
    </p>

    <!-- Botão para iniciar novo pagamento, Notifica o pai para voltar ao formulário  -->
    <button
      @click="$emit('new-payment')"
      class="bg-teal-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-teal-700 transition"
    >
      Realizar Novo Pagamento
    </button>
  </div>
</template>

<script setup lang="ts"></script>
