const http = require('http');
const app = require('./src/server');

const runTests = async () => {
  const server = app.listen(5001, async () => {
    console.log('[Test Server] Listening on port 5001');

    try {
      const BASE = 'http://localhost:5001/api';

      const request = async (url, options = {}) => {
        const headers = {
          'Content-Type': 'application/json',
          ...(options.headers || {}),
        };
        const res = await fetch(url, {
          ...options,
          headers,
        });
        const data = await res.json();
        return { status: res.status, data };
      };

      console.log('\n--- 1. Health Check ---');
      const health = await request(`${BASE}/health`);
      console.log('Health status:', health.status, health.data.status);
      if (health.data.status !== 'online') throw new Error('Health check failed');

      console.log('\n--- 2. Public Search & Business Rule Enforcement ---');
      const publicDonors = await request(`${BASE}/donors`);
      console.log('Public donors found count:', publicDonors.data.count);

      // Check all returned are ACTIVE and AVAILABLE
      const invalidDonors = publicDonors.data.donors.filter(
        (d) => d.status !== 'ACTIVE' || d.availability !== 'AVAILABLE'
      );
      if (invalidDonors.length > 0) {
        throw new Error(`CRITICAL ERROR: Found ${invalidDonors.length} donors in public search that are NOT active+available!`);
      }
      console.log('✓ Verified: 100% of public donors are ACTIVE and AVAILABLE');

      // Check filtering
      const erodeDonors = await request(`${BASE}/donors?location=Erode`);
      console.log(`Donors in Erode (Active+Available): ${erodeDonors.data.count}`);
      erodeDonors.data.donors.forEach((d) => console.log(` - ${d.name} (${d.bloodGroup}, ${d.location})`));

      const oPlusDonors = await request(`${BASE}/donors?bloodGroup=O%2B`);
      console.log(`Donors O+ (Active+Available): ${oPlusDonors.data.count}`);

      console.log('\n--- 3. Admin Authentication & Stats ---');
      const adminLogin = await request(`${BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'admin@bizhack.com', password: 'Admin@123' }),
      });
      console.log('Admin login status:', adminLogin.status, 'Role:', adminLogin.data.user.role);
      const adminToken = adminLogin.data.token;

      const adminStats = await request(`${BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log('Admin Stats total donors:', adminStats.data.stats.totalDonors);

      const allAdminDonors = await request(`${BASE}/admin/donors`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      console.log(`Admin sees total donors: ${allAdminDonors.data.count}`);

      console.log('\n--- 4. Donor Registration & Lifecycle ---');
      const uniqueLocation = `CityTest_${Date.now()}`;
      const testEmail = `testdonor_${Date.now()}@bizhack.com`;
      const registerRes = await request(`${BASE}/auth/register`, {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Donor Live',
          email: testEmail,
          password: 'Password@123',
          bloodGroup: 'AB+',
          phone: '+91 99999 88888',
          location: uniqueLocation,
        }),
      });
      console.log('Registered new donor:', registerRes.status, registerRes.data.user?.email);
      const donorToken = registerRes.data.token;
      const donorId = registerRes.data.donor._id;

      // Verify newly registered donor appears in public search
      const publicSearch1 = await request(`${BASE}/donors?location=${uniqueLocation}`);
      console.log(`Public search in ${uniqueLocation} after registration: count = ${publicSearch1.data.count}`);
      if (publicSearch1.data.count !== 1) throw new Error('New donor did not appear in public search!');

      // Toggle donor availability to UNAVAILABLE
      console.log('\n--- 5. Toggling Availability to UNAVAILABLE ---');
      const toggleRes1 = await request(`${BASE}/donors/${donorId}/availability`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${donorToken}` },
        body: JSON.stringify({ availability: 'UNAVAILABLE' }),
      });
      console.log('Availability toggle status:', toggleRes1.data.donor?.availability);

      // Verify donor is IMMEDIATELY removed from public search
      const publicSearch2 = await request(`${BASE}/donors?location=${uniqueLocation}`);
      console.log(`Public search in ${uniqueLocation} after UNAVAILABLE toggle: count = ${publicSearch2.data.count}`);
      if (publicSearch2.data.count !== 0) throw new Error('Unavailable donor still appeared in public search!');
      console.log('✓ Verified: Unavailable donor is strictly excluded from public search.');

      // Toggle donor availability back to AVAILABLE
      await request(`${BASE}/donors/${donorId}/availability`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${donorToken}` },
        body: JSON.stringify({ availability: 'AVAILABLE' }),
      });

      // Admin Deactivates Donor
      console.log('\n--- 6. Admin Deactivates Donor Account ---');
      const adminDeactivate = await request(`${BASE}/admin/donors/${donorId}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${adminToken}` },
        body: JSON.stringify({ status: 'INACTIVE' }),
      });
      console.log('Admin deactivated donor:', adminDeactivate.data.donor?.status);

      // Verify deactivated donor is excluded from public search even though availability is AVAILABLE
      const publicSearch3 = await request(`${BASE}/donors?location=${uniqueLocation}`);
      console.log(`Public search in ${uniqueLocation} after Admin Deactivation: count = ${publicSearch3.data.count}`);
      if (publicSearch3.data.count !== 0) throw new Error('Inactive donor still appeared in public search!');
      console.log('✓ Verified: Inactive donor is strictly excluded from public search.');

      console.log('\n========================================');
      console.log('🎉 ALL INTEGRATION TESTS PASSED SUCCESSFULLY!');
      console.log('========================================\n');
    } catch (err) {
      console.error('❌ Test failed:', err);
      process.exit(1);
    } finally {
      server.close();
      process.exit(0);
    }
  });
};

runTests();
