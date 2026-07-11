const express = require('express');
const cors = require('cors');
const busboy = require('busboy');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('Public'));

const SUPABASE_URL = 'https://magyawgmocoqzpjyuywn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_PNBFQs_0YPvzQLvc4AvLNA_18NckPI1';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/upload', (req, res) => {
    const bb = busboy({ headers: req.headers });
    let folderPath = req.query.folder ? `${req.query.folder}/` : '';

    bb.on('file', async (name, file, info) => {
        const fileName = folderPath + info.filename;
        const mimeType = info.mimeType;

        try {
            const { data, error } = await supabase.storage
                .from('files')
                .upload(fileName, file, {
                    contentType: mimeType,
                    duplex: 'half',
                    upsert: true
                });

            if (error) throw error;

            const { data: linkData } = supabase.storage
                .from('files')
                .getPublicUrl(fileName);

            res.json({ success: true, downloadLink: linkData.publicUrl });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Upload failed.' });
        }
    });

    req.pipe(bb);
});

// Dynamic route with clean sorting switches
app.get('/list-files', async (req, res) => {
    const folder = req.query.path || '';
    const sortParam = req.query.sort || 'name_asc';

    // Parse out sorting columns
    let column = 'name';
    let order = 'asc';

    if (sortParam === 'name_desc') { order = 'desc'; }
    else if (sortParam === 'size_asc') { column = 'metadata.size'; order = 'asc'; }
    else if (sortParam === 'size_desc') { column = 'metadata.size'; order = 'desc'; }
    else if (sortParam === 'date_desc') { column = 'created_at'; order = 'desc'; }
    else if (sortParam === 'date_asc') { column = 'created_at'; order = 'asc'; }

    try {
        const { data, error } = await supabase.storage
            .from('files')
            .list(folder, {
                limit: 100,
                offset: 0,
                sortBy: { column: column, order: order }
            });

        if (error) throw error;

        const formattedData = data.map(item => {
            const fullPath = folder ? `${folder}/${item.name}` : item.name;
            const { data: linkData } = supabase.storage.from('files').getPublicUrl(fullPath);
            return {
                ...item,
                downloadUrl: linkData.publicUrl
            };
        });

        res.json(formattedData);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Could not fetch files.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
