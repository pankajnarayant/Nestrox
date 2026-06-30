const { User } = require('./db');

async function viewUsers() {
  try {
    const users = await User.find({}, { password: 0 }); // Hide passwords for security
    
    if (users.length === 0) {
      console.log('\n📭 No users found in the database yet.');
    } else {
      console.log('\n👥 Registered Users in MongoDB Atlas:\n');
      console.table(users.map(u => ({
        ID: u.id,
        Name: u.full_name,
        Username: u.username,
        Email: u.email,
        Phone: u.phone,
        Created: u.created_date
      })));
    }
    process.exit(0);
  } catch (err) {
    console.error('Error fetching users:', err);
    process.exit(1);
  }
}

// Run the function
viewUsers();
