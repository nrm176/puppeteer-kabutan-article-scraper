const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const express = require('express');

const app = express();
const PORT = process.env.PORT;
const USER_AGENT = 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, likeGecko) Chrome/41.0.2228.0 Safari/537.36';
const CONTENT_TYPE = 'application/json; charset=utf-8'

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

    const LAUNCH_OPTION = process.env.DYNO == 1 ? { args: ['--no-sandbox', '--disable-setuid-sandbox'] } : { headless: false };

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

module.exports = async function (context, req) {
    let kabutan_article_url = req.body.url;
    const data = await parser_process(kabutan_article_url)
    context.header('Content-Type', CONTENT_TYPE);
    context.res = {
        body: data
    }
}