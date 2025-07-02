const fs = require('fs');

const NUM_LOANS = 500;
const loans = [];

for (let i = 0; i < 2*NUM_LOANS; i=i+2) {
  const id = 1001 + i;
  const amount = 10000 ; 
  const term = 1;         
  

  loans.push({
    loanId: `L${id}`,
    amount,
    term
  });
  loans.push({
    loanId: `L${id+1}`,
    amount,
    term:term+11
  });
}

fs.writeFileSync('loan_data_1000.json', JSON.stringify(loans, null, 2));
console.log('Generated loan_data_1000.json');
