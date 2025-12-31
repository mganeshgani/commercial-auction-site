require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/user.model');

// Demo users
const demoUsers = [
  {
    name: 'Admin User',
    email: 'admin@auction.com',
    password: 'admin123',
    role: 'admin'
  },
  {
    name: 'Auctioneer User',
    email: 'auctioneer@auction.com',
    password: 'auctioneer123',
    role: 'auctioneer'
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing demo users
    await User.deleteMany({ email: { $in: demoUsers.map(u => u.email) } });
    console.log('Cleared existing demo users');

    // Create demo users
    for (const userData of demoUsers) {
      const user = await User.create(userData);
      console.log(`✓ Created ${user.role} user: ${user.email}`);
    }

    console.log('\n✅ Demo users seeded successfully!');
    console.log('\nYou can now login with:');
    console.log('━'.repeat(50));
    demoUsers.forEach(u => {
      console.log(`${u.role.toUpperCase().padEnd(12)} | ${u.email.padEnd(25)} | ${u.password}`);
    });
    console.log('━'.repeat(50));

    process.exit(0);
  } catch (error) {
    console.error('Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
