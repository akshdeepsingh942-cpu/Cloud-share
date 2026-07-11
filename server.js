const express = require('express');
const cors = require('cors');
const busboy = require('busboy');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors()); // Allows frontend to communicate with backend
app.use(express.static('public')); // To serve uploaded files later

// Create uploads directory if it doesn't exist
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

app.post('/upload', (req, res) => {
    const bb = busboy({ headers: req.headers });
    let fileSavedPath = '';
    let fileName = '';

    bb.on('file', (name, file, info) => {
        fileName = info.filename;
        fileSavedPath = path.join(UPLOAD_DIR, fileName);
        
        // Stream the file data directly onto the hard drive
        const saveTo = fs.createWriteStream(fileSavedPath);
        file.pipe(saveTo);
    });

    bb.on('finish', () => {
        // Generate a simple download link
        const downloadLink = `http://localhost:3000/download/${encodeURIComponent(fileName)}`;
        res.json({ success: true, downloadLink });
    });

    req.pipe(bb);
});

// Route to let users download the file
app.get('/download/:filename', (req, res) => {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (fs.existsSync(filePath)) {
        res.download(filePath);
    } else {
        res.status(404).send('File not found.');
    }
});

app.listen(3000, () => {
    console.log('Server running at http://localhost:3000');
});
