const axios = require('axios')
const cheerio = require('cheerio')
const stringSimilarity = require('string-similarity')
const writeJsonFile = require('write-json-file')
const loadJsonFile = require('load-json-file')

const fetch = async (url) => {
  try {
    const { data } = await axios.get(url)
    return cheerio.load(data)
  } catch (error) {
    await new Promise(resolve => setTimeout(resolve, 10000))
    return false
  }
}

const hakoJSON = async () => {
  let novels = []
  for (let index = 1; index <= 36; index++) {
    console.log('🚀', index)
    const url = 'https://ln.hako.re/danh-sach?page=' + index
    const $ = await fetch(url)
    novels = [...novels, ...$('.series-title a').map(function list () {
      return {
        url: `https://ln.hako.re${$(this).attr('href')}`,
        name: $(this).text()
      }
    }).get()]
  }
  return novels
}

const merge = async () => {
  const lits = await loadJsonFile('data/littlenightsteam/novels.json')
  const hakos = await loadJsonFile('data/hako/novels.json')
  await writeJsonFile('data/novels.json', [...hakos, ...lits])
}

const group = async (nvs) => {
  let nvgr = []
  let nvged = []
  for (let i = 0; i < nvs.length; i++) {
    console.log(i + '/' + nvs.length)
    const nvi = nvs[i]
    if (nvged.includes(nvi)) continue
    let simObj = [nvi.url]
    for (let j = i + 1; j < nvs.length; j++) {
      const nvj = nvs[j]
      const similarity = stringSimilarity.compareTwoStrings(nvi.name, nvj.name)
      if (similarity > 0.5) {
        simObj = [...simObj, nvj.url]
        nvged = [...nvged, nvj]
      }
    }
    if (simObj.length > 1) nvgr = [...nvgr, simObj]
  }
  return nvgr
}

const _ = require('lodash')
const unique = async () => {
  const object = await loadJsonFile('data/object.json')
  const group = await loadJsonFile('data/group.json')
  const nvsurl = object.map((nv) => nv.url)
  const deepGroup = _.flattenDeep(group)
  await writeJsonFile('data/urls.json', nvsurl)
  const unique = _.xor(nvsurl, deepGroup)
  return unique
}

const start = async () => {
  const grou = await unique()
  await writeJsonFile('data/unique.json', grou)
}
start()

module.exports = {
  fetch,
  merge,
  group,
  hakoJSON
}
