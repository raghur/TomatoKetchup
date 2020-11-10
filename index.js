const scrape = require('website-scraper');
const PuppeteerPlugin = require('website-scraper-puppeteer');
var process = require('process')
var parseArgs = require('minimist')
var shell = require('shelljs')

var args = parseArgs(process.argv.slice(2), {
    boolean: [ "headless", "fixesonly", "scrapeonly" ],
    alias: {
        "h": "headless",
        "o": "output",
        "u": "user",
        "f": "fixesonly",
        "s": "scrapeonly",
        "p": "pass"
    }
})
args.url = process.env.SCRAPER_URL || args.url;
args.fixesonly = args.fixesonly || false;
args.scrapeonly = args.scrapeonly || false;
args.output = args.output || "output"
args.headless = args.headless || true;
headers = {}
if (args.user) {
    var auth = Buffer.from(`${args.user}:${args.pass}`).toString("base64");
    headers.Authorization = `basic ${auth}`
}

function cleanup() {
    console.log("Applying fixes");
    shell.cd(`${args.output}`)
    console.log("Renaming *.asp to *.asp.html")
    shell.ls("*.asp").forEach(function (f) {
        shell.mv(f, `${f}.html`)
    })
    console.log("commenting body onload js")
    shell.sed("-i", /(<body onload=.*>)/g, '<!-- $1 -->\r\n<body>', shell.ls("*.html"))
    shell.sed("-i", /\.asp([^.])/g, '.asp.html$1', shell.ls("*.html"))
    // shell.sed("-i", '<script>(navi\(\))', '<script>// $1', shell.ls("*.html"))
    shell.cd("js")
    console.log("Replacing filenames in menu to .asp.html")
    shell.sed("-i", /\.asp([^.])/g, '.asp.html$1', shell.ls("*.js"))
    console.log("DONE")
}

class CleanUpPlugin {
    apply(registerAction) {
        registerAction('afterFinish', async () => {cleanup();});
    }
}

plugins = []
if (! args.fixesonly || args.scrapeonly) {
    plugins.push(
            new PuppeteerPlugin({
                launchOptions: { headless: args.headless }, /* optional */
                scrollToBottom: { timeout: 10000, viewportN: 10 }, /* optional */
                blockNavigation: true, /* optional */
            }))
}
if (args.fixesonly || !args.scrapeonly) {
    plugins.push( new CleanUpPlugin());
}
scrape({
    urls: [args.url],
    directory: args.output,
    recursive: true,
    maxRecursiveDepth: 2,
    request: {
        headers: headers
    },
    urlFilter: function(url) {
        var isSameSite = url.indexOf(args.url) === 0
        if (isSameSite) {
            console.log(url);
        } else {
            console.log(`Skipping ${url}`);
        }
        return isSameSite;
    },
    plugins: plugins
});

