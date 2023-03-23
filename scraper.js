const axios = require('axios');
const cheerio = require('cheerio')
const fs = require('fs');

let conteudo = ''

async function getPaginas() {
    await axios.get('https://omunicipioblumenau.com.br/?s=homicidios')
    .then(async (response) => {
      const regex = /<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g;
      const hrefValue = response.data.match(regex);
      let links = []
      for (let x in hrefValue) {
          links[x] = hrefValue[x].substring(hrefValue[x].indexOf('href=')+6, hrefValue[x].indexOf('/"'))
          await getConteudoPagina(links[x])
      }
    })
    .catch(error => {
      console.error(error);
    });
}

async function getOutrasPaginas() {
    for (let index = 2; index < 5; index++) {
        await axios.get(`https://omunicipioblumenau.com.br/pagina/${index}/?s=homicidios`)
        .then(async (response) => {
        const regex = /<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g;
        const hrefValue = response.data.match(regex);
        let links = []
        for (let x in hrefValue) {
            links[x] = hrefValue[x].substring(hrefValue[x].indexOf('href=')+6, hrefValue[x].indexOf('/"'))
            await getConteudoPagina(links[x])
        }
        })
        .catch(error => {
        console.error(error);
        return
        });
    }
}

async function getConteudoPagina(url) {
    axios.get(url)
    .then(response => {
        const $ = cheerio.load(response.data)
        console.log($.html('h1'))
        conteudo += $.html('h1') + '\n'
        conteudo += $.html('p') + '\n'

    })
    .catch(error => {
        console.error(error);
    });

}

async function init()
{
    await getPaginas()
    await getOutrasPaginas()
    fs.writeFile('conteudo.txt', conteudo, (err) => {
        if (err) {
        console.error(err);
        return;
        }
    });
}

init(s)