const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const PORT = 8021;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, likeGecko) Chrome/41.0.2228.0 Safari/537.36';
const CONTENT_TYPE = 'application/json; charset=utf-8'

app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.listen(PORT, function () {
    console.log('server has started on port: ' + PORT);
});

app.post('/parse', async (req, res) => {
    let KABUTAN_ARTICLE_URL = req.body.url;
    const data = await parser_process(KABUTAN_ARTICLE_URL)
    res.header('Content-Type', CONTENT_TYPE);
    res.json(data);
});


const parser_process = async (article_url) => {
    async function extract_data() {
        const data = await page.evaluate(() => {

            const title = document.querySelectorAll('title')[0].innerText;
            const codes = Array.prototype
                .slice.call(document.querySelectorAll('div.mono > a'))
                .map(function (e) {
                    return e.outerText
                })
                .filter(function (e) {
                    return e.length === 4;
                })
                .reduce(function (p, c) {
                    if (p.indexOf(c) < 0) p.push(c);
                    return p;
                }, []);

            return {'title': title, 'codes': codes};
        });
        return data;
    }

    const LAUNCH_OPTION = process.env.DYNO ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] } : { headless: false };

    const browser = await puppeteer.launch(LAUNCH_OPTION);
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({width: 1000, height: 1000, deviceScaleFactor: 1});
    await page.goto(article_url, {waitUntil: 'networkidle2'});
    await page.waitFor(1000);
    let data = await extract_data();
    await browser.close();
    return data;
}
