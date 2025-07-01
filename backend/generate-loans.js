const fs = require('fs');

const NUM_LOANS = 500;
const loans = [];

for (let i = 0; i < NUM_LOANS; i++) {
  const id = 100001 + i;
  const amount = 1000 ; 
  const term = 1;         
  

  loans.push({
    loanId: `L${id}`,
    amount,
    term
  });
}
for (let i = 500; i < 1000; i++) {
  const id = 100001 + i;
  const amount = 10000 ; 
  const term = 12;         
  

  loans.push({
    loanId: `L${id}`,
    amount,
    term
  });
}

fs.writeFileSync('loan_data_1000.json', JSON.stringify(loans, null, 2));
console.log('✅ Generated loan_data_500.json');
