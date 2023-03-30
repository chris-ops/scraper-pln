const axios = require('axios');
const cheerio = require('cheerio')
const fs = require('fs');

let noticias = []
let urls_omunicipo = ['https://omunicipioblumenau.com.br/?s=policia', 'https://omunicipioblumenau.com.br/pagina/#/?s=policia']
let urls_blog_jaime = ['https://www.blogdojaime.com.br/category/noticias/', 'https://www.blogdojaime.com.br/category/noticias/page/$#/']
let urls_correiosc = ['https://www.correiosc.com.br/?s=policia', 'https://www.correiosc.com.br/page/#/?s=policia']

let urls = [urls_omunicipo, urls_blog_jaime, urls_correiosc]
let regex = [/<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g, /<div\s+class='boxmaisvistoshome'>\s+<a\shref="([^"]+)"/g, /<div\s+class="td-module-thumb"><a\s+href="([^"]+)"/g]

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
    for (let index = 2; index < 10; index++) {
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

// adicona o título, a notícia e o link da matéria ao conteúdo do arquivo
async function getConteudoPagina(url) {
    axios.get(url)
        .then(response => {
            const noticia = {}
            const $ = cheerio.load(response.data)
            noticia.title = $('h1').text()
            noticia.description = $('p').text()
            noticia.url = url

            noticias.push(noticia)
        })
        .catch(error => {
            // console.error(error);
        });

}

async function init() {
    // percorre 4 páginas de cada portal em 'urls' e extrai as notícias
    for (let index = 0; index < urls.length; index++) {
        await getPaginas(urls[index][0], regex[index])
        await getOutrasPaginas(urls[index][1], regex[index])
    }

    console.log('@@@ NOTICIAS @@@', noticias)

    fs.writeFile('noticias.json', JSON.stringify(noticias), (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

init()