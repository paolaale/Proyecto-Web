const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const encrypt = async password => {
    const hashPassword = await bcrypt.hash(password, SALT_ROUNDS);
    return hashPassword;
}

const correctPassword = async (currentPassword, dbPassword) => {
    const match = await bcrypt.compare(currentPassword, dbPassword);
    return match;
}

module.exports = {
    encrypt,
    correctPassword
};