const express = require('express');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const instagramGetUrl = require('instagram-url-direct');

const app = express();
const PORT = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/download', async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).send('No URL provided');
    }

    try {
        const result = await instagramGetUrl(url);
        const mediaUrl = result.url_list[0]; // Get the first media URL

        if (!mediaUrl) {
            return res.status(404).send('Media not found');
        }

        const videoResponse = await axios.get(mediaUrl, { responseType: 'stream' });
        const videoPath = path.join(__dirname, '../downloads', `${uuidv4()}.mp4`);

        const writer = fs.createWriteStream(videoPath);
        videoResponse.data.pipe(writer);

        writer.on('finish', () => {
            res.download(videoPath, (err) => {
                if (err) {
                    console.error('Error downloading file:', err);
                    res.status(500).send('Server error');
                }

                // Clean up the downloaded file after serving it
                fs.unlink(videoPath, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                    }
                });
            });
        });

        writer.on('error', (err) => {
            console.error('Error writing file:', err);
            res.status(500).send('Server error');
        });

    } catch (error) {
        console.error('Error fetching URL:', error);
        res.status(500).send('Server error');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
