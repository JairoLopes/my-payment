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
  apiVersion: '2025-07-30.basil', // versão ES Module compatível
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
    // Debug: verificar chave e valor recebido
    console.log('Stripe Secret Key presente?', !!process.env.STRIPE_SECRET_KEY)
    console.log('Valor recebido:', req.body.amount)

    const { amount } = req.body

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido ou ausente.' })
    }

    // Cria a Intenção de Pagamento
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // centavos
      currency: 'brl',
      payment_method_types: ['card'],
    })

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (err: unknown) {
    console.error('Erro ao criar intenção de pagamento:', err)
    return res.status(500).json({ error: 'Falha ao criar a intenção de pagamento.' })
  }
}
