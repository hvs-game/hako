/* eslint-disable node/no-deprecated-api */
const cheerio = require('cheerio')
const loadJsonFile = require('load-json-file')
const axios = require('axios')
const URL = require('url')

const fetch = async (url) => {
  try {
    const { data } = await axios.get(url)
    return data
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, 10000))
    return false
  }
}

const urls = async () => {
  let urls = []
  for (let index = 1; index <= 46; index++) {
    console.log('🚀 ~ index', index)
    const url = 'https://ln.hako.re/danh-sach?page=' + index
    const html = await fetch(url)
    if (!html) {
      index--
      continue
    }
    const $ = cheerio.load(html)
    urls = [...urls, ...$('.series-title a').map(function list () {
      return `https://ln.hako.re${$(this).attr('href')}`
    }).get()]
  }
  return urls
}

const updateURLs = async () => {
  let urls = []
  const url = 'https://ln.hako.re/danh-sach?truyendich=1&dangtienhanh=1&tamngung=1&hoanthanh=1&sapxep=capnhat&page=1'
  const html = await fetch(url)
  const $ = cheerio.load(html)
  urls = [...urls, ...$('.series-title a').map(function list () {
    return `https://ln.hako.re${$(this).attr('href')}`
  }).get()]
  return urls
}

const read = require('read-file')
const write = require('write-file-utf8')
const writeJsonFile = require('write-json-file')

const save = async () => {
  const urls = await loadJsonFile('docs/index.html')
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const qURL = URL.parse(url, true)
    const pathURL = 'docs' + qURL.pathname + '.html'
    try {
      const htmlFile = read.sync(pathURL)
      const html = await fetch(url)
      if (!html) {
        i--
        continue
      }

      // eslint-disable-next-line no-unused-vars
      const $File = cheerio.load(htmlFile)
      const $ = cheerio.load(html)
      const chapterURLs = $('.list-chapters .chapter-name a').map(function chapters () {
        return `https://ln.hako.re${$(this).attr('href')}`
      }).get()
      await write(pathURL, html)

      for (let j = 0; j < chapterURLs.length; j++) {
        const chapterURL = chapterURLs[j]
        const qChapterURL = URL.parse(chapterURL, true)
        const pathChapterURL = 'docs' + qChapterURL.pathname + '.html'
        try {
          // eslint-disable-next-line no-unused-vars
          const htmlFile = read.sync(pathChapterURL)
        } catch (error) {
          console.log('🚀 update ~ i ~ j', i, j)
          const chapterHTML = await fetch(chapterURL)
          if (!chapterHTML) {
            i--
            continue
          }
          await write(pathChapterURL, chapterHTML)
        }
      }
    } catch (error) {
      const html = await fetch(url)
      if (!html) {
        i--
        continue
      }
      await write(pathURL, html)
      const $ = cheerio.load(html)
      const chapterURLs = $('.list-chapters .chapter-name a').map(function chapters () {
        return `https://ln.hako.re${$(this).attr('href')}`
      }).get()
      for (let j = 0; j < chapterURLs.length; j++) {
        console.log('🚀 new ~ i ~ j', i, j)
        const chapterURL = chapterURLs[j]
        const qChapterURL = URL.parse(chapterURL, true)
        const pathChapterURL = 'docs' + qChapterURL.pathname + '.html'
        const chapterHTML = await fetch(chapterURL)
        if (!chapterHTML) {
          j--
          continue
        } else {
          await write(pathChapterURL, chapterHTML)
        }
      }
    }
  }
}

const update = async () => {
  const urls = await updateURLs()
  writeJsonFile('docs/update.html', urls)
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    const qURL = URL.parse(url, true)
    const pathURL = 'docs' + qURL.pathname + '.html'
    try {
      const htmlFile = read.sync(pathURL)
      const html = await fetch(url)
      // eslint-disable-next-line no-unused-vars
      const $File = cheerio.load(htmlFile)
      const $ = cheerio.load(html)
      const chapterURLs = $('.list-chapters .chapter-name a').map(function chapters () {
        return `https://ln.hako.re${$(this).attr('href')}`
      }).get()
      await write(pathURL, html)
      for (let j = 0; j < chapterURLs.length; j++) {
        const chapterURL = chapterURLs[j]
        const qChapterURL = URL.parse(chapterURL, true)
        const pathChapterURL = 'docs' + qChapterURL.pathname + '.html'
        try {
          // eslint-disable-next-line no-unused-vars
          const htmlFile = read.sync(pathChapterURL)
        } catch (error) {
          console.log('🚀 update ~ i ~ j', i, j)
          const chapterHTML = await fetch(chapterURL)
          await write(pathChapterURL, chapterHTML)
        }
      }
    } catch (error) {
      const html = await fetch(url)
      if (!html) {
        i--
        continue
      }
      await write(pathURL, html)
      const $ = cheerio.load(html)
      const chapterURLs = $('.list-chapters .chapter-name a').map(function chapters () {
        return `https://ln.hako.re${$(this).attr('href')}`
      }).get()
      for (let j = 0; j < chapterURLs.length; j++) {
        console.log('🚀 new ~ i ~ j', i, j)
        const chapterURL = chapterURLs[j]
        const qChapterURL = URL.parse(chapterURL, true)
        const pathChapterURL = 'docs' + qChapterURL.pathname + '.html'
        const chapterHTML = await fetch(chapterURL)
        if (!chapterHTML) {
          j--
          continue
        } else {
          await write(pathChapterURL, chapterHTML)
        }
      }
    }
  }
}

const start = async () => {
  console.time('start')
    await urls().then((urls) => {
        writeJsonFile('docs/index.html', urls)
    })
    // await save()
    await update()
  console.timeEnd('start')
}

start()

module.exports = {
  urls,
  updateURLs,
  save,
  update
}
