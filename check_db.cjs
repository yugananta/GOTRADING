const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_store.json', 'utf-8'));
console.log('User 1 avatar length:', db.users[0].avatar.length);
