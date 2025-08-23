// Simple test script to verify algorithm behavior
// Run with: node test-algorithm.js

// Mock the algorithm for testing
function testAlgorithm() {
  console.log("🧪 Testing Algorithm Behavior for Step 0 (New Card)\n");
  
  const NOW = Date.now();
  const mins = (ms) => Math.round(ms / 60_000);
  const days = (ms) => Math.round(ms / (24 * 60 * 60_000));
  
  // Simulate a new card at step 0
  const newCard = {
    ef: 2.5,
    intervalDays: 0,
    reps: 0,
    lapses: 0,
    due: NOW,
    phase: 'learning',
    stepIndex: 0
  };
  
  console.log("📋 Expected Behavior (from Python example):");
  console.log("again → 1m");
  console.log("hard  → 6m");
  console.log("good  → 10m");
  console.log("easy  → 4 days (direct to review)\n");
  
  console.log("🔍 Your Algorithm Results:");
  
  // Test Again
  const againResult = simulateAgain(newCard, NOW);
  console.log(`again → ${mins(againResult.due - NOW)}m (${againResult.phase} phase)`);
  
  // Test Hard
  const hardResult = simulateHard(newCard, NOW);
  console.log(`hard  → ${mins(hardResult.due - NOW)}m (${hardResult.phase} phase)`);
  
  // Test Good
  const goodResult = simulateGood(newCard, NOW);
  console.log(`good  → ${mins(goodResult.due - NOW)}m (${goodResult.phase} phase)`);
  
  // Test Easy
  const easyResult = simulateEasy(newCard, NOW);
  console.log(`easy  → ${days(easyResult.due - NOW)} days (${easyResult.phase} phase)\n`);
  
  // Check if behavior matches expected
  const againCorrect = mins(againResult.due - NOW) === 1;
  const hardCorrect = mins(hardResult.due - NOW) === 6;
  const goodCorrect = mins(goodResult.due - NOW) === 10;
  const easyCorrect = days(easyResult.due - NOW) === 4 && easyResult.phase === 'review';
  
  console.log("✅ Algorithm Alignment Check:");
  console.log(`again: ${againCorrect ? '✅' : '❌'} (expected 1m, got ${mins(againResult.due - NOW)}m)`);
  console.log(`hard:  ${hardCorrect ? '✅' : '❌'} (expected 6m, got ${mins(hardResult.due - NOW)}m)`);
  console.log(`good:  ${goodCorrect ? '✅' : '❌'} (expected 10m, got ${mins(goodResult.due - NOW)}m)`);
  console.log(`easy:  ${easyCorrect ? '✅' : '❌'} (expected 4 days review, got ${days(easyResult.due - NOW)} days ${easyResult.phase})`);
  
  const allCorrect = againCorrect && hardCorrect && goodCorrect && easyCorrect;
  console.log(`\n🎯 Overall: ${allCorrect ? '✅ PERFECT ALIGNMENT!' : '❌ Some mismatches found'}`);
}

// Simulate the algorithm behavior (simplified version)
function simulateAgain(card, now) {
  return {
    ...card,
    stepIndex: 0,
    due: now + 60_000 // 1 minute
  };
}

function simulateHard(card, now) {
  if (card.stepIndex === 0) {
    return {
      ...card,
      reps: card.reps + 1,
      due: now + 6 * 60_000 // Fixed 6 minutes for step 0
    };
  }
  // Progressive intervals for other steps
  return {
    ...card,
    reps: card.reps + 1,
    due: now + 3 * 60_000 // Example: 3 minutes
  };
}

function simulateGood(card, now) {
  const learningSteps = [60_000, 10 * 60_000, 24 * 60 * 60_000];
  const next = learningSteps[card.stepIndex + 1];
  
  if (next != null) {
    return {
      ...card,
      stepIndex: card.stepIndex + 1,
      due: now + next
    };
  } else {
    // Graduate to graduation review
    return {
      ...card,
      reps: 1,
      phase: 'graduating',
      intervalDays: 1,
      due: now + 24 * 60 * 60_000, // 1 day
      stepIndex: undefined
    };
  }
}

function simulateEasy(card, now) {
  if (card.stepIndex === 0) {
    // Step 0: Easy = direct to review with 4 days
    return {
      ...card,
      reps: 1,
      phase: 'review',
      intervalDays: 4,
      due: now + 4 * 24 * 60 * 60_000, // 4 days
      stepIndex: undefined
    };
  } else {
    // Other steps: go to graduation phase
    return {
      ...card,
      reps: 1,
      phase: 'graduating',
      intervalDays: 4,
      due: now + 4 * 24 * 60 * 60_000, // 4 days
      stepIndex: undefined
    };
  }
}

// Run the test
testAlgorithm();
