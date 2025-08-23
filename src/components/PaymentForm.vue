<template>
  <form
    id="payment-form"
    @submit.prevent="handleSubmit"
    class="max-w-md mx-auto bg-white backdrop-blur-sm shadow-md rounded-2xl p-6 space-y-4"
  >
    <!-- Nome -->
    <label class="block">
      <span class="text-gray-700 text-sm">Nome</span>
      <input
        v-model="name"
        type="text"
        required
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
        placeholder="Digite seu nome"
      />
    </label>

    <!-- E-mail -->
    <label class="block">
      <span class="text-gray-700 text-sm">E-mail</span>
      <input
        v-model="email"
        type="email"
        required
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
        placeholder="seu@email.com"
      />
    </label>

    <!-- Valor -->
    <label class="block">
      <span class="text-gray-700 text-sm">Valor (R$)</span>
      <input
        v-model.number="amount"
        type="number"
        min="1"
        required
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
        placeholder="Ex: 150"
      />
    </label>

    <!-- Stripe CardElement (permanece antes do botão) -->
    <div
      id="card-element"
      class="mt-1 p-3 rounded-xl border border-gray-200/50 bg-gray-50 transition focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/30"
    ></div>

    <button
      type="submit"
      class="w-full bg-teal-600 text-white font-medium py-3 rounded-xl shadow hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 transition"
      :disabled="loading"
    >
      {{ loading ? 'Processando...' : 'Pagar' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripeCardElement,
} from '@stripe/stripe-js'
import { STRIPE_PUBLIC_KEY } from '../config'

const name = ref('')
const email = ref('')
const amount = ref<number | null>(null)
const loading = ref(false)

let stripe: Stripe | null = null
let elements: StripeElements | null = null
let cardElement: StripeCardElement | null = null

onMounted(async () => {
  stripe = await loadStripe(STRIPE_PUBLIC_KEY)
  if (!stripe) {
    console.error('Falha ao carregar Stripe')
    return
  }

  elements = stripe.elements()

  // Estilização interna do CardElement (sem mudar posição/ordem)
  cardElement = elements.create('card', {
    hidePostalCode: true,
    style: {
      base: {
        fontSize: '16px',
        color: '#1f2937', // gray-800
        '::placeholder': { color: '#9ca3af' }, // gray-400
        fontFamily:
          '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      },
      invalid: { color: '#ef4444' }, // red-500
    },
  })

  cardElement.mount('#card-element')
})

async function handleSubmit() {
  if (!amount.value || amount.value <= 0) {
    alert('Informe um valor válido')
    return
  }

  loading.value = true

  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amount.value,
        name: name.value,
        email: email.value,
      }),
    })

    const data = await response.json()
    if (!data.clientSecret) throw new Error('Erro ao obter clientSecret')

    if (!stripe || !cardElement) throw new Error('Stripe não inicializado')

    const result = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: name.value, email: email.value },
      },
    })

    if (result.error) {
      alert('Erro no pagamento: ' + result.error.message)
    } else if (result.paymentIntent.status === 'succeeded') {
      alert('Pagamento realizado com sucesso!')
    }
  } catch (err) {
    console.error(err)
    alert('Falha ao processar pagamento.')
  } finally {
    loading.value = false
  }
}
</script>
