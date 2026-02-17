const apiBase = 'http://127.0.0.1:4000/api';

async function runQA() {
    console.log('🚀 Starting Backend QA Check...\n');

    // 1. Health Check
    try {
        const res = await fetch(`${apiBase}/health/stats`);
        const health = await res.json();
        console.log('✅ Health/Stats:', health.success ? 'OK' : 'FAIL');
    } catch (e) {
        console.log('❌ Health/Stats: FAIL', e.cause || e.message);
    }

    // 2. Prefectures
    try {
        const res = await fetch(`${apiBase}/prefectures`);
        const prefs = await res.json();
        console.log(`✅ Prefectures: ${prefs.data ? prefs.data.length : 0} found`);
    } catch (e) {
        console.log('❌ Prefectures: FAIL');
    }

    // 3. Billing Plans
    try {
        const res = await fetch(`${apiBase}/billing/plans`);
        const plans = await res.json();
        console.log(`✅ Billing Plans: ${plans.data ? plans.data.length : 0} found`);
    } catch (e) {
        console.log('❌ Billing Plans: FAIL');
    }

    // 4. Auth (Register) - This WILL FAIL if DB is down (offline mode is read-only for now)
    console.log('\n⚠️  Auth tests might fail if Database is offline (Offline mode is Read-Only)');

    const testUser = {
        email: `qa_${Date.now()}@test.com`,
        password: 'password123',
        phone: '0612345678'
    };

    try {
        const res = await fetch(`${apiBase}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(testUser)
        });
        const reg = await res.json();

        if (reg.success) {
            console.log('✅ Register: OK');
        } else {
            console.log('❌ Register: FAIL (Expected in Offline Mode)', reg.message);
        }
    } catch (e) {
        console.log('❌ Register: Network/Server Error');
    }
}

runQA();
