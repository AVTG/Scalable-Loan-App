import { redis } from '../lib/redis.js';
import dotenv from 'dotenv';
import { LoanSchema } from '../types/loan.js';
dotenv.config();


const RECLAIM_CONSUMER = `reclaimer-${process.pid}`;
const STREAM = 'loans';
const GROUP = 'g';
const MIN_IDLE_MS = 60000;
const BATCH = 100;
type RedisEntry = [id: string, fields: string[]];

function toObject(fields: string[]): Record<string, string> {
    const obj: Record<string, string> = {};
    for (let i = 0; i < fields.length; i += 2) {
        obj[fields[i]] = fields[i + 1];
    }
    return obj;
}


async function reclaimLoop() {
    const pipeline = redis.pipeline();
    for (; ;) {
        const [nexID, msgs] = await redis.xautoclaim(
            STREAM, GROUP, RECLAIM_CONSUMER,
            MIN_IDLE_MS, '0-0', 'COUNT', BATCH
        ) as [string, RedisEntry[]];

        if (msgs.length === 0) {
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        for (const [id, fields] of msgs as [string, string[]][]) {
            const f = toObject(fields);
            let loan = LoanSchema.parse(JSON.parse(f.payload));
            pipeline.xadd(
                'loans', '*',
                'loanId', f.loanId,
                'payload', JSON.stringify(loan)
            );
            await redis.xack(STREAM, GROUP, id);
        }
        pipeline.exec() ;
    }
}
reclaimLoop().catch(console.error);
