// Native fetch is available in Node 18+

async function testSync() {
    console.log('Testing Sync API at http://127.0.0.1:9002/api/internal/sync...');
    try {
        const response = await fetch('http://127.0.0.1:9002/api/internal/sync', {
            method: 'POST'
        });

        console.log(`Status: ${response.status}`);
        const data = await response.json();
        console.log('Response:', data);

        if (response.ok && data.success) {
            console.log('TEST PASSED: Sync API works.');
        } else {
            console.error('TEST FAILED: API returned error.');
            process.exit(1);
        }
    } catch (error) {
        console.error('TEST FAILED: Network error:', error);
        process.exit(1);
    }
}

testSync();
