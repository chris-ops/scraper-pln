const axios = require('axios');
const cheerio = require('cheerio')
const fs = require('fs');

let conteudo = '['
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
            console.error(error);
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
                console.error(error);
                return
            });
    }
}

// adicona o título, a notícia e o link da matéria ao conteúdo do arquivo
async function getConteudoPagina(url) {
    axios.get(url)
        .then(response => {
            const $ = cheerio.load(response.data)

            conteudo += '{\n'
            conteudo += `\"title\": \"${$.html('h1').replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, "").replace('\n', '').replace('\t', '')}\",\n`
            if (url.includes('https://www.blogdojaime.com.br/')) {
                conteudo += `\"description\": \"${$('p').first().text().replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, "").replace('\n', '').replace('\t', '')}\",\n`
            } else {
                conteudo += `\"description\": \"${$.html('p').replace(/<(?:"[^"]*"['"]*|'[^']*'['"]*|[^'">])+>/g, "").replace('\n', '').replace('\t', '')}\",\n`
            }
            conteudo += `\"url\": \"${url}\"`
            conteudo += '\n},\n'

        })
        .catch(error => {
            console.error(error);
        });

}

async function init() {
    // percorre 4 páginas de cada portal em 'urls' e extrai as notícias
    for (let index = 0; index < urls.length; index++) {
        await getPaginas(urls[index][0], regex[index])
        await getOutrasPaginas(urls[index][1], regex[index])
    }


    // remove a última virgula
    conteudo = conteudo.substring(0, conteudo.lastIndexOf(','))
    conteudo += '\n]'

    // escreve no arquivo json
    fs.writeFile('noticias.json', conteudo, (err) => {
        if (err) {
            console.error(err);
            return;
        }
    });
}

init()