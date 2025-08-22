<template>
  <!-- Container principal do formulário, com estilo elegante e centralizado -->
  <div class="bg-white p-8 rounded-lg shadow-md max-w-lg mx-auto">
    <!-- Título do formulário -->
    <h2 class="text-2xl text-gray-800 font-semibold mb-6 text-center">Detalhes do Pagamento</h2>

    <!-- O formulário em si, com um listener para o evento de submit -->
    <form @submit.prevent="handleSubmit">
      <!-- Container para o campo de input do valor -->
      <div class="mb-4">
        <label for="amount" class="block text-gray-700 font-medium mb-2">Valor a Pagar</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">R$</span>
          <!-- Campo para o usuário digitar o valor -->
          <input
            id="amount"
            type="number"
            v-model.number="amount"
            required
            class="w-full pl-8 pr-4 py-2 border rounded-md border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      <!-- Container para o elemento do cartão de crédito do Stripe -->
      <div id="card-element" class="mt-6 p-4 border rounded-md border-gray-300">
        <!-- O Stripe Elements irá injetar o formulário seguro do cartão aqui. -->
      </div>

      <!-- Botão para enviar o formulário -->
      <button
        type="submit"
        class="w-full bg-teal-500 text-white font-semibold py-3 px-4 rounded-md hover:bg-teal-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 mt-6"
        :disabled="processing"
      >
        <span v-if="!processing">Pagar</span>
        <span v-else>Processando...</span>
      </button>

      <!-- Seção para exibir mensagens de erro -->
      <div v-if="errorMessage" class="mt-4 text-red-500 text-sm font-medium">
        {{ errorMessage }}
      </div>

      <!-- Seção para exibir mensagens de sucesso -->
      <div v-if="successMessage" class="mt-4 text-green-600 text-sm font-medium">
        {{ successMessage }}
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'
import { STRIPE_PUBLIC_KEY } from '@/config'

// Estados reativos
const amount = ref<number | null>(null)
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)
const processing = ref<boolean>(false)

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

  const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)
  stripe = await stripePromise

  if (stripe) {
    elements = stripe.elements()
    const cardElement = elements.create('card')
    cardElement.mount('#card-element')
  } else {
    errorMessage.value = 'Falha ao carregar o Stripe. Tente novamente.'
  }
})

/**
 * Função chamada quando o formulário é submetido.
 * Esta é a lógica de pagamento completa.
 */
const handleSubmit = async () => {
  // Limpa mensagens anteriores e ativa o estado de processamento
  errorMessage.value = null
  successMessage.value = null
  processing.value = true

  // Validação básica do valor
  if (!amount.value || amount.value <= 0) {
    errorMessage.value = 'Por favor, insira um valor válido.'
    processing.value = false
    return
  }

  if (!stripe || !elements) {
    errorMessage.value = 'Erro ao inicializar o Stripe. Tente recarregar a página.'
    processing.value = false
    return
  }

  try {
    // Passo 1: Chama a função de back-end para criar a intenção de pagamento
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: amount.value }),
    })

    const { clientSecret, error: backendError } = await response.json()

    if (backendError) {
      errorMessage.value = backendError
      processing.value = false
      return
    }

    // Passo 2: Confirma o pagamento usando o client secret recebido
    const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement('card')!,
      },
    })

    if (error) {
      errorMessage.value = error.message || 'O pagamento falhou.'
    } else if (paymentIntent.status === 'succeeded') {
      successMessage.value = 'Pagamento realizado com sucesso!'
      // Aqui, você pode adicionar a lógica para redirecionar o usuário
      // para uma página de sucesso ou limpar o formulário.
    } else {
      errorMessage.value = 'O pagamento não foi processado completamente. Tente novamente.'
    }
  } catch (err) {
    console.error('Erro de rede:', err)
    errorMessage.value = 'Ocorreu um erro de conexão. Verifique sua rede e tente novamente.'
  } finally {
    processing.value = false
  }
}
</script>
