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

    if (!installments || typeof installments !== 'number' || installments <= 0) {
      return res.status(400).json({ error: 'Número de parcelas inválido ou ausente.' })
    }

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
      payment_method_options: {
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
      },
      // Adicionamos um parâmetro de confirmação que também inclui o `return_url`.
      // Como o PaymentIntent é criado e confirmado em uma única chamada,
      // ele precisa de uma URL de retorno para autenticação 3D Secure.
      // O `return_url` deve ser a URL do seu site, onde o cliente irá retornar após a confirmação.
      confirmation_method: 'automatic',
      return_url: `https://my-payment-xi.vercel.app/`,
    })

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (err: unknown) {
    console.error('Erro ao criar intenção de pagamento:', err)
    return res.status(500).json({ error: 'Falha ao criar a intenção de pagamento.' })
  }
}
