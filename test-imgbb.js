const fs = require('fs');
const API_KEY = 'e8e52b29816c9198b18db32862dc029d';
const formData = new FormData();
const fileBuf = fs.readFileSync('/Users/yadhuvishnu/Desktop/Crackers Admin/public/logo.png');
const blob = new Blob([fileBuf], { type: 'image/png' });
formData.append('image', blob, 'logo.png');

fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
  method: 'POST',
  body: formData
}).then(res => res.json()).then(console.log).catch(console.error);
