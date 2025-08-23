import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import Cors from 'cors'

// Inicializa o CORS
const cors = Cors({
  origin: true,
  methods: ['POST'],
})

// Inicializa Stripe usando a chave secreta do Vercel
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2025-07-30.basil', // ajuste para versão correta
})

/**
 * Middleware para CORS
 */
function runCorsMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  fn: (
    req: VercelRequest,
    res: VercelResponse,
    next: (arg: unknown) => void,
  ) => void | Promise<void>,
) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) return reject(result)
      resolve(result)
    })
  })
}

/**
 * Função principal da API (Serverless)
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Executa CORS
  await runCorsMiddleware(req, res, cors)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido.' })
  }

  try {
    const { amount, name, email, installments, paymentMethodId } = req.body

    if (!paymentMethodId) {
      return res.status(400).json({ error: 'ID do método de pagamento ausente.' })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido ou ausente.' })
    }

    // Apenas verifica se installments é um número válido se ele existir
    if (installments && (typeof installments !== 'number' || installments <= 0)) {
      return res.status(400).json({ error: 'Número de parcelas inválido.' })
    }

    // Corrigindo o erro de tipagem de payment_method_options
    const installmentPlan: Stripe.PaymentIntentCreateParams.PaymentMethodOptions =
      installments > 0
        ? {
            card: {
              installments: {
                enabled: true,
                plan: {
                  count: installments,
                  interval: 'month',
                  type: 'fixed_count',
                },
              },
            },
          }
        : {}

    // Cria a Intenção de Pagamento
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'brl',
      payment_method: paymentMethodId,
      receipt_email: email,
      metadata: {
        customer_name: name,
        customer_email: email,
      },
      confirm: true,
      payment_method_options: installmentPlan,
      confirmation_method: 'automatic',
      return_url: `https://my-payment-xi.vercel.app/`,
    })

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (err: unknown) {
    if (err instanceof Error) {
      // AQUI
      console.error('Erro de validação da Stripe:', err.message)
      return res.status(400).json({ error: err.message })
    }
    // Para todos os outros erros, retornamos a mensagem genérica
    console.error('Erro ao criar intenção de pagamento:', err)
    return res.status(500).json({ error: 'Falha ao criar a intenção de pagamento.' })
  }
}
