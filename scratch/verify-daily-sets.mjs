import fetch from 'node-fetch';

async function verifyDailySet(url, segmentName, expectedCount) {
  console.log(`\n================ Verify ${segmentName} ================`);
  console.log(`URL: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`HTTP Status: ${res.status}`);
    
    if (res.status !== 200) {
      const text = await res.text();
      console.error(`Error response: ${text}`);
      return false;
    }
    
    const body = await res.json();
    if (!body || !body.challenges) {
      console.error(`Invalid response body structure:`, body);
      return false;
    }
    
    const challenges = body.challenges;
    console.log(`Returned challenge count: ${challenges.length}`);
    
    // Check elements
    const orders = challenges.map(c => c.set_order);
    console.log(`Returned set_orders: [${orders.join(', ')}]`);
    
    // Validate answer exposure
    let answerExposed = false;
    challenges.forEach(c => {
      if ('answer' in c) {
        answerExposed = true;
        console.error(`❌ FAILURE: answer property is exposed! Object:`, c);
      }
    });
    
    if (!answerExposed) {
      console.log(`✅ SUCCESS: 'answer' property is successfully hidden (never exposed).`);
    } else {
      return false;
    }

    // Verify correct slot ranges
    if (segmentName === 'Standard Daily Set') {
      const outOfRange = orders.some(o => o < 1 || o > 5);
      if (outOfRange) {
        console.error(`❌ FAILURE: Standard daily set returned orders outside of 1-5!`);
        return false;
      }
      console.log(`✅ SUCCESS: Standard daily set returned slots 1-5 only.`);
    } else if (segmentName === 'Reflection-1') {
      const outOfRange = orders.some(o => o < 6 || o > 8);
      if (outOfRange) {
        console.error(`❌ FAILURE: Reflection-1 returned orders outside of 6-8!`);
        return false;
      }
      console.log(`✅ SUCCESS: Reflection-1 returned slots 6-8 only.`);
    } else if (segmentName === 'Reflection-2') {
      const outOfRange = orders.some(o => o < 9 || o > 10);
      if (outOfRange) {
        console.error(`❌ FAILURE: Reflection-2 returned orders outside of 9-10!`);
        return false;
      }
      console.log(`✅ SUCCESS: Reflection-2 returned slots 9-10 only.`);
    } else if (segmentName === 'Reflection-3') {
      const outOfRange = orders.some(o => o !== 11);
      if (outOfRange) {
        console.error(`❌ FAILURE: Reflection-3 returned orders other than 11!`);
        return false;
      }
      console.log(`✅ SUCCESS: Reflection-3 returned slot 11 only.`);
    }
    
    return true;
  } catch (err) {
    console.error(`Error during verification:`, err);
    return false;
  }
}

async function runAllVerifications() {
  const tests = [
    { url: 'http://localhost:3000/api/daily-set', name: 'Standard Daily Set', expected: 5 },
    { url: 'http://localhost:3000/api/daily-set?mode=reflection-1', name: 'Reflection-1', expected: 3 },
    { url: 'http://localhost:3000/api/daily-set?mode=reflection-2', name: 'Reflection-2', expected: 2 },
    { url: 'http://localhost:3000/api/daily-set?mode=reflection-3', name: 'Reflection-3', expected: 1 },
  ];
  
  let allPassed = true;
  for (const t of tests) {
    const passed = await verifyDailySet(t.url, t.name, t.expected);
    if (!passed) allPassed = false;
  }
  
  console.log('\n======================================================');
  if (allPassed) {
    console.log('🎉 ALL GAME SLOT AND REFLECTION SEGMENT TESTS PASSED PERFECTLY!');
  } else {
    console.error('❌ SOME TESTS FAILED. Please review the output above.');
  }
  console.log('======================================================\n');
}

runAllVerifications();
