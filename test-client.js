import fetch from 'node-fetch';

async function testPixelPolish() {
  const API_URL = 'http://localhost:3002';
  
  // Test URLs to analyze
  const testUrls = [
    'https://example.com',
    'https://github.com',
    'https://stackoverflow.com'
  ];

  console.log('🚀 Testing PixelPolish Agent');
  console.log('===========================\n');

  // Check if server is running
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server is healthy:', healthData);
  } catch (error) {
    console.error('❌ Server is not running. Please start with: npm start');
    return;
  }

  // Test each URL
  for (const url of testUrls) {
    console.log(`\n📊 Analyzing: ${url}`);
    console.log('─'.repeat(50));

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const endTime = Date.now();

      console.log(`⏱️  Analysis completed in ${endTime - startTime}ms`);
      console.log(`📈 Overall Score: ${result.data.analysis.scorePercentage}%`);
      console.log(`🔍 Total Issues: ${result.data.analysis.summary.totalIssues}`);
      
      // Show severity breakdown
      const severity = result.data.analysis.summary.severityCounts;
      console.log(`   └─ Critical: ${severity.critical}, High: ${severity.high}, Medium: ${severity.medium}, Low: ${severity.low}`);
      
      // Show DOM stats
      console.log(`🏗️  DOM Elements: ${result.data.dom.totalElements}`);
      console.log(`📋 Page Title: ${result.data.dom.title}`);
      
      // Show top issues
      if (result.data.analysis.issues.length > 0) {
        console.log('\n🔴 Top Issues:');
        result.data.analysis.issues.slice(0, 3).forEach((issue, index) => {
          console.log(`   ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}`);
        });
      }

      // Show top recommendations
      if (result.data.analysis.recommendations.length > 0) {
        console.log('\n💡 Top Recommendations:');
        result.data.analysis.recommendations.slice(0, 3).forEach((rec, index) => {
          console.log(`   ${index + 1}. ${rec.message}`);
        });
      }

      // Show rule breakdown
      console.log('\n📊 Rule Breakdown:');
      result.data.analysis.ruleResults.forEach(rule => {
        const percentage = rule.maxScore > 0 ? Math.round((rule.score / rule.maxScore) * 100) : 0;
        console.log(`   ${rule.ruleName}: ${percentage}% (${rule.score}/${rule.maxScore})`);
      });

    } catch (error) {
      console.error(`❌ Failed to analyze ${url}:`, error.message);
    }
  }

  console.log('\n✨ Testing completed!');
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testPixelPolish().catch(console.error);
}

export { testPixelPolish }; 