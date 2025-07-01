"use client"
import React, { useEffect, useState } from 'react';
import { MetricsChart } from './components/MetricsChart';
import { ErrorTable } from './components/ErrorTable';

type Metric = {
  accepted: number;
  rejected: number;
  batch: number;
  ts: number;
};

type ErrorLog = {
  loanId: string;
  error: string;
  reason: string;
  ts: string;
};

export default function Home() {
  const [metrics, setMetrics] = useState<Metric>({ accepted: 0, rejected: 0, batch: 0, ts: Date.now() });
  const [errors, setErrors] = useState<ErrorLog[]>([]);

  useEffect(() => {
    const fetchMetrics = async () => {
      const res = await fetch('http://localhost:3000/metrics');
      const data = await res.json();
      setMetrics(data);
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetch('http://localhost:3000/errors')
      .then(res => res.json())
      .then(setErrors);
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>📊 Real-Time Loan Dashboard</h1>
      <MetricsChart accepted={metrics.accepted} rejected={metrics.rejected} />
      <h2 style={{ marginTop: 40 }}>🚨 Last 1000 Error Logs</h2>
      <ErrorTable logs={errors} />
    </div>
  );
}
