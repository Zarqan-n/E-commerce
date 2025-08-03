const crypto = require('crypto');
const util = require('util');

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  try {
    const [hashed, salt] = stored.split('.');
    const hashedBuf = Buffer.from(hashed, 'hex');
    const suppliedBuf = await scryptAsync(supplied, salt, 64);
    return crypto.timingSafeEqual(hashedBuf, suppliedBuf);
  } catch (error) {
    console.error('Error comparing passwords:', error.message);
    return false;
  }
}

async function testPassword() {
  const storedPassword = "8136c13805f16e5a1c77bca14be9cb5b6451bb38c0ea88c382dea9bf786e0b3e92940637e8f0e9b5a81f1e0b35fceb11b1d29762d0764d202b0afa93a0135fe3.c5eb04a48d323e39";
  const suppliedPassword = "admin123";
  
  console.log('Stored password:', storedPassword);
  console.log('Supplied password:', suppliedPassword);
  
  const isValid = await comparePasswords(suppliedPassword, storedPassword);
  console.log('Password valid:', isValid);
  
  // Test with a fresh hash
  const newHash = await hashPassword("admin123");
  console.log('New hash for admin123:', newHash);
  
  const isValidNew = await comparePasswords("admin123", newHash);
  console.log('New hash valid:', isValidNew);
}

testPassword().catch(console.error);