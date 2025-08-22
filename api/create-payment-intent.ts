import { VercelRequest, VercelResponse } from '@vercel/node'
import Stripe from 'stripe'
import Cors from 'cors'

// Inicialize o CORS
const cors = Cors({
  origin: true,
  methods: ['POST'],
})

// A chave secreta do Stripe será obtida de forma segura
// através das variáveis de ambiente do Vercel.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20', // Use a versão mais recente da API
})

/**
 * Helper para executar o middleware CORS
 * @param req - Objeto de requisição Vercel
 * @param res - Objeto de resposta Vercel
 * @param fn - Função do middleware com tipagem mais precisa
 * @returns Promise
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
      if (result instanceof Error) {
        return reject(result)
      }
      return resolve(result)
    })
  })
}

/**
 * A função principal da API.
 * @param req - A requisição HTTP
 * @param res - A resposta HTTP
 */
export default async (req: VercelRequest, res: VercelResponse) => {
  // Execute o middleware CORS
  await runCorsMiddleware(req, res, cors)

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método não permitido.' })
  }

  try {
    // Extrai o valor do corpo da requisição
    const { amount } = req.body

    console.log('Chave Stripe detectada?', process.env.STRIPE_SECRET_KEY ? 'Sim' : 'Não')
    console.log('Valor recebido amount:', amount)

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido ou ausente.' })
    }

    // Cria a intenção de pagamento no Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converte o valor para centavos
      currency: 'brl',
      payment_method_types: ['card'],
    })

    // Envia o "client secret" de volta para o front-end
    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (error) {
    console.error('Erro ao criar a intenção de pagamento:', error)
    return res.status(500).json({ error: 'Falha ao criar a intenção de pagamento.' })
  }
}
