#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const http = require('http')
const axios = require('axios')
const cheerio = require('cheerio')

const domain = "https://www.pingxx.com"
const api = 'https://www.pingxx.com/api'
const guides = [
  'https://www.pingxx.com/docs/overview',
  'https://www.pingxx.com/docs/server',
  'https://www.pingxx.com/docs/client',
  'https://www.pingxx.com/docs/webhooks'
]

Promise

  // Download four tab-view html
  .all(guides.map(guide =>
    axios
      .get(guide)
      .then(({ data }) => cheerio.load(data))
      .then($ =>
        Promise.resolve(
          $('a[data-category]').map((i, el) => $(el).attr('href')).toArray()
        )
      )
  ))

  // flattened
  .then(res => Promise.resolve(res.reduce((links, a) => {
    links.push(...a)
    return links
  }, [])))

  // Write files
  .then(links =>
    Promise.all(
      links.map(link =>
        axios.get(`${domain}${link}`).then(({ data }) => {
          data = data.replace(/(\.\.\/)*assets/ig, `${domain}/assets`)
          fs.writeFileSync(path.resolve(__dirname, 'html', `${link.substr(1).replace(/\//g, '-')}.html`), data)
        })
      )
    )
  )

  // API documents
  .then(() =>
    axios.get(api)
      .then(({ data }) => {
        let $ = cheerio.load(data)
        $('.fixed-left').remove()
        data = $.root().html().replace(/api\/css/ig, `${domain}/api/css`)
        data += "<style>.space-left20 {margin-left: 0!important;}.fixed-top, .fixed-left {display: none;}</style>"
        fs.writeFileSync(path.resolve(__dirname, 'html', `pingpp-api.html`), data)
      })
  )
  .catch(err => {
    console.error(err)
  })
