const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');
const https = require('https');

/**
 * GET /search
 * Example: /search?query=Avengers
 */
router.get('/search', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.status(400).json({ error: 'Query parameter is required' });

    try {
        const searchUrl = `https://cinesubz.co/?s=${encodeURIComponent(query)}`;
        const { data } = await axios.get(searchUrl);
        const $ = cheerio.load(data);
        const results = [];

        $("div.module > div.content.rigth.csearch > div > div > article").each((_, el) => {
            results.push({
                title: $(el).find("a").text().replace(/\n/g, '').trim(),
                image: $(el).find("img").attr("src"),
                imdb: $(el).find("div.meta > span.rating").text().trim(),
                year: $(el).find("div.meta > span.year").text().trim(),
                link: $(el).find("div.title > a").attr("href"),
                short_desc: $(el).find("div.contenido > p").text().trim()
            });
        });

        if (!results.length) {
            return res.status(404).json({ error: 'No results found' });
        }

        res.json({ status: "success", results });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/**
 * GET /download
 * Example: /download?url=https://cinesubz.co/movies/example-movie
 */
router.get('/download', async (req, res) => {
    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL parameter is required' });

    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // First available download link
        const videoPageUrl = $("div#directdownloadlinks table tbody tr")
            .first()
            .find("td > a")
            .attr("href");

        if (!videoPageUrl) {
            return res.status(404).json({ error: 'No video link found' });
        }

        // If link is Mega, Google Drive etc. -> Send the link instead of streaming
        if (videoPageUrl.includes("mega.nz") || videoPageUrl.includes("drive.google.com")) {
            return res.json({
                status: "success",
                type: "external",
                message: "Direct video download from hosting site",
                link: videoPageUrl
            });
        }

        // Otherwise, try streaming the video file directly
        https.get(videoPageUrl, (fileRes) => {
            res.setHeader('Content-Disposition', 'attachment; filename="movie.mp4"');
            res.setHeader('Content-Type', 'video/mp4');
            fileRes.pipe(res);
        }).on('error', (e) => {
            res.status(500).json({ error: e.message });
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;