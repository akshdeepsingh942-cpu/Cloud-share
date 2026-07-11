const express = require('express');
const cors = require('cors');
const busboy = require('busboy');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Enable Cross-Origin Resource Sharing so your HTML page can talk to this server
app.use(cors());

// Serve static files from the 'public' folder (where index.html lives)
app.use(express.static('Public'));

// Your specific Supabase credentials connected here
const SUPABASE_URL = 'https://magyawgmocoqzpjyuywn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PNBFQs_0YPvzQLvc4AvLNA_18NckPI1';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Handle the file upload requests
app.post('/upload', (req, res) => {
    const bb = busboy({ headers: req.headers });

    bb.on('file', async (name, file, info) => {
        const fileName = info.filename;
        const mimeType = info.mimeType;

        try {
            // Stream the incoming file chunks directly to your Supabase 'files' bucket
            const { data, error } = await supabase.storage
                .from('files')
                .upload(fileName, file, {
                    contentType: mimeType,
                    duplex: 'half',
                    upsert: true
                });

            if (error) throw error;

            // Generate the permanent public download link
            const { data: linkData } = supabase.storage
                .from('files')
                .getPublicUrl(fileName);

            // Send the public download link back to the user interface
            res.json({ success: true, downloadLink: linkData.publicUrl });
        } catch (err) {
            console.error('Error during upload:', err);
            res.status(500).json({ error: 'Upload to cloud vault failed.' });
        }
    });

    req.pipe(bb);
});

// Use Render's automated environment port mapping, or default to 3000 locally
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running successfully on port ${PORT}`);
});
