<template>
  <form
    id="payment-form"
    @submit.prevent="handleSubmit"
    class="max-w-md mx-auto bg-white backdrop-blur-sm shadow-md rounded-2xl p-6 space-y-4"
  >
    <label class="block">
      <span class="text-gray-700 text-sm">Nome</span>
      <input
        v-model="name"
        type="text"
        required
        placeholder="Digite seu nome"
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
      />
    </label>

    <label class="block">
      <span class="text-gray-700 text-sm">E-mail</span>
      <input
        v-model="email"
        type="email"
        required
        placeholder="seu@email.com"
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
      />
    </label>

    <label class="block">
      <span class="text-gray-700 text-sm">Valor (R$)</span>
      <input
        v-model.number="amount"
        type="number"
        min="1"
        step="0.01"
        required
        placeholder="Ex: 150"
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 placeholder-gray-400 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
      />
    </label>

    <label class="block" v-if="amount && amount >= minParcelamento">
      <span class="text-gray-700 text-sm">Número de Parcelas</span>
      <select
        v-model.number="installments"
        required
        class="mt-1 block w-full rounded-xl border border-gray-200/50 bg-gray-50 p-2.5 text-gray-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
      >
        <option v-for="option in calculatedInstallments" :key="option.count" :value="option.count">
          {{ option.count }}x de {{ option.formattedValue }}
          <span v-if="option.hasInterest">({{ option.formattedTotal }} com juros)</span>
          <span v-else>(sem juros)</span>
        </option>
      </select>
    </label>
    <p v-if="amount && amount < minParcelamento" class="text-xs text-red-500">
      O parcelamento está disponível apenas para valores iguais ou superiores a R${{
        minParcelamento
      }}.
    </p>

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
import { ref, onMounted, watch, computed } from 'vue'
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripeCardElement,
} from '@stripe/stripe-js'
import { STRIPE_PUBLIC_KEY } from '../config'

// Define o novo valor mínimo para habilitar o parcelamento
const minParcelamento = 5

// Campos do formulário
const name = ref('')
const email = ref('')
const amount = ref<number | null>(null)
const installments = ref<number | null>(1) // Define 1 como valor padrão
const loading = ref(false)

// Referências do Stripe
let stripe: Stripe | null = null
let elements: StripeElements | null = null
let cardElement: StripeCardElement | null = null

// Emit para avisar o componente pai
// A emissão foi restaurada para um evento simples 'payment-success', sem enviar dados
const emit = defineEmits<{
  (e: 'payment-success'): void
}>()

// --- Lógica para o novo recurso de juros e parcelamento ---

// Taxa de juros mensal para parcelas com juros (ex: 1.99%)
const monthlyInterestRate = 0.0199
// Opções de parcelamento disponíveis, com indicação se há juros
const installmentsOptions = [
  { count: 1, hasInterest: false },
  { count: 2, hasInterest: false },
  { count: 3, hasInterest: false },
  { count: 4, hasInterest: true },
  { count: 5, hasInterest: true },
  { count: 6, hasInterest: true },
  { count: 10, hasInterest: true },
  { count: 12, hasInterest: true },
]

/**
 * Calcula o valor da parcela usando a fórmula da Tabela Price.
 * @param principal O valor principal a ser financiado.
 * @param rate A taxa de juros mensal em formato decimal (ex: 0.0199 para 1.99%).
 * @param nper O número de parcelas.
 * @returns O valor de cada parcela.
 */
const calculateInstallment = (principal: number, rate: number, nper: number): number => {
  if (rate === 0) {
    return principal / nper
  }
  return (principal * rate) / (1 - Math.pow(1 + rate, -nper))
}

/**
 * Formata um valor numérico para o formato de moeda BRL.
 * @param value O valor a ser formatado.
 * @returns A string formatada.
 */
const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// Propriedade computada que gera dinamicamente as opções de parcelamento
// com seus respectivos valores de parcela e valor total.
const calculatedInstallments = computed(() => {
  if (!amount.value || amount.value < minParcelamento) {
    // Retorna apenas a opção de 1x se o valor for baixo
    return [
      {
        count: 1,
        total: amount.value || 0,
        value: amount.value || 0,
        formattedValue: formatCurrency(amount.value || 0),
        formattedTotal: formatCurrency(amount.value || 0),
        hasInterest: false,
      },
    ]
  }

  // Mapeia as opções de parcelamento para calcular os valores com ou sem juros
  return installmentsOptions.map((option) => {
    const value = option.hasInterest
      ? calculateInstallment(amount.value!, monthlyInterestRate, option.count)
      : amount.value! / option.count
    const total = value * option.count

    return {
      count: option.count,
      value: value,
      total: total,
      formattedValue: formatCurrency(value),
      formattedTotal: formatCurrency(total),
      hasInterest: option.hasInterest,
    }
  })
})

// Observa mudanças no valor e ajusta o campo de parcelas
watch(amount, (newAmount) => {
  if (newAmount && newAmount < minParcelamento) {
    installments.value = 1 // Reseta para 1x se o valor for muito baixo
  }
})

// --- Lógica existente do Stripe ---

// Inicializa Stripe e monta CardElement
onMounted(async () => {
  stripe = await loadStripe(STRIPE_PUBLIC_KEY)
  if (!stripe) {
    console.error('Falha ao carregar Stripe')
    return
  }

  elements = stripe.elements()
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

// Função de envio do formulário
async function handleSubmit() {
  if (!amount.value || amount.value <= 0) {
    alert('Informe um valor válido')
    return
  }

  loading.value = true

  try {
    // Encontra a opção de parcela selecionada para obter o valor total com juros
    const selectedOption = calculatedInstallments.value.find((o) => o.count === installments.value)
    if (!selectedOption) {
      alert('Selecione uma opção de parcelamento válida')
      loading.value = false
      return
    }

    // Cria PaymentIntent no backend
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: selectedOption.total, // Envia o valor TOTAL (com juros, se houver) para o back-end
        name: name.value,
        email: email.value,
        installments: installments.value, // Envia o número de parcelas para o back-end
      }),
    })

    const data = await response.json()
    if (!data.clientSecret) throw new Error('Erro ao obter clientSecret')
    if (!stripe || !cardElement) throw new Error('Stripe não inicializado')

    // Confirma pagamento no Stripe
    // 👉 Agora também enviamos as informações de PARCELAMENTO no confirmCardPayment
    const result = await stripe.confirmCardPayment(data.clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: { name: name.value, email: email.value },
      },
      payment_method_options: {
        card: {
          installments: {
            plan: {
              count: installments.value!, // número de parcelas escolhidas
              interval: 'month', // intervalo mensal
              type: 'fixed_count', // número fixo de parcelas
            },
          },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any,
    })

    if (result.error) {
      alert('Erro no pagamento: ' + result.error.message)
    } else if (result.paymentIntent.status === 'succeeded') {
      // Dispara evento de sucesso e limpa campos
      emit('payment-success')
      name.value = ''
      email.value = ''
      amount.value = null
      installments.value = 1 // Limpa o campo de parcelas, voltando para o valor padrão
      cardElement?.clear()
    }
  } catch (err) {
    console.error(err)
    alert('Falha ao processar pagamento.')
  } finally {
    loading.value = false
  }
}
</script>
