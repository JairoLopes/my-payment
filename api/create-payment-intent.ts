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
    // Extrai os campos da requisição.
    // O valor de 'amount' agora já inclui o juros, se houver, calculado no front-end.
    // O novo campo `paymentMethodId` é crucial para esta correção.
    const { amount, name, email, installments, paymentMethodId } = req.body

    // Adiciona uma validação para o novo campo
    if (!paymentMethodId) {
      return res.status(400).json({ error: 'ID do método de pagamento ausente.' })
    }

    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido ou ausente.' })
    }

    // Adiciona validação para o número de parcelas
    if (!installments || typeof installments !== 'number' || installments <= 0) {
      return res.status(400).json({ error: 'Número de parcelas inválido ou ausente.' })
    }

    // A validação de valor mínimo (R$50,00) para parcelamento foi movida para o front-end,
    // garantindo que o back-end só receba requisições válidas.

    // Cria a Intenção de Pagamento
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Converte o valor total para centavos
      currency: 'brl',
      // Anteriormente, a intenção de pagamento era criada sem um método de pagamento.
      // O Stripe Elements agora cria o método de pagamento no front-end e o envia para cá.
      // Agora, associamos o `paymentMethodId` recebido na requisição.
      payment_method: paymentMethodId,
      receipt_email: email, // Stripe manda recibo automático
      metadata: {
        customer_name: name,
        customer_email: email,
      },
      // Adicionamos a propriedade `confirm: true` para que o Stripe crie e confirme
      // a intenção de pagamento na mesma chamada, pois o método de pagamento já foi fornecido.
      confirm: true,
      // A configuração de parcelamento agora é processada junto com o método de pagamento.
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
    })

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    })
  } catch (err: unknown) {
    console.error('Erro ao criar intenção de pagamento:', err)
    return res.status(500).json({ error: 'Falha ao criar a intenção de pagamento.' })
  }
}
