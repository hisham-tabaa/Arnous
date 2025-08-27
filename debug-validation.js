// Simple test to check what validation error is being thrown
const testData = {
  USD: { buyRate: 15000, sellRate: 15100 },
  EUR: { buyRate: 16600, sellRate: 16500 } // This should fail validation
};

console.log('Testing currency validation...');
console.log('Test data:', testData);

// Simulate the validation logic from the frontend
Object.keys(testData).forEach(key => {
  const currency = testData[key];
  const buyRate = parseFloat(currency.buyRate);
  const sellRate = parseFloat(currency.sellRate);
  
  console.log(`\n${key}:`);
  console.log(`  Buy Rate: ${buyRate}`);
  console.log(`  Sell Rate: ${sellRate}`);
  console.log(`  Valid Numbers: ${!isNaN(buyRate) && !isNaN(sellRate)}`);
  console.log(`  Positive Values: ${buyRate > 0 && sellRate > 0}`);
  console.log(`  Sell > Buy: ${sellRate > buyRate}`);
  
  if (sellRate <= buyRate) {
    console.log(`  ❌ VALIDATION ERROR: Sell rate (${sellRate}) must be greater than buy rate (${buyRate})`);
  } else {
    console.log(`  ✅ VALIDATION PASSED`);
  }
});