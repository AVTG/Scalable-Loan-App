import Fastify from 'fastify';
import dotenv from 'dotenv';
import { LoanSchema } from '../types/loan.js';
import { redis } from '../lib/redis.js';

dotenv.config();
const fastify = Fastify({ logger: true, bodyLimit: 16_384 });
fastify.register(require('@fastify/cors'));

fastify.post('/loan', async (req, reply) => {
  const result = LoanSchema.safeParse(req.body);
  if (!result.success) {
    return reply.code(400).send({ error: 'Invalid loan data', issues: result.error.format() });
  }
  const loan = result.data;
  await redis.xadd(
    'loans', '*',
    'loanId', loan.loanId,
    'payload', JSON.stringify(loan)
  );
  return { status: 'queued', loanId: loan.loanId };
});

fastify.get('/metrics', async (req, reply) => {
  const res = await redis.xrevrange('loan_metrics', '+', '-', 'COUNT', 1);
  if (res.length === 0) return { accepted: 0, rejected: 0, batch: 0, ts: 0 };

  const [, fields] = res[0];
  const data: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    data[fields[i]] = fields[i + 1];
  }

  return {
    accepted: parseInt(data.accepted || '0'),
    rejected: parseInt(data.rejected || '0'),
    batch: parseInt(data.batch || '0'),
    ts: Number(data.ts || Date.now()),
  };
});

fastify.get('/errors', async (req, reply) => {
  const res = await redis.xrevrange('loan_errors', '+', '-', 'COUNT', 1000);
  return res.map(([id, fields]) => {
    const entry: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
      entry[fields[i]] = fields[i + 1];
    }
    return entry;
  });
});


fastify.listen({ port: Number(process.env.PORT) || 3000, host: '0.0.0.0' })
  .then(() => fastify.log.info('API up'))
  .catch(e => { fastify.log.error(e); process.exit(1); });
