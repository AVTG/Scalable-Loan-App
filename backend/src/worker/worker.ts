import { MongoClient, AnyBulkWriteOperation } from 'mongodb';
import Redis from 'ioredis';
import dotenv from 'dotenv';
import { redis } from '../lib/redis.js';
import { Loan, LoanSchema } from '../types/loan.js';

dotenv.config();

const MIN_MONTHLY = Number(process.env.MIN_MONTHLY_RS) || 1_000;
const BATCH = Number(process.env.BATCH_SIZE) || 50;
const stream = 'loans';
const group = 'g';
const cid = `worker-${process.env.HOSTNAME ?? process.pid}`;

type RedisEntry = [id: string, fields: string[]];

function toObject(fields: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < fields.length; i += 2) {
    obj[fields[i]] = fields[i + 1];
  }
  return obj;
}

async function ensureGroup() {
  try {
    await redis.xgroup('CREATE', stream, group, '$', 'MKSTREAM');
  } catch (e: any) {
    if (!e.message.includes('BUSYGROUP')) throw e;
  }
}

async function run() {
  const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  const pipeline = redis.pipeline();
  const mongo = new MongoClient(process.env.MONGO_URL!);
  await mongo.connect();

  const loans = mongo.db('loandb').collection<Loan & { status: string; processedAt: Date }>('loans');
  await loans.createIndex({ loanId: 1 }, { unique: true });

  await ensureGroup();
  console.log(`[${cid}] Ready`);

  while (true) {
    const res = await redis.xreadgroup(
      'GROUP', group, cid,
      'COUNT', BATCH,
      'BLOCK', 5000,
      'STREAMS', stream, '>'
    );
    if (!res) continue ;

    const [, entries] = res[0] as [string, RedisEntry[]];

    const ids: string[] = [];
    const bulk: AnyBulkWriteOperation<any>[] = [];
    let accepted = 0, rejected = 0, errr = 0;

    for (const [id, rawFields] of entries) {
      ids.push(id);

      const f = toObject(rawFields);
      let loan: Loan;

      try {
        loan = LoanSchema.parse(JSON.parse(f.payload));
      } catch (err) {
        var reason = err instanceof Error? err.message : 'unknown'
        pipeline.xadd(
          'loan_errors',
          'MAXLEN', '~', 1000,
          '*',
          'loanId', f.loanId ?? 'unknown',
          'error', 'Parsing Failed',
          'reason', reason,
          'ts', Date.now().toString()
        );
        errr++ ;
        continue;
      }
      
      const monthly = loan.amount / loan.term;
      if (monthly < MIN_MONTHLY) {
        pipeline.xadd(
          'loan_errors',
          'MAXLEN', '~', 1000,
          '*',
          'loanId', loan.loanId ?? 'unknown',
          'error', 'Loan Rejected',
          'reason', 'Loan terms dont suits company policy',
          'ts', Date.now().toString()
        );
        rejected++;
        continue; // rejected due to less loan amount or more duration
      }

      accepted++;
      bulk.push({
        updateOne: {
          filter: { loanId: loan.loanId },
          update: {
            $setOnInsert: {
              ...loan,
              status: 'processed',
              processedAt: new Date(),
            },
          },
          upsert: true,
        },
      });
    }
    var result
    if (bulk.length) {
      result = await loans.bulkWrite(bulk, { ordered: false });
      // await loans.bulkWrite(bulk, { ordered: false });
      console.log("Inserted:", result.upsertedCount);
    }
    result === undefined ? result = 0 : result = result;

    await pipeline.exec();
    await redis.xadd(
      'loan_metrics',
      'MAXLEN', '~', 1000,
      '*',
      'accepted', result.toString(),
      'error', errr.toString(),
      'rejected', rejected.toString(),
      'batch', ids.length.toString(),
      'ts', Date.now().toString()
    );
    await redis.xack(stream, group, ...ids);

    console.log(`[${cid}] Accepted: ${accepted}, Rejected: ${rejected}`);
  }
}

run().catch(err => {
  console.error(`[${cid}] Fatal error:`, err);
  process.exit(1);
});
