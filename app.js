// 🔥 SUA LISTA M3U DO DROPBOX (music ou sportLive)
const urlM3U = "https://dl.dropbox.com/scl/fi/15oyes8kkxt6g5p38zin0/m-sica.txt?rlkey=05o0rw8zcxx1xqago3qihhw7d&st=o41gzw8b&dl=0";

// Atualização automática da lista (ex.: 15 minutos)
const intervaloAtualizacaoMs = 15 * 60 * 1000;

// PLAYER UNIFICADO: m3u8, MP4, TS (HLS / Web)
function play(url) {
    const video = document.getElementById("video");

    video.src = "";
    video.load();

    if (window.hlsInstance) {
        window.hlsInstance.destroy();
        window.hlsInstance = null;
    }

    // m3u8 / HLS
    if (Hls.isSupported() && /.m3u8$/i.test(url)) {
        const hls = new Hls();
        hls.loadSource(url);
        hls.attachMedia(video);
        window.hlsInstance = hls;

        hls.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal) console.error("HLS FATAL:", data);
        });
    }
    // MP4
    else if (video.canPlayType("video/mp4") && /.mp4$/i.test(url)) {
        video.src = url;
    }
    // TS / mpegts (alguns navegadores)
    else if (video.canPlayType("video/MP2T") || /.ts$/i.test(url)) {
        video.src = url;
    }
    // outros formatos suportados (opcional)
    else if (video.canPlayType("video/webm") && /.webm$/i.test(url)) {
        video.src = url;
    }
    else {
        alert("Formato não suportado:
" + url);
    }
}

// PARSE M3U COM CATEGORIAS (group-title)
function parseM3U(text) {
    const linhas = text.split("
");
    const canais = [];
    const grupos = {};

    linhas.forEach(linha => {
        linha = linha.trim();
        if (linha.startsWith("#EXTINF")) {
            const nomeMatch = linha.match(/,(.+)/);
            const nome = nomeMatch ? nomeMatch[1].trim() : "Canal sem nome";
            const groupMatch = linha.match(/group-title=["']([^"']+)["']/i);
            const grupo = groupMatch ? groupMatch[1].trim() : "Outros";
            canais.push({ nome, grupo });
        } else if (linha.startsWith("http")) {
            const canal = canais[canais.length - 1];
            if (canal) {
                canal.url = linha;
                if (!grupos[canal.grupo]) grupos[canal.grupo] = [];
                grupos[canal.grupo].push(canal);
            }
        }
    });
    return { canais, grupos };
}

// FUNÇÃO DE RECARREGAR PLAYLIST (Dropbox) AUTOMATICAMENTE
function recarregarPlaylist() {
    const listaDiv = document.getElementById("lista");
    const categoriasDiv = document.getElementById("lista-categorias");
    const msgErro = document.getElementById("erro-carregamento");

    fetch(urlM3U + "&t=" + Date.now())
        .then(res => {
            if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
            return res.text();
        })
        .then(text => {
            const { grupos } = parseM3U(text.trim());
            msgErro.style.display = "none";
            categoriasDiv.innerHTML = "";
            listaDiv.innerHTML = "";

            const gruposList = Object.keys(grupos).sort();

            gruposList.forEach((grupo, i) => {
                const div = document.createElement("div");
                div.className = "categoria";
                div.innerText = grupo;
                if (i === 0) div.classList.add("ativa");

                div.onclick = () => {
                    document.querySelectorAll(".categoria").forEach(el => el.classList.remove("ativa"));
                    div.classList.add("ativa");
                    exibirCanais(grupos[grupo]);
                };

                categoriasDiv.appendChild(div);
            });

            exibirCanais(grupos[gruposList[0]]);
        })
        .catch(err => {
            msgErro.innerText = "Erro ao recarregar lista: " + err.message;
            msgErro.style.display = "block";
            console.error("Erro M3U:", err);
        });
}

// MOSTRA CANAIS NA TELA
function exibirCanais(canais) {
    const listaDiv = document.getElementById("lista");
    listaDiv.innerHTML = "";
    canais.forEach(c => {
        const div = document.createElement("div");
        div.className = "canal";
        div.innerText = c.nome;
        div.onclick = () => play(c.url);
        listaDiv.appendChild(div);
    });
}

// PRIMEIRA CARGA
recarregarPlaylist();

// ATUALIZAÇÃO AUTOMÁTICA
const idIntervalo = setInterval(recarregarPlaylist, intervaloAtualizacaoMs);
