## What is this

A web site scraper that snapshots your router's web ui pages *along* with all the values - so that after a router fw upgrade, you can just redo all the values with the new fw while having the old one available for easy reference

```
# clone this repo
> git clone https://github.com/raghur/TomatoKetchup
> cd TomatoKetchup
> npm install

# supply url, username and password
> node index.js --url http://192.168.1.3 --user <user> --pass <pass>  -o output

# Now just double click output/index.html
```

## Why

Tomato firmware and derivatives are great and provide a lot of value if you have a supported router. However, upgrades are a pain since the recommendation is to:

1. Clear NVRAM values
2. Not to use Restore function with a backup made on an earlier version.

This means that you have to redo your entire router config from scratch - something that's easy to get wrong. Screenshots are ok - but they take a lot of time and they don't let you copy/paste.

## Known Issues

1. Menus and tables in pages render twice - once from  html source and once more due to the
js function running again and generating a table/content again. Doesn't hurt but is irritating.
2. The scraping part is trivial and not even specific to tomato fw; applying fixes to downloaded html and js files so that they work is very specific to tomato's html and js.
