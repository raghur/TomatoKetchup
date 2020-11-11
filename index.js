const scrape = require('website-scraper');
const PuppeteerPlugin = require('website-scraper-puppeteer');
var process = require('process')
var parseArgs = require('minimist')
var shell = require('shelljs')

var args = parseArgs(process.argv.slice(2), {
    boolean: [ "headless", "fixesonly", "scrapeonly", "help", "verbose"],
    alias: {
        "h": "headless",
        "o": "output",
        "u": "user",
        "f": "fixesonly",
        "s": "scrapeonly",
        "p": "pass",
        "v": "verbose"
    }
})
if (args.help || !args.url) {
    console.log("TomatoKetchup - snapshot your router webui pages with values")
    console.log("")
    console.log("--url              - Url to scrape. [REQUIRED]")
    console.log("-u, --user         - username, Default: admin. Pass --user '' to override")
    console.log("-p, --pass         - password, Default: admin")
    console.log("                     password can also be set with env var TOMATOKETCHUP_PASS if you don't want password showing up in command history")
    console.log("                     env var has higher precedence than CLI")
    console.log("-s, --scrapeonly   - Scrape website only - don't apply fixes. Default: false")
    console.log("-f, --fixesonly    - Only apply fixes on downloaded site; don't scrape. Default: false")
    console.log("-h, --headless     - run chrome headless. Default: true")
    console.log("-v, --verbose      - Verbose; print every url visited or skipped. Default: true")
    return 0
}
args.url = process.env.TOMATOKETCHUP_PASS || args.url;
args.fixesonly = args.fixesonly || false;
args.scrapeonly = args.scrapeonly || false;
args.output = args.output || "output"
args.headless = args.headless || true;
args.user = args.user || "admin"
args.pass = process.env.SCRAPER_PASS || args.pass || "admin"
args.verbose = args.verbose || true;
headers = {}
if (args.user != "") {
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
            if (args.verbose) console.log(url);
        } else {
            if (args.verbose) console.log(`Skipping ${url}`);
        }
        return isSameSite;
    },
    plugins: plugins
});

