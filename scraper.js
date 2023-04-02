const axios = require('axios');
const cheerio = require('cheerio')
const fs = require('fs');

let noticias = []
let urls_omunicipo = ['https://omunicipioblumenau.com.br/?s=policia', 'https://omunicipioblumenau.com.br/pagina/#/?s=policia']
let urls_blog_jaime = ['https://www.blogdojaime.com.br/category/noticias/', 'https://www.blogdojaime.com.br/category/noticias/page/$#/']
let urls_correiosc = ['https://www.correiosc.com.br/?s=policia', 'https://www.correiosc.com.br/page/#/?s=policia']

let urls = [urls_omunicipo, urls_blog_jaime, urls_correiosc]
// let urls = [urls_blog_jaime]
let regex = [/<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g, /<div\s+class='boxmaisvistoshome'>\s+<a\shref="([^"]+)"/g, /<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g]
// let regex = [/<div\s+class='boxmaisvistoshome'>\s+<a\shref="([^"]+)"/g, /<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g]

// percorre a página inicial
async function getPaginas(url, regex) {
    await axios.get(url)
        .then(async (response) => {
            const hrefValue = response.data.match(regex);
            let links = []
            for (let x in hrefValue) {
                links[x] = hrefValue[x].substring(hrefValue[x].indexOf('href=') + 6, hrefValue[x].indexOf('/"'))
                await getConteudoPagina(links[x])
            }
        })
        .catch(error => {
            // console.error(error);
        });
}

// percorre a paginação
async function getOutrasPaginas(url, regex) {
    for (let index = 2; index < 5; index++) {
        await axios.get(url.replace('#', index))

            .then(async (response) => {
                const hrefValue = response.data.match(regex);
                let links = []
                for (let x in hrefValue) {
                    links[x] = hrefValue[x].substring(hrefValue[x].indexOf('href=') + 6, hrefValue[x].indexOf('/"'))
                    await getConteudoPagina(links[x])
                }
            })
            .catch(error => {
                // console.error(error);
                return
            });
    }
}

// adiciona o título, a notícia e o link da matéria ao conteúdo do arquivo
async function getConteudoPagina(url) {
    axios.get(url)
        .then(response => {
            const $ = cheerio.load(response.data)
            if (url.indexOf('blogdojaime') !== -1) {
              // Find all div tags with class "conteudopostagem"
              const divs = $('div.conteudopostagem');
              
              // Loop through each div tag and extract the text of its p tags
              divs.each((i, div) => {
                const ps = $(div).find('p');
                const texts = ps.map((j, p) => $(p).text()).get();
                //TODO use extracted texts
                console.log('TEXTS', texts)
              });

            } else {
              const noticia = {
                title: $('h1').text(),
                description: $('p').text(),
                url
              }

              noticias.push(noticia)
            }
        })
        .catch(error => {
            console.error(error);
        });

}

async function init() {
    // percorre 4 páginas de cada portal em 'urls' e extrai as notícias
    for (let i = 0; i < urls.length; i++) {
        await getPaginas(urls[i][0], regex[i])
        await getOutrasPaginas(urls[i][1], regex[i])
    }

    fs.writeFile('noticias.json', JSON.stringify(noticias), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

init()