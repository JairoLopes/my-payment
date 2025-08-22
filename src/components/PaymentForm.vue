<template>
  <div class="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
    <h2 class="text-2xl text-gray-800 font-semibold mb-6 text-center">Detalhes do Pagamento</h2>

    <form @submit.prevent="handleSubmit">
      <div class="mb-4">
        <label for="amount" class="block text-gray-700 font-medium mb-2">Valor a Pagar</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
          <input
            id="amount"
            type="number"
            v-model.number="amount"
            required
            class="w-full pl-8 pr-4 py-2 border rounded-md border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <div id="card-element" class="mt-6 p-4 border rounded-md border-gray-300"></div>

      <button
        type="submit"
        class="w-full bg-teal-500 text-white font-semibold py-3 px-4 rounded-md hover:bg-teal-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 mt-6"
      >
        Pagar
      </button>

      <div v-if="errorMessage" class="mt-4 text-red-500 text-sm font-medium">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="mt-4 text-green-600 text-sm font-medium">
        {{ successMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'
import { STRIPE_PUBLIC_KEY } from '@/config' // Importa a chave do arquivo de configuração

// Estados reativos para armazenar o valor, mensagens de erro e sucesso
const amount = ref<number | null>(null)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Variáveis para as instâncias do Stripe
let stripe: Stripe | null
let elements: StripeElements | null

/**
 * Hook do ciclo de vida que é chamado quando o componente é montado.
 * É aqui que inicializamos o Stripe e montamos o formulário do cartão.
 */
onMounted(async () => {
  if (!STRIPE_PUBLIC_KEY) {
    console.error('Chave pública do Stripe não definida. Por favor, configure-a em src/config.ts')
    errorMessage.value = 'Erro de configuração. Chave de pagamento ausente.'
    return
  }

  // Carrega a biblioteca do Stripe usando a chave pública
  const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)
  stripe = await stripePromise

  // Se o Stripe foi carregado com sucesso, cria os elementos da UI de pagamento
  if (stripe) {
    elements = stripe.elements()
    const cardElement = elements.create('card')
    // Injeta o elemento do cartão no div com id 'card-element'
    cardElement.mount('#card-element')
  } else {
    errorMessage.value = 'Falha ao carregar o Stripe. Tente novamente.'
  }
})

/**
 * Função chamada quando o formulário é submetido.
 * Esta é a lógica de pagamento, que será expandida na próxima etapa.
 */
const handleSubmit = async () => {
  // Limpa mensagens anteriores
  errorMessage.value = null
  successMessage.value = null

  // Validação básica do valor
  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'Por favor, insira um valor válido.'
    return
  }

  if (!stripe || !elements) {
    errorMessage.value = 'Erro ao inicializar o Stripe. Tente recarregar a página.'
    return
  }

  // A lógica de pagamento do Stripe virá aqui na próxima etapa.
  // Por agora, apenas exibimos o valor no console para fins de teste.
  console.log(`Valor a ser pago: R$${amount.value}`)
}
</script>
