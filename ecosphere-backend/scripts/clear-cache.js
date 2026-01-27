// Clear backend cache
const cache = require('../utils/cache');

console.log('Current cache stats:', cache.getStats());
console.log('\nClearing cache...');
cache.clear();
console.log('Cache cleared!');
console.log('New cache stats:', cache.getStats());
