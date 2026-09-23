const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/User');
const Donor = require('../models/Donor');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/bizhack_blood_donor';
    console.log(`[Seed] Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);

    console.log('[Seed] Clearing existing Users and Donors...');
    await User.deleteMany({});
    await Donor.deleteMany({});

    console.log('[Seed] Creating password hashes...');
    const adminPasswordHash = await bcrypt.hash('Admin@123', 10);
    const donorPasswordHash = await bcrypt.hash('Donor@123', 10);

    // 1. Create Admin User
    const adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@bizhack.com',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    });
    console.log(`[Seed] Admin created: ${adminUser.email} (Password: Admin@123)`);

    // 2. Demo Donors List
    const sampleDonors = [
      {
        name: 'Rajesh Kumar',
        email: 'rajesh.erode@bizhack.com',
        bloodGroup: 'O+',
        phone: '+91 98421 11234',
        location: 'Erode',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-06-15'),
      },
      {
        name: 'Priya Sundaram',
        email: 'priya.cbe@bizhack.com',
        bloodGroup: 'A+',
        phone: '+91 98432 22345',
        location: 'Coimbatore',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-05-10'),
      },
      {
        name: 'Karthik Selvan',
        email: 'karthik.chennai@bizhack.com',
        bloodGroup: 'B+',
        phone: '+91 98443 33456',
        location: 'Chennai',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-07-01'),
      },
      {
        name: 'Ananya Iyer',
        email: 'ananya.salem@bizhack.com',
        bloodGroup: 'AB+',
        phone: '+91 98454 44567',
        location: 'Salem',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-04-20'),
      },
      {
        name: 'Vignesh Raman',
        email: 'vignesh.madurai@bizhack.com',
        bloodGroup: 'O-',
        phone: '+91 98465 55678',
        location: 'Madurai',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-08-11'),
      },
      {
        name: 'Divya Bharathi',
        email: 'divya.erode@bizhack.com',
        bloodGroup: 'A-',
        phone: '+91 98476 66789',
        location: 'Erode',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-03-12'),
      },
      {
        name: 'Suresh Chandran',
        email: 'suresh.trichy@bizhack.com',
        bloodGroup: 'B-',
        phone: '+91 98487 77890',
        location: 'Tiruchirappalli',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-01-25'),
      },
      {
        name: 'Meera Nambiar',
        email: 'meera.cbe@bizhack.com',
        bloodGroup: 'AB-',
        phone: '+91 98498 88901',
        location: 'Coimbatore',
        availability: 'AVAILABLE',
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-02-18'),
      },
      {
        name: 'Rahul Varma',
        email: 'rahul.chennai@bizhack.com',
        bloodGroup: 'O+',
        phone: '+91 98509 99012',
        location: 'Chennai',
        availability: 'UNAVAILABLE', // Recently donated
        status: 'ACTIVE',
        lastDonationDate: new Date('2026-09-01'),
      },
      {
        name: 'Arvind Swamy',
        email: 'arvind.erode@bizhack.com',
        bloodGroup: 'B+',
        phone: '+91 98510 10123',
        location: 'Erode',
        availability: 'AVAILABLE',
        status: 'INACTIVE', // Inactive account demo
        lastDonationDate: new Date('2025-11-20'),
      },
    ];

    for (const donorData of sampleDonors) {
      const user = await User.create({
        name: donorData.name,
        email: donorData.email,
        passwordHash: donorPasswordHash,
        role: 'DONOR',
        status: donorData.status,
      });

      await Donor.create({
        userId: user._id,
        name: donorData.name,
        bloodGroup: donorData.bloodGroup,
        phone: donorData.phone,
        email: donorData.email,
        location: donorData.location,
        availability: donorData.availability,
        status: donorData.status,
        lastDonationDate: donorData.lastDonationDate,
      });
    }

    console.log(`[Seed] Seeded ${sampleDonors.length} donors successfully.`);
    console.log('\n--- DEMO ACCOUNTS ---');
    console.log('1. Admin: admin@bizhack.com | Password: Admin@123');
    console.log('2. Donor (Active & Available): rajesh.erode@bizhack.com | Password: Donor@123');
    console.log('3. Donor (Unavailable): rahul.chennai@bizhack.com | Password: Donor@123');
    console.log('4. Donor (Inactive): arvind.erode@bizhack.com | Password: Donor@123');
    console.log('---------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
