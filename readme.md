# Preview Links
Frontend: http://ec2-13-235-243-187.ap-south-1.compute.amazonaws.com:3001/  
Backend: http://ec2-13-235-243-187.ap-south-1.compute.amazonaws.com:3000/   







## Architecture

```
                  ┌──────────────────────────┐        Polling        ┌───────────────────────┐
                  │        Frontend          │ <──────────────────── │      Fastify API       │
                  │  Next.js @ port 3001     │  /metrics /errors     │  (Node 20, port 3000)  │
                  └──────────┬───────────────┘                       └──────┬─────────────────┘
                             │ REST        ▲                                │ publish
                             │ loan JSON   │                                │ XADD loans:in
                             ▼             │                                ▼
                                                                   ┌────────┴─────────────────┐
                                                                   │     Redis Cluster        │
                                                                   │  • Stream1:  loans       │
                                                                   │  • Stream1:  loan_error  │
                                                                   │  • Stream1:  loan_metrics│
                                                                   │  • Group1   worker1      │
                                                                   │  • Group2   worker2      │
                                                                   └─────────┬────────────────┘
                                                                             │ XPENDING    ▲
                                  Consumer Group "workers1" &  "workers1"    │ XREADGROUP  │
                                                                             ▼             │
                                                                   ┌───────────────────────────┐
                                                                   │  Worker Pods (1‑N)        │
                                                                   │  - Validate & enrich      │
                                                                   │  - Pending requests       │
                                                                   │  - Write                  │
                                                                   └─────────────┬─────────────┘
                                                                                 │         
                                                                                 ▼         
                                                                           ┌────────────┐ 
                                                                           │ MongoDB    │ 
                                                                           └────────────┘ 
```

# Backend Endpoints
post(/loan) - for posting the loan application  
get(/metrics) - number of applications accepted and regected for the bar charts  
get(/error) - logs of rejected applications with valid rejection reason  



## Generating & Sending Batched Loan Data (Batch 1)
 1.  Generate loan data [`generate-loan.js`](./backend/generate-loans.js)
 2.  Locate the file generated [`loan_data1000.js`](./backend/loan_data1000.js)
 3.  Locate script [`sent.js`](./backend/sent.js) and change the backend URL to AWS(or) any server's link followed by port number(3000) and api endpoint (/loan)
 4.  Batch Send all the data via Script [`sent.js`](./backend/sent.js)
```
node generate-loan.js
node sent.js

```





### Commands to start the Project

```
docker run -d -p 6379:6379 redis  
docker run -d -p 27017:27017 mongo
```

In ./backend
```
npm install
npm run dev:api
npm run dev:worker #for N forkers run N time (Recommended 4-5)
npm run dev:worker2 #for N worker of type2 run N time (Recommended 1-2)
```



In ./frontend
```
npm install
npm run dev
```
