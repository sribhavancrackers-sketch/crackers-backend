const express = require('express');
const router = express.Router();
const multer = require('multer');

// Use memory storage to upload directly to ImgBB without saving locally
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }
    
    // Convert buffer to Blob for efficient multipart/form-data streaming
    const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
    
    const formData = new FormData();
    formData.append('image', blob, req.file.originalname);
    
    // ImgBB API Key
    const API_KEY = 'e8e52b29816c9198b18db32862dc029d';

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${API_KEY}`, {
      method: 'POST',
      body: formData
    });

    const data = await imgbbRes.json();

    if (data.success) {
      // Returns the direct ImgBB URL (e.g., https://i.ibb.co/.../image.jpg)
      res.json({ success: true, imageUrl: data.data.url });
    } else {
      console.error('ImgBB Error:', data);
      res.status(500).json({ error: 'Failed to upload to ImgBB', details: data });
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
