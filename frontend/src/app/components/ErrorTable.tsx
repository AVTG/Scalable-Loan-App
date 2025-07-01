import React from 'react';

type ErrorLog = {
  loanId: string;
  error: string;
  reason: string;
  ts: string;
};

type Props = {
  logs: ErrorLog[];
};

export const ErrorTable: React.FC<Props> = ({ logs }) => {
  return (
    <table>
      <thead>
        <tr>
          <th>Loan ID</th>
          <th>Error</th>
          <th>Reason</th>
          <th>Timestamp</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log, idx) => (
          <tr key={idx}>
            <td>{log.loanId}</td>
            <td>{log.error}</td>
            <td>{log.reason}</td>
            <td>{new Date(Number(log.ts)).toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
