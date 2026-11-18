// =========================================================
// AUTO-SCALE INTELIGENTE (PADRONIZAÇÃO 1280x720 EM QUALQUER TELA)
// =========================================================
function atualizarEscalaGabineteArcade() {
    const larguraBase = 1400;
    const alturaBase = 760;
    const margemSeguranca = 0.96;

    const escalaX = (window.innerWidth * margemSeguranca) / larguraBase;
    const escalaY = (window.innerHeight * margemSeguranca) / alturaBase;
    const escalaFinal = Math.min(escalaX, escalaY, 1.35);

    document.documentElement.style.setProperty('--escala-arcade', escalaFinal.toFixed(4));
}

window.addEventListener('resize', atualizarEscalaGabineteArcade);
window.addEventListener('DOMContentLoaded', atualizarEscalaGabineteArcade);
atualizarEscalaGabineteArcade();

// Função utilitária que garante que NUNCA duas telas fiquem abertas juntas
function mostrarApenasTela(idTelaAlvo) {
    const idsTelas = [
        'tela-preloader',
        'tela-titulo',
        'tela-inicio',
        'tela-codex',
        'tela-config',
        'tela-campanha',
        'modal-cutscene',
        'tela-selecao',
        'tela-jogo',
        'tela-fim-jogo'
    ];
    idsTelas.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === idTelaAlvo) el.classList.remove('hidden');
            else el.classList.add('hidden');
        }
    });
}

(function iniciarPreloaderArcade() {
    mostrarApenasTela('tela-preloader');

    const listaAssets = [
        'assets/bg_ciclotron.png', 'assets/bg_usina.png', 'assets/bg_forja.png',
        'assets/bg_boreal.png', 'assets/bg_nucleo.png', 'assets/mapa_campanha.png',
        'assets/lorentz.png', 'assets/faraday.png', 'assets/ampere.png',
        'assets/wilhelm.png', 'assets/ohm.png',
        'assets/lorentz_body.png', 'assets/lorentz_body_atk.png',
        'assets/faraday_body.png', 'assets/faraday_body_atk.png',
        'assets/ampere_body.png', 'assets/ampere_body_atk.png',
        'assets/wilhelm_body.png', 'assets/wilhelm_body_atk.png',
        'assets/ohm_body.png', 'assets/ohm_body_atk.png',
        'assets/iconejogo.png', 'assets/pv.png', 'assets/en.png', 'assets/ult.png',
        'assets/atk.png', 'assets/dfs.png', 'assets/cadeado.png', 'assets/trofeu.png',
        'assets/icon_duelo.png', 'assets/icon_modocampanha.png',
        'assets/icon_manualdecampo.png', 'assets/icon_configuracoes.png',
        'assets/icon_estrelas.png', 'assets/icon_conquistas.png', 'assets/icon_pausa.png',
        'assets/icon_sfxon.png', 'assets/icon_sfxoff.png',
        'assets/icon_musicon.png', 'assets/icon_musicoff.png', 'assets/icon_resetardados.png',
        'assets/icon_classe.png', 'assets/icon_local.png', 'assets/icon_pontos.png', 'assets/icon_dominio.png'
    ];

    let carregados = 0;
    let preloaderConcluido = false;
    const total = listaAssets.length;
    const TEMPO_MINIMO_MS = 1800; // Tempo mínimo na tela (1,8s) para ficar fluido
    const inicioBoot = performance.now();

    const barraFill = document.getElementById('barra-preloader-fill');
    const txtPct = document.getElementById('preloader-pct');
    const txtArquivo = document.getElementById('preloader-status-arquivo');
    const telaPreloader = document.getElementById('tela-preloader');

    if (!telaPreloader) {
        mostrarApenasTela('tela-titulo');
        return;
    }

    // Só revela a caixa do preloader quando as fontes pixeladas terminarem de carregar (evita o flash de fonte errada)
    const revelarCaixaPreloader = () => {
        atualizarEscalaGabineteArcade();
        telaPreloader.classList.add('fontes-carregadas');
    };

    if (document.fonts && document.fonts.ready) {
        Promise.race([
            document.fonts.ready,
            new Promise(resolve => setTimeout(resolve, 600)) // Segurança caso esteja offline
        ]).then(revelarCaixaPreloader);
    } else {
        setTimeout(revelarCaixaPreloader, 150);
    }

    function finalizarBoot() {
        const decorrido = performance.now() - inicioBoot;
        const esperaRestante = Math.max(0, TEMPO_MINIMO_MS - decorrido);

        setTimeout(() => {
            if (barraFill) barraFill.style.width = '100%';
            if (txtPct) txtPct.innerText = '100%';
            if (txtArquivo) txtArquivo.innerText = "Capacitores em 100% — Pulso de Œrsted estabilizado!";

            setTimeout(() => {
                telaPreloader.classList.add('preloader-fade-out');
                setTimeout(() => {
                    mostrarApenasTela('tela-titulo');
                }, 550);
            }, 500);
        }, esperaRestante);
    }

    function registrarProgresso(caminho) {
        if (preloaderConcluido) return;
        carregados++;
        const pct = Math.min(99, Math.round((carregados / total) * 100));
        if (barraFill) barraFill.style.width = `${pct}%`;
        if (txtPct) txtPct.innerText = `${pct}%`;
        if (txtArquivo) {
            const nomeCurto = caminho.split('/').pop();
            txtArquivo.innerText = `Carregando módulo: ${nomeCurto} (${carregados}/${total})`;
        }

        if (carregados >= total) {
            preloaderConcluido = true;
            finalizarBoot();
        }
    }

    listaAssets.forEach(src => {
        const img = new Image();
        img.onload = () => registrarProgresso(src);
        img.onerror = () => registrarProgresso(src);
        img.src = src;
    });
})();

// ==========================================
// 1. VARIÁVEIS GLOBAIS E INICIALIZAÇÃO
// ==========================================
let guardioesData = [];
let jogadorAtual = null;
let inimigoAtual = null;
let protecaoJogador = 0;
let protecaoInimigo = 0;
let numeroTurno = 1;
let faradayModoDefesaAtivo = false;
let modoCampanhaAtivo = false;
let faseAtualCampanha = 1;
let pvPersistenteJogador = 100;
let faseAtual = 1;
let turnoDoJogador = true;
let jogoPausado = false;
let maxPvJogador = 100;
let maxPvInimigo = 100;
let efeitoCanvas = null;
let acertosSeguidosLorentz = 0;
let tomouDanoUltOhm = false;

const conquistasSalvas = JSON.parse(localStorage.getItem('guardioes_conquistas') || '{}');
const progressoCampanhaSalvo = JSON.parse(localStorage.getItem('guardioes_campanha') || '{"faseMax": 1, "estrelas": {}}');

function salvarProgressoCampanha(faseVencida, estrelasObtidas) {
    if (faseVencida >= progressoCampanhaSalvo.faseMax) {
        progressoCampanhaSalvo.faseMax = Math.min(5, faseVencida + 1);
    }
    progressoCampanhaSalvo.estrelas[faseVencida] = Math.max(progressoCampanhaSalvo.estrelas[faseVencida] || 0, estrelasObtidas);
    localStorage.setItem('guardioes_campanha', JSON.stringify(progressoCampanhaSalvo));
}

function desbloquearConquista(id, titulo, descricao) {
    if (conquistasSalvas[id]) return;
    conquistasSalvas[id] = true;
    localStorage.setItem('guardioes_conquistas', JSON.stringify(conquistasSalvas));

    const toast = document.getElementById('toast-conquista');
    const descEl = document.getElementById('nome-conquista-toast');
    if (toast && descEl) {
        descEl.innerText = `${titulo}: ${descricao}`;
        toast.classList.remove('hidden');
        audioManager.tocarVitoria();
        setTimeout(() => toast.classList.add('hidden'), 4000);
    }
}

// DADOS IMERSIVOS DOS 5 SETORES DA CAMPANHA (BIOMAS, FÍSICA E NARRATIVA)
const estagiosCampanha = {
    1: {
        setor: "1. CICLOTRON DE PARTÍCULAS",
        nomeCurto: "Ciclotron",
        bg: "assets/bg_ciclotron.png",
        subtitulo: "Fronteira Externa da Anomalia",
        lore: "Um túnel de aceleração subatômica onde feixes de íons vagam em alta velocidade sob um campo magnético constante.",
        campoB: 3,
        sentido: "entrando",
        corTema: "#00e5ff",
        overlayCor: "rgba(0, 180, 255, 0.10)",
        clima: "ions",
        efeitoTitulo: "VÁCUO DE ACELERAÇÃO",
        efeitoResumo: "Bônus: +15% Dano Básico | Penalidade: -15% Escudos",
        falaDerrota: "Cálculos impecáveis! Você dominou a deflexão magnética. Siga para a Usina de Indução, mas cuidado: Faraday inverteu a polaridade do campo lá!"
    },
    2: {
        setor: "2. USINA DE INDUÇÃO",
        nomeCurto: "Usina",
        bg: "assets/bg_usina.png",
        subtitulo: "Geradores de Fluxo Variável",
        lore: "Enormes turbinas giram no coração energético da cidade. Aqui o campo magnético emerge do solo com força ampliada.",
        campoB: 4,
        sentido: "saindo",
        corTema: "#f1c40f",
        overlayCor: "rgba(241, 196, 15, 0.10)",
        clima: "fluxo",
        efeitoTitulo: "CORRENTES DE FOUCAULT",
        efeitoResumo: "Bônus: +1 EN/turno | Penalidade: Descanso cura só 6 PV",
        falaDerrota: "Você rompeu minha Espira Defensiva! O caminho para a Forja Ferro-Magnética de Ampère está aberto. A densidade do campo lá dentro é sufocante!"
    },
    3: {
        setor: "3. FORJA FERRO-MAGNÉTICA",
        nomeCurto: "Forja",
        bg: "assets/bg_forja.png",
        subtitulo: "Fundição de Núcleo Pesado",
        lore: "Uma câmara industrial aquecida onde solenoides gigantescos e núcleos de ferro fundido multiplicam as linhas de força.",
        campoB: 5,
        sentido: "entrando",
        corTema: "#ff5252",
        overlayCor: "rgba(255, 60, 60, 0.12)",
        clima: "forja",
        efeitoTitulo: "CALOR DE CURIE & FERRO",
        efeitoResumo: "Bônus: +15% Escudos | Penalidade: -4 PV ao usar ULT",
        falaDerrota: "Agh... Nem mesmo meu núcleo de ferro conteve seu avanço! Suba até o Observatório Boreal; Wilhelm guarda a rota para o reator central."
    },
    4: {
        setor: "4. OBSERVATÓRIO BOREAL",
        nomeCurto: "Boreal",
        bg: "assets/bg_boreal.png",
        subtitulo: "Torre de Magnetometria de Weber",
        lore: "No topo gelado da cidade, o frio criogênico cria supercondutividade nas bobinas, mas congela circuitos instáveis.",
        campoB: 3,
        sentido: "saindo",
        corTema: "#18ffff",
        overlayCor: "rgba(24, 255, 255, 0.14)",
        clima: "aurora",
        efeitoTitulo: "FRIO SUPERCONDUTOR (0 Ω)",
        efeitoResumo: "Bônus: -1 EN Custo | Penalidade: -1 EN/turno e -4 PV ao errar",
        falaDerrota: "Suas leituras de campo foram precisas sob a nevasca! Você chegou ao fim da jornada: Ohm aguarda você no Núcleo de Alta Tensão."
    },
    5: {
        setor: "5. NÚCLEO DE ALTA TENSÃO",
        nomeCurto: "Núcleo",
        bg: "assets/bg_nucleo.png",
        subtitulo: "Epicentro do Pulso de Œrsted",
        lore: "O reator mestre onde a anomalia começou. Descargas extremas de plasma testam o limite absoluto da Lei de Ohm.",
        campoB: 6,
        sentido: "entrando",
        corTema: "#e040fb",
        overlayCor: "rgba(224, 64, 251, 0.14)",
        clima: "plasma",
        efeitoTitulo: "TEMPESTADE DE PLASMA",
        efeitoResumo: "Bônus: +20% Dano ULT | Penalidade: -6 PV ao errar previsão",
        falaDerrota: "Inacreditável... Você controlou a resistência máxima sem queimar o circuito! A Arena de Campo reconhece você como o verdadeiro Mestre do Fluxo!"
    }
};

// DIÁLOGOS DA CAMPANHA COM PROGRESSÃO DE HISTÓRIA
const dialogosCampanha = {
    1: [
        { quem: 'boss', fala: "Alto lá! O Pulso de Œrsted desestabilizou o Ciclotron. Só deixarei você avançar se provar que domina a Força de Lorentz!" },
        { quem: 'player', fala: "Eu conheço as leis deste setor! Ajustarei minha carga e velocidade para curvar meus disparos com precisão!" }
    ],
    2: [
        { quem: 'boss', fala: "Você passou pelo Ciclotron, mas aqui na Usina de Indução o campo magnético SAI do solo (⊙)! Minha Espira reflete qualquer amador." },
        { quem: 'player', fala: "Percebi a inversão das linhas de campo! Calcularei o ângulo exato do fluxo para superar sua barreira, Faraday!" }
    ],
    3: [
        { quem: 'boss', fala: "Bem-vindo ao calor da Forja Ferro-Magnética! Com núcleo de ferro e espiras no máximo, meu Eletroímã esmagará sua guarda!" },
        { quem: 'player', fala: "O campo aqui é denso, Ampère, mas sei exatamente como a corrente e as espiras multiplicam essa força!" }
    ],
    4: [
        { quem: 'boss', fala: "Poucos chegam ao Observatório Boreal. Sob esta aurora magnética, fios ocultos desviam qualquer agulha. Você consegue ler o fluxo em Webers?" },
        { quem: 'player', fala: "Quanto maior a distância do condutor, menor o campo B. Nenhuma tempestade magnética vai esconder sua posição, Wilhelm!" }
    ],
    5: [
        { quem: 'boss', fala: "Então você alcançou o Núcleo de Alta Tensão... Eu sou Ohm! Aqui a potência é extrema: um erro na resistência e seu circuito queimará!" },
        { quem: 'player', fala: "Este é o confronto final para estabilizar o Pulso de Œrsted! Manterei a corrente segura e vencerei seu Curto-Circuito!" }
    ]
};

const telaTitulo = document.getElementById('tela-titulo');
const telaInicio = document.getElementById('tela-inicio');
const telaSelecao = document.getElementById('tela-selecao');
const telaJogo = document.getElementById('tela-jogo');
const telaFimJogo = document.getElementById('tela-fim-jogo');

const btnComecarTitulo = document.getElementById('btn-comecar-titulo');
const btnIniciar = document.getElementById('btn-iniciar');
const btnVoltarInicio = document.getElementById('btn-voltar-inicio');
const btnJogarNovamente = document.getElementById('btn-jogar-novamente');
const listaGuardioes = document.getElementById('lista-guardioes');
const painelFeedback = document.getElementById('painel-feedback');

const btnConfig = document.getElementById('btn-config');
const telaConfig = document.getElementById('tela-config');
const btnVoltarConfig = document.getElementById('btn-voltar-config');
const btnToggleSfx = document.getElementById('btn-toggle-sfx');
const btnToggleBgm = document.getElementById('btn-toggle-bgm');

const painelAcoes = document.getElementById('painel-acoes');
const inputsDinamicos = document.getElementById('inputs-dinamicos');
const btnConfirmar = document.getElementById('btn-confirmar-parametros');

if (btnComecarTitulo) {
    btnComecarTitulo.addEventListener('click', (e) => {
        e.stopPropagation();
        audioManager.tocarClique();
        if (telaTitulo) telaTitulo.classList.add('hidden');
        if (telaInicio) telaInicio.classList.remove('hidden');
        if (audioManager.musicaAtivada) audioManager.iniciarBGM();
    });
}

if (btnConfig) {
    btnConfig.addEventListener('click', () => {
        audioManager.tocarClique();
        telaInicio.classList.add('hidden');
        telaConfig.classList.remove('hidden');
    });
}
if (btnVoltarConfig) {
    btnVoltarConfig.addEventListener('click', () => {
        audioManager.tocarClique();
        telaConfig.classList.add('hidden');
        telaInicio.classList.remove('hidden');
    });
}

const btnPausaSfx = document.getElementById('btn-pausa-sfx');
const btnPausaBgm = document.getElementById('btn-pausa-bgm');

function atualizarBotoesAudioUI() {
    const iconeSfx = audioManager.somAtivado ? "assets/icon_sfxon.png" : "assets/icon_sfxoff.png";
    const textoSfx = audioManager.somAtivado ? "SFX: ATIVADO" : "SFX: DESATIVADO";
    const htmlSfx = `<img src="${iconeSfx}" class="icone-btn-config" alt="SFX"><span>${textoSfx}</span>`;

    const iconeBgm = audioManager.musicaAtivada ? "assets/icon_musicon.png" : "assets/icon_musicoff.png";
    const textoBgm = audioManager.musicaAtivada ? "BGM: ATIVADO" : "BGM: DESATIVADO";
    const htmlBgm = `<img src="${iconeBgm}" class="icone-btn-config" alt="BGM"><span>${textoBgm}</span>`;

    if (btnToggleSfx) btnToggleSfx.innerHTML = htmlSfx;
    if (btnPausaSfx) btnPausaSfx.innerHTML = htmlSfx;

    if (btnToggleBgm) btnToggleBgm.innerHTML = htmlBgm;
    if (btnPausaBgm) btnPausaBgm.innerHTML = htmlBgm;
}

function alternarSfxGlobal() {
    audioManager.somAtivado = !audioManager.somAtivado;
    atualizarBotoesAudioUI();
    audioManager.tocarClique();
}

function alternarBgmGlobal() {
    audioManager.musicaAtivada = !audioManager.musicaAtivada;
    atualizarBotoesAudioUI();
    if (audioManager.musicaAtivada) audioManager.iniciarBGM();
    else audioManager.pararBGM();
    audioManager.tocarClique();
}

if (btnToggleSfx) btnToggleSfx.addEventListener('click', alternarSfxGlobal);
if (btnPausaSfx) btnPausaSfx.addEventListener('click', alternarSfxGlobal);

if (btnToggleBgm) btnToggleBgm.addEventListener('click', alternarBgmGlobal);
if (btnPausaBgm) btnPausaBgm.addEventListener('click', alternarBgmGlobal);

document.addEventListener('click', () => {
    if (audioManager.musicaAtivada && !audioManager.intervaloMusica) {
        audioManager.iniciarBGM();
    }
}, { once: true });

if (btnIniciar) {
    btnIniciar.addEventListener('click', () => {
        audioManager.tocarClique();
        modoCampanhaAtivo = false;
        renderizarSelecao();
        telaInicio.classList.add('hidden');
        telaSelecao.classList.remove('hidden');
    });
}

const btnCampanha = document.getElementById('btn-campanha');
if (btnCampanha) {
    btnCampanha.addEventListener('click', () => {
        audioManager.tocarClique();
        abrirModoCampanha();
    });
}

const btnVoltarCampanha = document.getElementById('btn-voltar-campanha');
if (btnVoltarCampanha) {
    btnVoltarCampanha.addEventListener('click', () => {
        audioManager.tocarClique();
        document.getElementById('tela-campanha').classList.add('hidden');
        telaInicio.classList.remove('hidden');
    });
}

if (btnVoltarInicio) {
    btnVoltarInicio.addEventListener('click', () => {
        audioManager.tocarClique();
        if (audioManager.pararDublagem) audioManager.pararDublagem();
        telaSelecao.classList.add('hidden');
        if (modoCampanhaAtivo) {
            document.getElementById('tela-campanha').classList.remove('hidden');
        } else {
            telaInicio.classList.remove('hidden');
        }
    });
}

if (btnJogarNovamente) {
    btnJogarNovamente.addEventListener('click', () => {
        audioManager.tocarClique();
        if (audioManager.pararDublagem) audioManager.pararDublagem();
        telaFimJogo.classList.add('hidden');
        renderizarSelecao();
        telaSelecao.classList.remove('hidden');
        if (audioManager.musicaAtivada) audioManager.iniciarBGM();
    });
}

let guardiaoSelecionadoP1 = null;
let guardiaoSelecionadoCPU = null;
let mapaSelecionadoLivre = 1;
let estagioCenarioAtual = 1;
let travarCliquesSelecao = false;
const ordemChefesCampanha = ['lorentz', 'faraday', 'ampere', 'wilhelm', 'ohm'];

// Fallback idêntico ao teu cards.json caso o navegador bloqueie o fetch via file://
const DADOS_CARDS_FALLBACK = [
    { id: "lorentz", nome: "Lorentz", classe: "Propulsor (Ataque)", pv: 100, retrato: "assets/lorentz.png" },
    { id: "faraday", nome: "Faraday", classe: "Indutora (Defesa)", pv: 110, retrato: "assets/faraday.png" },
    { id: "ampere",  nome: "Ampère",  classe: "Magnetista (Controle)", pv: 100, retrato: "assets/ampere.png" },
    { id: "wilhelm", nome: "Wilhelm", classe: "Polarizador (Controle)", pv: 85, retrato: "assets/wilhelm.png" },
    { id: "ohm",     nome: "Ohm",     classe: "Engenheiro (Defesa)", pv: 95, retrato: "assets/ohm.png" }
];

// CARREGA OS GUARDIÕES (SEM ERRO DE CORS NO F12 AO ABRIR VIA FILE://)
if (window.location.protocol === 'file:') {
    guardioesData = DADOS_CARDS_FALLBACK;
    renderizarSelecao();
} else {
    fetch('cards.json')
        .then(response => {
            if (!response.ok) throw new Error("HTTP " + response.status);
            return response.json();
        })
        .then(data => {
            guardioesData = (Array.isArray(data) && data.length > 0) ? data : DADOS_CARDS_FALLBACK;
            renderizarSelecao();
        })
        .catch(() => {
            guardioesData = DADOS_CARDS_FALLBACK;
            renderizarSelecao();
        });
}

function atualizarPainelLateralVS(lado, guardiao, animar = false) {
    const isP1 = lado === 'p1';
    const cardBox = document.getElementById(isP1 ? 'vs-card-p1' : 'vs-card-cpu');
    const imgEl = document.getElementById(isP1 ? 'vs-img-p1' : 'vs-img-cpu');
    const placeholderEl = document.getElementById(isP1 ? 'vs-placeholder-p1' : 'vs-placeholder-cpu');
    const nomeEl = document.getElementById(isP1 ? 'vs-nome-p1' : 'vs-nome-cpu');
    const classeEl = document.getElementById(isP1 ? 'vs-classe-p1' : 'vs-classe-cpu');

    if (!cardBox || !imgEl || !nomeEl || !classeEl) return;

    if (!guardiao) {
        cardBox.classList.add('vazio');
        imgEl.classList.add('hidden');
        imgEl.classList.remove('anim-selecao-p1', 'anim-selecao-cpu');
        if (placeholderEl) placeholderEl.classList.remove('hidden');
        nomeEl.innerText = "AGUARDANDO...";
        classeEl.innerText = isP1 ? "Escolha seu Guardião" : "Escolha o Oponente";
        return;
    }

    cardBox.classList.remove('vazio');
    if (placeholderEl) placeholderEl.classList.add('hidden');
    imgEl.src = `assets/${guardiao.id}_body.png`;
    imgEl.classList.remove('hidden');
    nomeEl.innerText = guardiao.nome.toUpperCase();
    const bonusPvLat = window.obterBonusUpgradeGuardiao ? window.obterBonusUpgradeGuardiao(guardiao.id).pvExtra : 0;
    classeEl.innerHTML = `<img src="assets/icon_classe.png" class="icone-hud" alt="Classe"> ${guardiao.classe} | <img src="assets/pv.png" class="icone-hud" alt="PV"> PV: ${guardiao.pv + bonusPvLat}`;

    if (animar) {
        const classeAnim = isP1 ? 'anim-selecao-p1' : 'anim-selecao-cpu';
        imgEl.classList.remove(classeAnim);
        void imgEl.offsetWidth;
        imgEl.classList.add(classeAnim);

        if (isP1 && guardiao.id === 'ampere' && audioManager.tocarDublagem) {
            audioManager.tocarDublagem('ampere_selecao');
        }
    }
}

function renderizarSelecao() {
    if (!listaGuardioes) return;
    travarCliquesSelecao = false;
    guardiaoSelecionadoP1 = null;

    if (modoCampanhaAtivo) {
        const idBoss = ordemChefesCampanha[faseAtualCampanha - 1];
        guardiaoSelecionadoCPU = guardioesData.find(g => g.id === idBoss) || guardioesData[0];
        mapaSelecionadoLivre = faseAtualCampanha;
    } else {
        guardiaoSelecionadoCPU = null;
        mapaSelecionadoLivre = null;
    }

    atualizarPainelLateralVS('p1', null, false);
    atualizarPainelLateralVS('cpu', guardiaoSelecionadoCPU, modoCampanhaAtivo);
    atualizarInterfaceCardsEMapas();
}

function atualizarInterfaceCardsEMapas() {
    if (!listaGuardioes) return;
    listaGuardioes.innerHTML = '';

    const instrucaoEl = document.getElementById('instrucao-selecao');
    const secaoMapas = document.getElementById('secao-mapas-selecao');
    const listaMapas = document.getElementById('lista-mapas-selecao');

    if (telaSelecao) {
        telaSelecao.classList.remove('modo-escolha-cpu', 'modo-escolha-mapa');
        if (!modoCampanhaAtivo) {
            if (guardiaoSelecionadoP1 && !guardiaoSelecionadoCPU) {
                telaSelecao.classList.add('modo-escolha-cpu');
            } else if (guardiaoSelecionadoP1 && guardiaoSelecionadoCPU) {
                telaSelecao.classList.add('modo-escolha-mapa');
            }
        }
    }

    if (instrucaoEl) {
        if (!guardiaoSelecionadoP1) {
            instrucaoEl.innerText = "1. ESCOLHA O SEU GUARDIÃO (AZUL)";
            instrucaoEl.style.color = "#4da6ff";
        } else if (!guardiaoSelecionadoCPU) {
            instrucaoEl.innerText = "2. VEZ DO OPONENTE: ESCOLHA O INIMIGO (VERMELHO)";
            instrucaoEl.style.color = "#ff6b6b";
        } else if (!mapaSelecionadoLivre) {
            instrucaoEl.innerText = "3. ESCOLHA UM DOS 5 MAPAS DA ARENA";
            instrucaoEl.style.color = "#f1c40f";
        } else {
            const nomeArena = estagiosCampanha[mapaSelecionadoLivre]?.nomeCurto.toUpperCase() || "ARENA";
            instrucaoEl.innerText = `PRONTO! (${guardiaoSelecionadoP1.nome.toUpperCase()} VS ${guardiaoSelecionadoCPU.nome.toUpperCase()} • ${nomeArena}) — CLIQUE EM COMEÇAR!`;
            instrucaoEl.style.color = "#2ecc71";
        }
    }

    const idBossCampanha = modoCampanhaAtivo ? ordemChefesCampanha[faseAtualCampanha - 1] : null;

    guardioesData.forEach(guardiao => {
        const isP1 = guardiaoSelecionadoP1 && guardiaoSelecionadoP1.id === guardiao.id;
        const isCPU = guardiaoSelecionadoCPU && guardiaoSelecionadoCPU.id === guardiao.id;
        const bloqueadoCampanha = modoCampanhaAtivo && guardiao.id === idBossCampanha;
        const bonusPvUpgrade = window.obterBonusUpgradeGuardiao ? window.obterBonusUpgradeGuardiao(guardiao.id).pvExtra : 0;
        const pvExibido = guardiao.pv + bonusPvUpgrade;

        const card = document.createElement('div');
        card.className = `card-guardiao ${isP1 ? 'selecionado-p1' : ''} ${isCPU ? 'selecionado-cpu' : ''} ${bloqueadoCampanha ? 'bloqueado' : ''}`;

        let badgeHTML = '';
        if (isP1) badgeHTML = '<span class="badge-selecao-card p1">VOCÊ</span>';
        else if (isCPU) badgeHTML = '<span class="badge-selecao-card cpu">INIMIGO</span>';

        card.innerHTML = `
            ${badgeHTML}
            <div style="position: relative; display: inline-block;">
                <img src="${guardiao.retrato}" alt="${guardiao.nome}">
                ${bloqueadoCampanha ? '<img src="assets/cadeado.png" class="cadeado-overlay-selecao" alt="Bloqueado">' : ''}
            </div>
            <h3>${guardiao.nome}</h3>
            <p class="classe-card-selecao"><img src="assets/icon_classe.png" class="icone-hud" alt="Classe"> ${guardiao.classe}</p>
            <p class="pv-card-selecao"><img src="assets/pv.png" class="icone-hud" alt="PV"> PV: ${guardiao.pv}</p>
            ${bonusPvUpgrade > 0 ? `<span class="badge-pv-upgrade-card">+${bonusPvUpgrade} PV</span>` : ''}
        `;

        if (!bloqueadoCampanha) {
            card.addEventListener('click', () => {
                if (travarCliquesSelecao) return;
                audioManager.tocarClique();

                if (modoCampanhaAtivo) {
                    guardiaoSelecionadoP1 = isP1 ? null : guardiao;
                    atualizarPainelLateralVS('p1', guardiaoSelecionadoP1, !!guardiaoSelecionadoP1);
                    atualizarInterfaceCardsEMapas();
                    return;
                }

                if (isP1) {
                    guardiaoSelecionadoP1 = null;
                    atualizarPainelLateralVS('p1', null, false);
                } else if (isCPU) {
                    guardiaoSelecionadoCPU = null;
                    atualizarPainelLateralVS('cpu', null, false);
                } else if (!guardiaoSelecionadoP1) {
                    guardiaoSelecionadoP1 = guardiao;
                    atualizarPainelLateralVS('p1', guardiao, true);
                } else {
                    guardiaoSelecionadoCPU = guardiao;
                    atualizarPainelLateralVS('cpu', guardiao, true);
                }

                atualizarInterfaceCardsEMapas();
            });
        }
        listaGuardioes.appendChild(card);
    });

    if (secaoMapas && listaMapas) {
        const tituloMapas = secaoMapas.querySelector('.titulo-secao-mapas');
        if (modoCampanhaAtivo) {
            secaoMapas.classList.remove('aguardando-lutadores');
            secaoMapas.classList.add('pronto-para-mapa');
            if (tituloMapas) tituloMapas.innerText = `ARENA DA FASE 0${faseAtualCampanha}: ${estagiosCampanha[faseAtualCampanha].nomeCurto.toUpperCase()}`;
        } else if (guardiaoSelecionadoP1 && guardiaoSelecionadoCPU) {
            secaoMapas.classList.remove('aguardando-lutadores');
            secaoMapas.classList.add('pronto-para-mapa');
            if (tituloMapas) tituloMapas.innerText = "3. SELECIONE A ARENA DE BATALHA";
        } else {
            secaoMapas.classList.add('aguardando-lutadores');
            secaoMapas.classList.remove('pronto-para-mapa');
            if (tituloMapas) tituloMapas.innerText = "SELECIONE OS LUTADORES PRIMEIRO";
        }

        listaMapas.innerHTML = '';
        for (let m = 1; m <= 5; m++) {
            const dadosMapa = estagiosCampanha[m];
            const cardMapa = document.createElement('div');
            const isMapaAtivo = modoCampanhaAtivo ? (m === faseAtualCampanha) : (mapaSelecionadoLivre === m);
            const bloqueadoNoArcade = modoCampanhaAtivo && (m !== faseAtualCampanha);

            cardMapa.className = `card-mapa-selecao ${isMapaAtivo ? 'mapa-selecionado' : ''} ${bloqueadoNoArcade ? 'mapa-bloqueado-arcade' : ''}`;
            cardMapa.innerHTML = `
                <div class="thumb-mapa-wrapper">
                    <img src="${dadosMapa.bg}" alt="${dadosMapa.nomeCurto}" class="img-thumb-mapa">
                    ${bloqueadoNoArcade ? '<img src="assets/cadeado.png" class="cadeado-overlay-mapa" alt="Bloqueado">' : ''}
                </div>
                <span>${dadosMapa.nomeCurto}</span>
            `;

            if (!modoCampanhaAtivo) {
                cardMapa.addEventListener('click', () => {
                    if (travarCliquesSelecao || !guardiaoSelecionadoP1 || !guardiaoSelecionadoCPU) return;
                    audioManager.tocarClique();
                    mapaSelecionadoLivre = m;
                    atualizarInterfaceCardsEMapas();
                });
            }
            listaMapas.appendChild(cardMapa);
        }
    }

    if (window.atualizarEstadoBotaoComecarSelecao) {
        window.atualizarEstadoBotaoComecarSelecao();
    }
}

let timerTypewriterCutscene = null;
let digitandoCutsceneAtivo = false;

function iniciarCutsceneCampanha(numeroFase, jogador, boss, callbackFim) {
    const modalCutscene = document.getElementById('modal-cutscene');
    const dialogos = dialogosCampanha[numeroFase] || [];
    if (!modalCutscene || dialogos.length === 0) {
        callbackFim();
        return;
    }

    if (telaSelecao) telaSelecao.classList.add('hidden');

    document.getElementById('cutscene-img-boss').src = boss.retrato;
    document.getElementById('cutscene-nome-boss').innerText = boss.nome.toUpperCase();
    document.getElementById('cutscene-speaker-boss').innerText = `${boss.nome.toUpperCase()} (OPONENTE):`;

    document.getElementById('cutscene-img-jogador').src = jogador.retrato;
    document.getElementById('cutscene-nome-jogador').innerText = jogador.nome.toUpperCase();
    document.getElementById('cutscene-speaker-player').innerText = `${jogador.nome.toUpperCase()} (VOCÊ):`;

    const biomaCutscene = estagiosCampanha[numeroFase] || estagiosCampanha[1];
    document.getElementById('cutscene-estagio-tag').innerText = `${biomaCutscene.setor} (${biomaCutscene.subtitulo.toUpperCase()})`;

    const linhaBoss = document.getElementById('cutscene-linha-boss');
    const linhaPlayer = document.getElementById('cutscene-linha-player');
    const textoBoss = document.getElementById('cutscene-texto-boss');
    const textoPlayer = document.getElementById('cutscene-texto-player');
    const btnAvancar = document.getElementById('btn-avancar-dialogo');

    textoBoss.textContent = "";
    textoPlayer.textContent = "...";
    if (linhaBoss) linhaBoss.classList.remove('aguardando');
    if (linhaPlayer) linhaPlayer.classList.add('aguardando');
    if (btnAvancar) btnAvancar.innerText = "AVANÇAR ▶";

    let indiceFala = 0;

    const renderizarFalaComTypewriter = () => {
        if (timerTypewriterCutscene) clearInterval(timerTypewriterCutscene);
        if (audioManager.pararDublagem) audioManager.pararDublagem();

        const falaAtual = dialogos[indiceFala];
        const elementoAlvo = (falaAtual.quem === 'boss') ? textoBoss : textoPlayer;

        if (falaAtual.quem === 'player') {
            if (linhaPlayer) linhaPlayer.classList.remove('aguardando');
            if (btnAvancar) btnAvancar.innerText = "LUTAR ▶";
        } else {
            if (linhaBoss) linhaBoss.classList.remove('aguardando');
            if ((boss.id === 'ampere' || numeroFase === 3) && audioManager.tocarDublagem) {
                audioManager.tocarDublagem('ampere_iniciofase');
            }
        }

        elementoAlvo.textContent = "";
        let charIndex = 0;
        let textoAcumulado = "";
        digitandoCutsceneAtivo = true;

        timerTypewriterCutscene = setInterval(() => {
            if (charIndex < falaAtual.fala.length) {
                const letra = falaAtual.fala.charAt(charIndex);
                textoAcumulado += letra;
                elementoAlvo.textContent = textoAcumulado;
                if (charIndex % 2 === 0 && letra !== ' ' && audioManager.tocarBlipTexto) {
                    audioManager.tocarBlipTexto(falaAtual.quem);
                }
                charIndex++;
            } else {
                clearInterval(timerTypewriterCutscene);
                timerTypewriterCutscene = null;
                digitandoCutsceneAtivo = false;
            }
        }, 25);
    };

    renderizarFalaComTypewriter();
    modalCutscene.classList.remove('hidden');

    btnAvancar.onclick = () => {
        audioManager.tocarClique();
        const falaAtual = dialogos[indiceFala];
        const elementoAlvo = (falaAtual.quem === 'boss') ? textoBoss : textoPlayer;

        if (digitandoCutsceneAtivo) {
            if (timerTypewriterCutscene) clearInterval(timerTypewriterCutscene);
            timerTypewriterCutscene = null;
            elementoAlvo.textContent = falaAtual.fala;
            digitandoCutsceneAtivo = false;
            return;
        }

        indiceFala++;
        if (indiceFala < dialogos.length) {
            renderizarFalaComTypewriter();
        } else {
            if (timerTypewriterCutscene) clearInterval(timerTypewriterCutscene);
            timerTypewriterCutscene = null;
            if (audioManager.pararDublagem) audioManager.pararDublagem();
            btnAvancar.onclick = null;
            modalCutscene.classList.add('hidden');
            callbackFim();
        }
    };
}

// ==========================================
// MOTOR DE TEMPO PAUSÁVEL (TIMERS E CANVAS)
// ==========================================
let timersBatalha = [];
let idLoopAnimacao = null;
let tempoAcumuladoArena = 0;
let ultimoTimestampArena = performance.now();

setInterval(() => {
    if (jogoPausado || timersBatalha.length === 0) return;
    for (let i = timersBatalha.length - 1; i >= 0; i--) {
        const t = timersBatalha[i];
        t.restante -= 25;
        if (t.restante <= 0) {
            timersBatalha.splice(i, 1);
            try { t.callback(); } catch (err) { console.error(err); }
        }
    }
}, 25);

function agendarTimerBatalha(callback, delayMs) {
    const id = Symbol('timer');
    timersBatalha.push({ id, callback, restante: delayMs });
    return id;
}

function cancelarTimerBatalha(id) {
    timersBatalha = timersBatalha.filter(t => t.id !== id);
}

function limparTimersBatalha() {
    timersBatalha = [];
    if (timerTypewriterDica) {
        clearInterval(timerTypewriterDica);
        timerTypewriterDica = null;
    }
}

function pararLoopAnimacaoArena() {
    if (idLoopAnimacao) {
        cancelAnimationFrame(idLoopAnimacao);
        idLoopAnimacao = null;
    }
}

function obterTempoArena() {
    const agora = performance.now();
    if (!jogoPausado) {
        tempoAcumuladoArena += (agora - ultimoTimestampArena);
    }
    ultimoTimestampArena = agora;
    return tempoAcumuladoArena;
}

function definirEstadoPausa(pausar) {
    jogoPausado = pausar;
    ultimoTimestampArena = performance.now();
    const splash = document.getElementById('splash-turno');
    if (telaJogo) telaJogo.classList.toggle('jogo-pausado-ativo', pausar);
    if (splash) splash.classList.toggle('jogo-pausado-ativo', pausar);
}

// 2. CONFIGURAÇÃO DA BATALHA E HUD

function adicionarLog(mensagem, tipo = 'neutro') {
    const logContainer = document.getElementById('log-batalha');
    if (!logContainer) return;

    const mensagemFormatada = mensagem
        .replace(/dano/gi, '<img src="assets/atk.png" class="icone-hud" alt="Atk"> dano')
        .replace(/ataque/gi, '<img src="assets/atk.png" class="icone-hud" alt="Atk"> ataque')
        .replace(/escudo/gi, '<img src="assets/dfs.png" class="icone-hud" alt="Def"> escudo')
        .replace(/defesa/gi, '<img src="assets/dfs.png" class="icone-hud" alt="Def"> defesa')
        .replace(/PV/g, '<img src="assets/pv.png" class="icone-hud" alt="PV"> PV')
        .replace(/ULTIMATO/gi, '<img src="assets/ult.png" class="icone-hud" alt="Ult"> ULTIMATO')
        .replace(/EN/g, '<img src="assets/en.png" class="icone-hud" alt="EN"> EN');

    const novaLinha = document.createElement('p');
    novaLinha.className = `log-linha ${tipo}`;
    novaLinha.innerHTML = `>> ${mensagemFormatada}`;

    logContainer.appendChild(novaLinha);
    while (logContainer.children.length > 4) logContainer.removeChild(logContainer.firstChild);
    logContainer.scrollTop = logContainer.scrollHeight;
}

function iniciarBatalha(guardiaoEscolhido) {
    limparTimersBatalha();
    definirEstadoPausa(false);
    if (audioManager.pararDublagem) audioManager.pararDublagem();

    jogadorAtual = guardiaoEscolhido;
    numeroTurno = 1;
    ultimoTurnoDescansoIA = -5;
    acertosSeguidosLorentz = 0;
    tomouDanoUltOhm = false;

    const boxBalao = document.getElementById('balao-dica-jogador');
    if (boxBalao) boxBalao.classList.add('hidden');

    const fasePrevisao = document.getElementById('fase-previsao');
    const faseConfiguracao = document.getElementById('fase-configuracao');
    if (fasePrevisao) fasePrevisao.classList.add('hidden');
    if (faseConfiguracao) faseConfiguracao.classList.remove('hidden');
    if (inputsDinamicos) inputsDinamicos.innerHTML = '';

    if (modoCampanhaAtivo) {
        inimigoAtual = obterInimigoCampanha(jogadorAtual.id);
        estagioCenarioAtual = faseAtualCampanha;
    } else {
        if (guardiaoSelecionadoCPU) {
            inimigoAtual = guardiaoSelecionadoCPU;
        } else {
            const inimigosPossiveis = guardioesData.filter(g => g.id !== jogadorAtual.id);
            inimigoAtual = inimigosPossiveis[Math.floor(Math.random() * inimigosPossiveis.length)];
        }
        estagioCenarioAtual = mapaSelecionadoLivre || 1;
    }

    const bioma = estagiosCampanha[estagioCenarioAtual] || estagiosCampanha[1];
    arenaAtual.campoB = bioma.campoB;
    arenaAtual.sentido = bioma.sentido;
    inicializarClimaBioma();

    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    const spriteJogadorBody = document.getElementById('sprite-jogador-body');
    const spriteInimigoBody = document.getElementById('sprite-inimigo-body');
    const spriteJogadorPeq = document.getElementById('sprite-jogador-peq');
    const spriteInimigoPeq = document.getElementById('sprite-inimigo-peq');

    if (spriteJogadorPeq) spriteJogadorPeq.src = jogadorAtual.retrato;
    if (spriteInimigoPeq) spriteInimigoPeq.src = inimigoAtual.retrato;

    if (spriteJogadorBody) {
        spriteJogadorBody.src = `assets/${jogadorAtual.id}_body.png`;
        spriteJogadorBody.className = "sprite-grande idle-esq sprite-batalha-jogador";
    }
    if (spriteInimigoBody) {
        spriteInimigoBody.src = `assets/${inimigoAtual.id}_body.png`;
        spriteInimigoBody.className = "sprite-grande idle-dir sprite-batalha-inimigo";
    }

    const hudJSub = document.querySelector('.hud-jogador .classe-sub');
    const hudISub = document.querySelector('.hud-inimigo .classe-sub');
    if (hudJSub) hudJSub.innerText = jogadorAtual.classe || "Guardião";
    if (hudISub) hudISub.innerText = inimigoAtual.classe || "Oponente";

    setElementText('nome-jogador', jogadorAtual.nome);
    maxPvJogador = jogadorAtual.pv;
    let pvInicialJogador = maxPvJogador;
    if (modoCampanhaAtivo && faseAtualCampanha > 1) {
        pvInicialJogador = Math.min(maxPvJogador, pvPersistenteJogador);
    }
    setElementText('pv-jogador', pvInicialJogador);
    setElementText('en-jogador', "10");
    setElementText('foco-jogador', "0");

    setElementText('nome-inimigo', inimigoAtual.nome);
    setElementText('pv-inimigo', inimigoAtual.pv);
    setElementText('en-inimigo', "10");
    setElementText('foco-inimigo', "0");

    protecaoJogador = 0;
    protecaoInimigo = 0;
    faseAtual = 1;
    turnoDoJogador = true;

    const textoFase = document.getElementById('fase-atual');
    if (textoFase) {
        textoFase.innerText = `TURNO 0${numeroTurno} • SUA VEZ`;
        textoFase.className = "texto-turno-jogador";
    }

    if (painelAcoes) painelAcoes.classList.add('hidden');
    if (painelFeedback) painelFeedback.classList.add('hidden');

    telaJogo.classList.remove('turno-inimigo-ativo');
    telaSelecao.classList.add('hidden');
    telaJogo.classList.remove('hidden');

    efeitoCanvas = null;
    maxPvInimigo = inimigoAtual.pv;

    const logContainer = document.getElementById('log-batalha');
    if (logContainer) logContainer.innerHTML = '';

    const textoInicioBatalha = modoCampanhaAtivo
        ? `Campanha [Fase ${faseAtualCampanha}/5 - ${bioma.nomeCurto}]: ${jogadorAtual.nome} vs ${inimigoAtual.nome}!`
        : `Duelo Livre [${bioma.nomeCurto}]: ${jogadorAtual.nome} vs ${inimigoAtual.nome}!`;

    adicionarLog(textoInicioBatalha, 'neutro');
    adicionarLog(`[Condição da Arena] ${bioma.efeitoTitulo}: ${bioma.efeitoResumo}`, 'neutro');
    atualizarHUD();

    if (!idLoopAnimacao) {
        loopAnimacao();
    }

    mostrarSequenciaInicioCombate();
}

function criarTextoFlutuante(texto, isJogador, tipo = 'dano') {
    const el = document.createElement('div');
    el.innerText = texto;
    el.className = `dano-flutuante ${tipo}`;
    el.style.left = isJogador ? '20%' : '80%';

    const container = document.getElementById('arena-container');
    if (container) {
        container.appendChild(el);
        agendarTimerBatalha(() => el.remove(), 1200);
    }
}

function criarCalloutTatico(texto, isJogador, cor = '#f1c40f') {
    const el = document.createElement('div');
    el.innerText = texto;
    el.className = 'callout-tatico';
    el.style.left = isJogador ? '23%' : '77%';
    el.style.borderColor = cor;
    el.style.color = cor;
    el.style.boxShadow = `3px 3px 0px #000, 0 0 12px ${cor}66`;

    const container = document.getElementById('arena-container');
    if (container) {
        container.appendChild(el);
        agendarTimerBatalha(() => el.remove(), 1350);
    }
}

function atualizarBadgeEscudoNoHud(seletorHud, idBadge, valorProtecao) {
    const hud = document.querySelector(seletorHud);
    if (!hud) return;

    let badge = document.getElementById(idBadge);
    if (!badge) {
        badge = document.createElement('div');
        badge.id = idBadge;
        badge.className = 'badge-escudo-hud hidden';
        hud.appendChild(badge);
    }

    if (valorProtecao > 0) {
        const pctEscudo = Math.round(valorProtecao * 100);
        badge.innerHTML = `<img src="assets/dfs.png" class="icone-hud" alt="Escudo"><span>${pctEscudo}%</span>`;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

const nomesHabilidadesGuardioes = {
    lorentz: { basica: "DISPARO CURVO", subBasica: "Força de Lorentz (1-8 EN)", ult: "TRILHO DE FORÇA" },
    faraday: { basica: "ESPIRA DE LENZ", subBasica: "Ataque ou Barreira (2-6 EN)", ult: "GERADOR MANUAL" },
    ampere:  { basica: "ELETROÍMÃ", subBasica: "Solenoide N·i (2-10 EN)", ult: "INVERSÃO POLAR" },
    wilhelm: { basica: "BÚSSOLA DE WEBER", subBasica: "Triangulação (3-7 EN)", ult: "POLOS OPOSTOS" },
    ohm:     { basica: "MONTAR CIRCUITO", subBasica: "Lei de Ohm (3-5 EN)", ult: "CURTO CONTROLADO" }
};

function atualizarMenuComandosPokemon() {
    const painelCmd = document.getElementById('menu-comandos-pokemon');
    const statusTxt = document.getElementById('status-comandos-txt');
    const btnBasico = document.getElementById('btn-cmd-basico');
    const btnUlt = document.getElementById('btn-cmd-ult');
    const btnDescanso = document.getElementById('btn-cmd-descansar');

    if (!painelCmd || !jogadorAtual) return;

    const infoHab = nomesHabilidadesGuardioes[jogadorAtual.id] || nomesHabilidadesGuardioes.lorentz;
    const ultJ = parseInt(document.getElementById('foco-jogador')?.innerText || "0", 10);
    const podeAgir = (turnoDoJogador && faseAtual === 1);

    document.getElementById('nome-cmd-basico').innerHTML = `<span class="kbd-atalho">1</span>${infoHab.basica}`;
    document.getElementById('sub-cmd-basico').innerText = infoHab.subBasica;
    document.getElementById('nome-cmd-ult').innerHTML = `<span class="kbd-atalho">2</span>ULT: ${infoHab.ult}`;
    document.getElementById('sub-cmd-ult').innerText = ultJ >= 3 ? "PRONTO PARA DISPARAR!" : `Carga de Foco: ${ultJ} / 3`;

    const tituloDescanso = btnDescanso ? btnDescanso.querySelector('.titulo-cmd-poke') : null;
    if (tituloDescanso) tituloDescanso.innerHTML = `<span class="kbd-atalho">3</span>DESCANSAR`;
    painelCmd.classList.toggle('comandos-inativos', !podeAgir);

    if (statusTxt) {
        if (!turnoDoJogador) statusTxt.innerText = "AGUARDANDO TURNO INIMIGO...";
        else if (faseAtual !== 1) statusTxt.innerText = "CALIBRANDO PARÂMETROS...";
        else statusTxt.innerText = "ESCOLHA A AÇÃO";
    }

    if (btnBasico) btnBasico.disabled = !podeAgir;
    if (btnDescanso) btnDescanso.disabled = !podeAgir;
    if (btnUlt) btnUlt.disabled = !(podeAgir && ultJ >= 3);
}

function atualizarHUD() {
    const pvJ = parseInt(document.getElementById('pv-jogador').innerText, 10) || 0;
    const pvI = parseInt(document.getElementById('pv-inimigo').innerText, 10) || 0;
    const enJ = parseInt(document.getElementById('en-jogador').innerText, 10) || 0;
    const enI = parseInt(document.getElementById('en-inimigo').innerText, 10) || 0;
    const ultJ = parseInt(document.getElementById('foco-jogador').innerText, 10) || 0;
    const ultI = parseInt(document.getElementById('foco-inimigo').innerText, 10) || 0;

    const barraPvJ = document.getElementById('barra-pv-jogador');
    const barraPvI = document.getElementById('barra-pv-inimigo');
    const barraFantasmaJ = document.getElementById('barra-pv-fantasma-jogador');
    const barraFantasmaI = document.getElementById('barra-pv-fantasma-inimigo');

    const pctJ = Math.max(0, Math.min(100, (pvJ / maxPvJogador) * 100));
    const pctI = Math.max(0, Math.min(100, (pvI / maxPvInimigo) * 100));

    if (barraPvJ) {
        barraPvJ.style.width = `${pctJ}%`;
        barraPvJ.classList.toggle('critico', pctJ <= 30);
    }
    if (barraFantasmaJ) barraFantasmaJ.style.width = `${pctJ}%`;

    if (barraPvI) {
        barraPvI.style.width = `${pctI}%`;
        barraPvI.classList.toggle('critico', pctI <= 30);
    }
    if (barraFantasmaI) barraFantasmaI.style.width = `${pctI}%`;

    const barraEnJ = document.getElementById('barra-en-jogador');
    const barraEnI = document.getElementById('barra-en-inimigo');
    if (barraEnJ) barraEnJ.style.width = `${(enJ / 10) * 100}%`;
    if (barraEnI) barraEnI.style.width = `${(enI / 10) * 100}%`;

    for (let i = 1; i <= 3; i++) {
        const uj = document.getElementById(`ult-j-${i}`);
        const ui = document.getElementById(`ult-i-${i}`);
        if (uj) uj.classList.toggle('cheio', i <= ultJ);
        if (ui) ui.classList.toggle('cheio', i <= ultI);
    }

    atualizarBadgeEscudoNoHud('.hud-jogador', 'badge-escudo-jogador', protecaoJogador);
    atualizarBadgeEscudoNoHud('.hud-inimigo', 'badge-escudo-inimigo', protecaoInimigo);

    const hudJ = document.querySelector('.hud-jogador');
    const hudI = document.querySelector('.hud-inimigo');
    if (hudJ) hudJ.classList.toggle('ult-pronta-hud', ultJ >= 3);
    if (hudI) hudI.classList.toggle('ult-pronta-hud-inimigo', ultI >= 3);

    atualizarMenuComandosPokemon();
}

let timerSplashAtivo = null;
let timerSequenciaLuta = null;

function mostrarSplash(texto, cor, duracao = 1400) {
    const splash = document.getElementById('splash-turno');
    if (!splash) return;

    if (timerSplashAtivo) cancelarTimerBatalha(timerSplashAtivo);

    splash.classList.remove('animar-splash');
    splash.innerHTML = `<span class="splash-texto-interno">${texto}</span>`;
    splash.style.borderColor = cor;
    splash.style.color = cor;
    splash.style.boxShadow = `0 0 35px ${cor}66, inset 0 0 25px ${cor}44`;
    splash.classList.remove('hidden');

    void splash.offsetWidth;
    splash.classList.add('animar-splash');

    timerSplashAtivo = agendarTimerBatalha(() => {
        splash.classList.remove('animar-splash');
        splash.classList.add('hidden');
        timerSplashAtivo = null;
    }, duracao);
}

function mostrarSequenciaInicioCombate() {
    if (timerSequenciaLuta) cancelarTimerBatalha(timerSequenciaLuta);
    mostrarSplash("PREPARAR...", "#f1c40f", 950);

    timerSequenciaLuta = agendarTimerBatalha(() => {
        audioManager.tocarAtaque();
        mostrarSplash("BATALHAR!", "#2ecc71", 1150);
        if (telaJogo) {
            telaJogo.classList.add('shake-leve');
            agendarTimerBatalha(() => telaJogo.classList.remove('shake-leve'), 300);
        }
    }, 980);
}

// ==========================================
// 3. CONTROLE DE TURNOS E COMANDOS POKÉMON
// ==========================================
let modoUltimatoSelecionado = false;

function validarEN(custo) {
    // BÔNUS DO OBSERVATÓRIO BOREAL (Fase 4): Frio Supercondutor reduz o custo em -1 EN (mínimo 1)
    let custoFinal = custo;
    if (estagioCenarioAtual === 4) {
        custoFinal = Math.max(1, custo - 1);
    }

    const enAtual = parseInt(document.getElementById('en-jogador').innerText, 10);
    const txtEn = document.getElementById('custo-en');
    if (!txtEn) return;
    txtEn.innerText = estagioCenarioAtual === 4 ? `${custoFinal} (-1)` : custoFinal;

    if (custoFinal > enAtual) {
        txtEn.style.color = '#e74c3c';
        btnConfirmar.disabled = true;
        btnConfirmar.innerText = "EN INSUFICIENTE";
    } else {
        txtEn.style.color = estagioCenarioAtual === 4 ? '#18ffff' : '#ecf0f1';
        btnConfirmar.disabled = false;
        btnConfirmar.innerText = "CONFIRMAR";
    }
}

const btnCmdBasico = document.getElementById('btn-cmd-basico');
const btnCmdUlt = document.getElementById('btn-cmd-ult');
const btnCmdDescansar = document.getElementById('btn-cmd-descansar');
const btnVoltarComandos = document.getElementById('btn-voltar-comandos');

if (btnCmdBasico) {
    btnCmdBasico.addEventListener('click', () => {
        if (jogoPausado || !turnoDoJogador || faseAtual !== 1) return;
        audioManager.tocarClique();
        modoUltimatoSelecionado = false;
        faseAtual = 3;
        document.getElementById('fase-previsao').classList.add('hidden');
        document.getElementById('fase-configuracao').classList.remove('hidden');
        painelAcoes.classList.remove('hidden');
        gerarInputsPorGuardiao(jogadorAtual.id);
        atualizarMenuComandosPokemon();
    });
}

if (btnCmdUlt) {
    btnCmdUlt.addEventListener('click', () => {
        const ultAtual = parseInt(document.getElementById('foco-jogador').innerText, 10) || 0;
        if (jogoPausado || !turnoDoJogador || faseAtual !== 1 || ultAtual < 3) return;
        audioManager.tocarClique();
        modoUltimatoSelecionado = true;
        faseAtual = 3;
        document.getElementById('fase-previsao').classList.add('hidden');
        document.getElementById('fase-configuracao').classList.remove('hidden');
        painelAcoes.classList.remove('hidden');
        gerarInputsUlt(jogadorAtual.id);
        atualizarMenuComandosPokemon();
    });
}

if (btnVoltarComandos) {
    btnVoltarComandos.addEventListener('click', () => {
        if (jogoPausado) return;
        audioManager.tocarClique();
        faseAtual = 1;
        painelAcoes.classList.add('hidden');
        atualizarMenuComandosPokemon();
    });
}

function acionarDescansoJogador() {
    if (jogoPausado || !turnoDoJogador || faseAtual !== 1) return;
    audioManager.tocarClique();
    faseAtual = 5;
    painelAcoes.classList.add('hidden');
    document.getElementById('fase-previsao').classList.add('hidden');
    atualizarMenuComandosPokemon();

    const pvMax = jogadorAtual.pv;
    const pvAtual = parseInt(document.getElementById('pv-jogador').innerText, 10);
    let cura = (estagioCenarioAtual === 2) ? 6 : 10; // Na Usina (2), correntes parasitas reduzem a cura para 6 PV
    if (pvAtual + cura > pvMax) cura = pvMax - pvAtual;

    document.getElementById('pv-jogador').innerText = pvAtual + cura;
    if (cura > 0) criarTextoFlutuante("+" + cura, true, "cura");
    aplicarEfeitoCuraVisual(true);

    const enAtual = parseInt(document.getElementById('en-jogador').innerText, 10);
    const energiaRecuperada = 4;
    const novoEn = Math.min(10, enAtual + energiaRecuperada);
    document.getElementById('en-jogador').innerText = novoEn;

    document.getElementById('feedback-titulo').innerText = "Descanso Tático";
    document.getElementById('feedback-causa').innerText = "Você focou em recuperar suas forças e estabilizar o circuito!";
    document.getElementById('feedback-dano').innerHTML = `<img src="assets/pv.png" class="icone-hud" alt="PV"> Cura: +${cura}`;
    document.getElementById('feedback-foco').innerHTML = `<img src="assets/en.png" class="icone-hud" alt="EN"> Energia: +${energiaRecuperada}`;

    adicionarLog(`Descanso Tático: +${cura} PV e +${energiaRecuperada} EN recuperados.`, 'jogador');

    painelFeedback.classList.remove('hidden', 'erro', 'painel-flutuante-direito');
    painelFeedback.classList.add('sucesso', 'painel-flutuante-esquerdo');
    atualizarHUD();

    agendarTimerBatalha(() => {
        painelFeedback.classList.add('hidden');
        passarTurno();
    }, 3500);
}

if (btnCmdDescansar) {
    btnCmdDescansar.addEventListener('click', acionarDescansoJogador);
}

// RENDERIZADOR DO SIMULADOR VISUAL DE TELEMETRIA FÍSICA
function atualizarSimuladorTelemetria(pct, nivelTexto, cor, linha1, linha2 = "") {
    let box = document.getElementById('simulador-telemetria');
    if (!box && inputsDinamicos) {
        box = document.createElement('div');
        box.id = 'simulador-telemetria';
        box.className = 'simulador-telemetria-box';
        inputsDinamicos.appendChild(box);
    }
    if (!box) return;

    const pctLimpo = Math.max(8, Math.min(100, Math.round(pct)));
    box.style.borderColor = cor;
    box.innerHTML = `
        <div class="simulador-cabecalho">
            <span class="simulador-tag">TELEMETRIA</span>
            <span class="simulador-badge-nivel" style="border-color:${cor}; color:${cor};">${nivelTexto}</span>
        </div>
        <div class="simulador-barra-container">
            <div class="simulador-barra-fill" style="width:${pctLimpo}%; background-color:${cor};"></div>
        </div>
        <div class="simulador-dados-texto">${linha1}</div>
        ${linha2 ? `<div class="simulador-dados-texto" style="color:${cor};">${linha2}</div>` : ''}
    `;
}

function classificarPotenciaSimulador(pct) {
    if (pct < 38) return { texto: "BAIXA", cor: "#4da6ff" };
    if (pct < 75) return { texto: "MODERADA", cor: "#2ecc71" };
    return { texto: "CRÍTICA", cor: "#f1c40f" };
}

function gerarInputsPorGuardiao(idGuardiao) {
    inputsDinamicos.innerHTML = '';
    inputsDinamicos.classList.remove('hidden');
    const txtPergunta = document.getElementById('texto-pregunta-previsao');
    if (txtPergunta) txtPergunta.innerText = "Configure os parâmetros:";

    if (idGuardiao === 'lorentz') {
        document.getElementById('nome-habilidade').innerText = "Disparo Curvo (Básica)";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Carga (q)</label><select id="input-carga"><option value="1">Positiva (+)</option><option value="-1">Negativa (-)</option></select></div>
            <div class="parametro-fisica"><label>Vel. (v): <span id="valor-v">3</span></label><input type="range" id="input-v" min="1" max="8" value="3"></div>
        `;
        const atualizarSimLorentz = () => {
            const v = parseInt(document.getElementById('input-v').value, 10) || 1;
            const q = parseInt(document.getElementById('input-carga').value, 10) || 1;
            document.getElementById('valor-v').innerText = v;
            validarEN(v);

            const res = calcularDisparoCurvo(v, q);
            const pct = (res.dano / 25) * 100;
            const niv = classificarPotenciaSimulador(pct);
            const sinalQ = q > 0 ? "Positiva (+)" : "Negativa (-)";
            const sentidoCampo = arenaAtual.sentido === 'entrando' ? '⊗ Entrando' : '⊙ Saindo';
            atualizarSimuladorTelemetria(
                pct,
                niv.texto,
                niv.cor,
                `Raio r = ${res.raio.toFixed(1)} m | Campo: ${sentidoCampo}`,
                `Carga ${sinalQ} | Dano Est.: ${res.dano}`
            );
        };
        document.getElementById('input-v').addEventListener('input', atualizarSimLorentz);
        document.getElementById('input-carga').addEventListener('change', atualizarSimLorentz);
        atualizarSimLorentz();
    }
    else if (idGuardiao === 'faraday') {
        document.getElementById('nome-habilidade').innerText = "Estratégia de Faraday";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica" style="margin-bottom: 6px;">
                <label style="color: #f1c40f; font-weight: bold;">Escolha a Ação:</label>
            </div>
            <div style="display: flex; gap: 8px; justify-content: center;">
                <button type="button" class="btn-retro" id="btn-faraday-atacar" style="flex: 1; font-size: 0.6rem; padding: 8px;" onclick="escolherAcaoFaraday('atacar')">ATACAR</button>
                <button type="button" class="btn-retro" id="btn-faraday-defender" style="flex: 1; font-size: 0.6rem; padding: 8px;" onclick="escolherAcaoFaraday('defender')">DEFENDER</button>
            </div>
            <div id="container-params-faraday" style="margin-top: 8px;"></div>
        `;
        escolherAcaoFaraday('atacar');
    }
    else if (idGuardiao === 'ampere') {
        document.getElementById('nome-habilidade').innerText = "Eletroímã (Básica)";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Espiras (N): <span id="valor-n">2</span></label><input type="range" id="input-n" min="1" max="4" value="2"></div>
            <div class="parametro-fisica"><label>Corrente (i): <span id="valor-i">2</span>A</label><input type="range" id="input-i" min="1" max="4" value="2"></div>
            <div class="parametro-fisica"><label>Núcleo</label><select id="input-nucleo"><option value="1">Ar (0 EN)</option><option value="3">Ferro (+2 EN | +Blindagem)</option></select></div>
        `;
        const atualizarEnergia = () => {
            const n = parseInt(document.getElementById('input-n').value, 10);
            const i = parseInt(document.getElementById('input-i').value, 10);
            const fatorNuc = parseInt(document.getElementById('input-nucleo').value, 10);
            const custoNucleo = fatorNuc === 3 ? 2 : 0;
            document.getElementById('valor-n').innerText = n;
            document.getElementById('valor-i').innerText = i;
            validarEN(n + i + custoNucleo);

            const res = calcularEletroima(n, i, fatorNuc);
            const pct = (res.dano / 26) * 100;
            const niv = classificarPotenciaSimulador(pct);
            const extraEscudo = res.escudo > 0 ? ` | Escudo: ${Math.round(res.escudo * 100)}%` : '';
            atualizarSimuladorTelemetria(
                pct,
                niv.texto,
                niv.cor,
                `Campo Solenoide: B = ${res.campoB} un. (${fatorNuc === 3 ? 'Ferro' : 'Ar'})`,
                `Dano Est.: ${res.dano}${extraEscudo}`
            );
        };
        document.getElementById('input-n').addEventListener('input', atualizarEnergia);
        document.getElementById('input-i').addEventListener('input', atualizarEnergia);
        document.getElementById('input-nucleo').addEventListener('change', atualizarEnergia);
        atualizarEnergia();
    }
    else if (idGuardiao === 'wilhelm') {
        document.getElementById('nome-habilidade').innerText = "Bússola (Básica)";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Agulhas: <span id="valor-agu">2</span></label><input type="range" id="input-agu" min="1" max="3" value="2"></div>
        `;
        const atualizarSimWilhelm = () => {
            const agu = parseInt(document.getElementById('input-agu').value, 10) || 1;
            document.getElementById('valor-agu').innerText = agu;
            const res = calcularBussolaWilhelm(agu);
            validarEN(res.custo);

            const pct = (res.dano / 25) * 100;
            const niv = classificarPotenciaSimulador(pct);
            atualizarSimuladorTelemetria(
                pct,
                niv.texto,
                niv.cor,
                `Triangulação de Œrsted: ${agu} Agulha(s)`,
                `Dano Est.: ${res.dano} ${agu === 3 ? '| Precisão Crítica!' : ''}`
            );
        };
        document.getElementById('input-agu').addEventListener('input', atualizarSimWilhelm);
        atualizarSimWilhelm();
    }
    else if (idGuardiao === 'ohm') {
        document.getElementById('nome-habilidade').innerText = "Montar Circuito (Básica)";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Resistência (R) [Fonte V = 12 V]</label>
            <select id="input-r">
                <option value="3">3 Ω (Seguro | 4 EN)</option>
                <option value="2">2 Ω (Alta Potência | 5 EN)</option>
                <option value="6">6 Ω (Estável + Escudo | 3 EN)</option>
                <option value="1.5">1.5 Ω (Arco > 6A | 5 EN)</option>
            </select></div>
        `;
        const atualizarSimOhm = () => {
            const r = parseFloat(document.getElementById('input-r').value) || 3;
            const res = calcularCurtoControlado(r);
            validarEN(res.custo);
            const pct = Math.min(100, (res.dano / 25) * 100);
            const niv = res.queima ? { texto: "SOBRECARGA", cor: "#e74c3c" } : classificarPotenciaSimulador(pct);
            const extraEscudo = res.escudo > 0 ? ` | Escudo: +25%` : '';
            atualizarSimuladorTelemetria(
                pct,
                niv.texto,
                niv.cor,
                `Tensão V = 12 V | R = ${r} Ω (Fusível: máx 6 A)`,
                `Dano Est.: ${res.dano}${extraEscudo}`
            );
        };
        document.getElementById('input-r').addEventListener('change', atualizarSimOhm);
        atualizarSimOhm();
    }
}

function escolherAcaoFaraday(tipo) {
    audioManager.tocarClique();
    const containerParams = document.getElementById('container-params-faraday');
    const btnAtacar = document.getElementById('btn-faraday-atacar');
    const btnDefender = document.getElementById('btn-faraday-defender');

    if (tipo === 'atacar') {
        faradayModoDefesaAtivo = false;
        if (btnAtacar) btnAtacar.style.borderColor = '#f1c40f';
        if (btnDefender) btnDefender.style.borderColor = '#4da6ff';

        containerParams.innerHTML = `
            <div class="parametro-fisica"><label>Área da Espira (A): <span id="valor-a">3</span></label><input type="range" id="input-a" min="1" max="6" value="3"></div>
            <div class="parametro-fisica"><label>Ângulo (θ): <span id="valor-angulo">0</span>°</label><input type="range" id="input-angulo" min="0" max="75" step="15" value="0"></div>
        `;
        const atualizarSimFaradayAtk = () => {
            const a = parseInt(document.getElementById('input-a').value, 10) || 3;
            const ang = parseInt(document.getElementById('input-angulo').value, 10) || 0;
            document.getElementById('valor-a').innerText = a;
            document.getElementById('valor-angulo').innerText = ang;

            const res = calcularInducaoFaraday(a, ang);
            validarEN(res.custo);

            const pct = (res.dano / 25) * 100;
            const niv = classificarPotenciaSimulador(pct);
            const txtEscudo = res.escudo > 0 ? ` | Escudo: +${Math.round(res.escudo * 100)}%` : ' | Ataque Puro';
            atualizarSimuladorTelemetria(
                pct,
                niv.texto,
                niv.cor,
                `Fluxo Φ = B·A·cos(${ang}°): ${res.fluxoPct}%`,
                `Dano Est.: ${res.dano}${txtEscudo}`
            );
        };
        document.getElementById('input-a').addEventListener('input', atualizarSimFaradayAtk);
        document.getElementById('input-angulo').addEventListener('input', atualizarSimFaradayAtk);
        atualizarSimFaradayAtk();
    } else {
        faradayModoDefesaAtivo = true;
        if (btnAtacar) btnAtacar.style.borderColor = '#4da6ff';
        if (btnDefender) btnDefender.style.borderColor = '#f1c40f';

        containerParams.innerHTML = `
            <div class="parametro-fisica" style="padding: 8px;">
                <p style="font-size: 1.15rem; color: #2ecc71;">Barreira de Lenz Máxima</p>
                <p style="font-size: 1.05rem; color: #aaa;">Bloqueia 65% do dano inimigo e induz +1 de Foco (ULT).</p>
            </div>
        `;
        validarEN(2);
        atualizarSimuladorTelemetria(
            85,
            "BARREIRA",
            "#2ecc71",
            "Lei de Lenz: Corrente Oposta Máxima",
            "Mitigação: 65% + Ganha +1 Carga de ULT"
        );
    }
}

function gerarInputsUlt(idGuardiao) {
    inputsDinamicos.innerHTML = '';
    inputsDinamicos.classList.remove('hidden');
    const txtPergunta = document.getElementById('texto-pregunta-previsao');
    if (txtPergunta) txtPergunta.innerText = "Configure os parâmetros da ULT:";

    if (idGuardiao === 'faraday') {
        document.getElementById('nome-habilidade').innerText = "ULT: Gerador Manual";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Vel. Giro (ω): <span id="valor-omega">4</span></label><input type="range" id="input-omega" min="1" max="5" value="4"></div>
            <div class="parametro-fisica"><label>Área (A): <span id="valor-a-ult">4</span></label><input type="range" id="input-a-ult" min="1" max="5" value="4"></div>
        `;
        const atualizaFaradayUlt = () => {
            const omega = parseInt(document.getElementById('input-omega').value, 10);
            const a = parseInt(document.getElementById('input-a-ult').value, 10);
            document.getElementById('valor-omega').innerText = omega;
            document.getElementById('valor-a-ult').innerText = a;
            validarEN(Math.max(3, Math.round((omega + a) / 1.6)));

            const res = calcularGeradorManual(omega, a);
            const pct = (res.dano / 36) * 100;
            atualizarSimuladorTelemetria(
                pct,
                "ULTIMATO",
                "#ff00ff",
                `Giro ω = ${omega} rad/s | Área A = ${a}`,
                `Dano Induzido: ${res.dano} + Escudo de 30%`
            );
        };
        document.getElementById('input-omega').addEventListener('input', atualizaFaradayUlt);
        document.getElementById('input-a-ult').addEventListener('input', atualizaFaradayUlt);
        atualizaFaradayUlt();
    }
    else if (idGuardiao === 'lorentz') {
        document.getElementById('nome-habilidade').innerText = "ULT: Trilho de Força";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Corrente (i): <span id="valor-i-trilho">5</span>A</label><input type="range" id="input-i-trilho" min="2" max="6" value="5"></div>
            <div class="parametro-fisica"><label>Ângulo (θ): <span id="valor-ang-trilho">90</span>°</label><input type="range" id="input-ang-trilho" min="15" max="90" step="15" value="90"></div>
        `;
        const atualizaLorentzUlt = () => {
            const i = parseInt(document.getElementById('input-i-trilho').value, 10);
            const ang = parseInt(document.getElementById('input-ang-trilho').value, 10);
            document.getElementById('valor-i-trilho').innerText = i;
            document.getElementById('valor-ang-trilho').innerText = ang;
            validarEN(i);

            const res = calcularTrilhoForca(i, ang);
            const pct = (res.dano / 36) * 100;
            atualizarSimuladorTelemetria(
                pct,
                "ULTIMATO",
                "#ff00ff",
                `Força Magnética: F = ${res.forca.toFixed(1)} N`,
                `Dano Balístico Estimado: ${res.dano}`
            );
        };
        document.getElementById('input-i-trilho').addEventListener('input', atualizaLorentzUlt);
        document.getElementById('input-ang-trilho').addEventListener('input', atualizaLorentzUlt);
        atualizaLorentzUlt();
    }
    else if (idGuardiao === 'ampere') {
        document.getElementById('nome-habilidade').innerText = "ULT: Inversão de Polaridade";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Espiras (N): <span id="valor-n-inv">3</span></label><input type="range" id="input-n-inv" min="1" max="4" value="3"></div>
            <div class="parametro-fisica"><label>Corrente (i): <span id="valor-i-inv">3</span>A</label><input type="range" id="input-i-inv" min="1" max="4" value="3"></div>
        `;
        const atualizaInv = () => {
            const n = parseInt(document.getElementById('input-n-inv').value, 10);
            const i = parseInt(document.getElementById('input-i-inv').value, 10);
            document.getElementById('valor-n-inv').innerText = n;
            document.getElementById('valor-i-inv').innerText = i;
            validarEN(Math.max(4, n + i - 1));

            const danoUlt = Math.min(36, (n + i) * 4 + arenaAtual.campoB);
            const pct = (danoUlt / 36) * 100;
            atualizarSimuladorTelemetria(
                pct,
                "ULTIMATO",
                "#ff00ff",
                `Colapso de Polaridade (N=${n}, i=${i}A)`,
                `Dano Magnético: ${danoUlt} + Escudo de 30%`
            );
        };
        document.getElementById('input-n-inv').addEventListener('input', atualizaInv);
        document.getElementById('input-i-inv').addEventListener('input', atualizaInv);
        atualizaInv();
    }
    else if (idGuardiao === 'wilhelm') {
        document.getElementById('nome-habilidade').innerText = "ULT: Polos Opostos";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Polo da Peça</label><select id="input-polo-ult"><option value="N">Norte (Repulsão Explosiva)</option><option value="S">Sul (Atração + Dreno EN)</option></select></div>
            <div class="parametro-fisica"><label>Distância (d): <span id="valor-d-ult">1</span>m</label><input type="range" id="input-d-ult" min="1" max="3" value="1"></div>
        `;
        const atualizaWilhelmUlt = () => {
            const d = parseInt(document.getElementById('input-d-ult').value, 10);
            const polo = document.getElementById('input-polo-ult').value;
            document.getElementById('valor-d-ult').innerText = d;
            const res = calcularPolosOpostosUlt(polo, d);
            validarEN(res.custo);

            const pct = (res.dano / 36) * 100;
            atualizarSimuladorTelemetria(
                pct,
                "ULTIMATO",
                "#ff00ff",
                `Força Dipolar F ∝ 1/d² (d = ${d}m)`,
                `Dano: ${res.dano} ${res.drenoEn > 0 ? `| Drena +${res.drenoEn} EN` : '| Impacto Máximo'}`
            );
        };
        document.getElementById('input-d-ult').addEventListener('input', atualizaWilhelmUlt);
        document.getElementById('input-polo-ult').addEventListener('change', atualizaWilhelmUlt);
        atualizaWilhelmUlt();
    }
    else if (idGuardiao === 'ohm') {
        document.getElementById('nome-habilidade').innerText = "ULT: Curto Controlado";
        inputsDinamicos.innerHTML = `
            <div class="parametro-fisica"><label>Resistência (R)</label>
            <select id="input-r-curto">
                <option value="1">1 Ω (Curto Total | 6 EN)</option>
                <option value="2">2 Ω (Descarga Alta | 5 EN)</option>
                <option value="4">4 Ω (Descarga + Escudo | 4 EN)</option>
                <option value="6">6 Ω (Descarga + Cura | 3 EN)</option>
            </select></div>
        `;
        const atualizaOhmUlt = () => {
            const r = parseInt(document.getElementById('input-r-curto').value, 10);
            const res = calcularUltOhm(r);
            validarEN(res.custo);
            const pct = (res.dano / 38) * 100;
            atualizarSimuladorTelemetria(
                pct,
                "SOBRECARGA",
                "#ff00ff",
                `Corrente de Descarga: i = ${res.corrente.toFixed(1)} A`,
                `Dano: ${res.dano} ${res.extraTxt}`
            );
        };
        document.getElementById('input-r-curto').addEventListener('change', atualizaOhmUlt);
        atualizaOhmUlt();
    }
}

// SISTEMA DE PERGUNTAS DE PREVISÃO DINÂMICAS

let perguntaDinamicaAtual = null;

function embaralharOpcoesPrevisao(lista) {
    return Math.random() > 0.5 ? [lista[0], lista[1]] : [lista[1], lista[0]];
}

function gerarPerguntaDinamica(idGuardiao) {
    if (idGuardiao === 'lorentz') {
        const v = parseInt(document.getElementById('input-v')?.value || "3", 10);
        const q = parseInt(document.getElementById('input-carga')?.value || "1", 10);
        const res = calcularDisparoCurvo(v, q);
        const txtCarga = q > 0 ? "Positiva (+)" : "Negativa (-)";
        const txtSentido = arenaAtual.sentido === 'entrando' ? "entrando (⊗)" : "saindo (⊙)";

        const variacoes = [
            {
                pergunta: `Com carga ${txtCarga} e campo B ${txtSentido}, a partícula desvia para:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Cima", valor: "cima" },
                    { texto: "Baixo", valor: "baixo" }
                ]),
                correta: res.desvio,
                dano: res.dano,
                escudo: 0,
                desvioCanvas: res.desvio,
                msgAcerto: `Acertou! Pela Regra da Mão Direita, o disparo curvo (r=${res.raio.toFixed(1)}m) desviou para ${res.desvio}!`,
                msgErro: `Errou! Com carga ${txtCarga} e campo ${txtSentido}, a partícula desviou para ${res.desvio}.`,
                dicaErro: arenaAtual.sentido === 'entrando'
                    ? "Pela Regra da Mão Direita (F = q·v × B), com o campo B ENTRANDO na tela (⊗): carga positiva (+) desvia para CIMA e negativa (-) para BAIXO!"
                    : "Atenção ao cenário! Neste setor o campo B está SAINDO da tela (⊙): carga positiva (+) desvia para BAIXO e negativa (-) desvia para CIMA!"
            },
            {
                pergunta: `Você ajustou v = ${v} (raio r = ${res.raio.toFixed(1)}m). Se a velocidade DOBRAR neste campo, o raio r:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Dobra (curva mais aberta)", valor: "dobra" },
                    { texto: "Cai pela metade", valor: "metade" }
                ]),
                correta: "dobra",
                dano: res.dano,
                escudo: 0,
                desvioCanvas: res.desvio,
                msgAcerto: `Acertou! Como r = m·v / (|q|·B), dobrar a velocidade dobra o raio da trajetória!`,
                msgErro: `Errou! O raio é diretamente proporcional à velocidade (r = m·v / |q|·B).`,
                dicaErro: "Na equação do Ciclotron (r = m·v / |q|·B), o raio r é diretamente proporcional à velocidade v. Quanto mais rápida a partícula, maior o raio da curva!"
            },
            {
                pergunta: `Mantendo v = ${v}, se a intensidade do campo magnético (B = ${arenaAtual.campoB} T) AUMENTAR, o raio r:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Diminui (curva fechada)", valor: "diminui" },
                    { texto: "Aumenta (curva aberta)", valor: "aumenta" }
                ]),
                correta: "diminui",
                dano: res.dano,
                escudo: 0,
                desvioCanvas: res.desvio,
                msgAcerto: `Acertou! Um campo magnético B mais intenso curva a partícula com mais força, reduzindo o raio r!`,
                msgErro: `Errou! O raio r é inversamente proporcional ao campo magnético B (r = m·v / |q|·B).`,
                dicaErro: "O campo magnético B fica no denominador da fórmula (r = m·v / |q|·B). Portanto, quanto maior o campo B, mais fechada é a curva (menor o raio r)!"
            },
            {
                pergunta: `A força magnética atua sempre perpendicularmente à velocidade (v = ${v}). O módulo da velocidade:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Permanece constante", valor: "constante" },
                    { texto: "Aumenta continuamente", valor: "aumenta" }
                ]),
                correta: "constante",
                dano: res.dano,
                escudo: 0,
                desvioCanvas: res.desvio,
                msgAcerto: `Acertou! A força magnética muda apenas a direção do vetor velocidade, mantendo seu módulo constante!`,
                msgErro: `Errou! Como F é perpendicular a v, a força magnética não realiza trabalho e não altera a rapidez.`,
                dicaErro: "A Força de Lorentz é sempre perpendicular ao deslocamento da carga. Por isso, ela curva a trajetória (força centrípeta), mas mantém o módulo da velocidade constante!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    if (idGuardiao === 'faraday') {
        const a = parseInt(document.getElementById('input-a')?.value || "3", 10);
        const ang = parseInt(document.getElementById('input-angulo')?.value || "0", 10);
        const res = calcularInducaoFaraday(a, ang);

        const variacoes = [
            {
                pergunta: `Com a espira em θ = ${ang}° (fluxo de ${res.fluxoPct}%), se inclinarmos até 90°, o fluxo magnético (Φ):`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Diminui até zero", valor: "diminui" },
                    { texto: "Aumenta ao máximo", valor: "aumenta" }
                ]),
                correta: "diminui",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! O fluxo (${res.fluxoPct}%) induziu ${res.dano} de dano${res.escudo > 0 ? ` e +${Math.round(res.escudo * 100)}% de Escudo!` : '!'}`,
                msgErro: `Errou! Em θ = 90°, cos(90°) = 0, logo as linhas não atravessam a espira e o fluxo cai a zero.`,
                dicaErro: "Pela fórmula Φ = B · A · cos(θ), o fluxo magnético é máximo em θ = 0° (cos 0° = 1) e diminui até zero quando a espira chega a 90° (cos 90° = 0)!"
            },
            {
                pergunta: `Você calibrou Área A = ${a}. Se aumentarmos a área da espira sob o mesmo campo B, o fluxo Φ:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Aumenta proporcionalmente", valor: "aumenta" },
                    { texto: "Diminui pela metade", valor: "diminui" }
                ]),
                correta: "aumenta",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! Maior área A capta mais linhas de campo magnético, induzindo ${res.dano} de dano!`,
                msgErro: `Errou! O fluxo magnético Φ = B·A·cos(θ) é diretamente proporcional à área A da espira.`,
                dicaErro: "O fluxo magnético mede quantas linhas de campo atravessam a área da espira (Φ = B·A·cos θ). Quanto maior a Área A, maior o fluxo captado!"
            },
            {
                pergunta: `Pela Lei de Lenz, a corrente elétrica induzida na espira de Faraday cria um campo magnético que:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Se opõe à variação do fluxo", valor: "opoe" },
                    { texto: "Sempre anula a gravidade", valor: "gravidade" }
                ]),
                correta: "opoe",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! A oposição da Lei de Lenz canalizou ${res.dano} de dano${res.escudo > 0 ? ` e +${Math.round(res.escudo * 100)}% de Escudo!` : '!'}`,
                msgErro: `Errou! O sinal negativo na Lei de Faraday-Lenz (ε = -ΔΦ/Δt) indica oposição à variação do fluxo.`,
                dicaErro: "A Lei de Lenz afirma que a corrente induzida sempre gera um campo magnético que se opõe à variação do fluxo que a produziu (conservação da energia)!"
            },
            {
                pergunta: `Para que a espira (A = ${a}) capte 100% do fluxo magnético possível na arena, o ângulo θ deve ser:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "0° (cos 0° = 1)", valor: "zero" },
                    { texto: "90° (cos 90° = 0)", valor: "noventa" }
                ]),
                correta: "zero",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! Em θ = 0° o vetor normal é paralelo ao campo B, maximizando o fluxo magnético!`,
                msgErro: `Errou! O cosseno é máximo em 0° (cos 0° = 1) e nulo em 90° (cos 90° = 0).`,
                dicaErro: "Como Φ = B·A·cos(θ), o fluxo atinge 100% quando θ = 0° (pois cos 0° = 1). Inclinar a espira reduz o cosseno mas converte parte da energia em escudo!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    if (idGuardiao === 'ampere') {
        const n = parseInt(document.getElementById('input-n')?.value || "2", 10);
        const i = parseInt(document.getElementById('input-i')?.value || "2", 10);
        const nucleo = parseInt(document.getElementById('input-nucleo')?.value || "1", 10);
        const res = calcularEletroima(n, i, nucleo);

        const variacoes = [
            {
                pergunta: `Com N = ${n} espiras e i = ${i} A (B = ${res.campoB} un.), se dobrarmos a corrente (i), o campo B:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Dobra de intensidade", valor: "dobra" },
                    { texto: "Não muda", valor: "igual" }
                ]),
                correta: "dobra",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! O Solenoide de Ampère (B=${res.campoB}) causou ${res.dano} de dano${res.escudo > 0 ? ' + 20% Blindagem!' : '!'}`,
                msgErro: `Errou! Pela Lei de Ampère (B = μ·n·i), o campo B é diretamente proporcional à corrente i.`,
                dicaErro: "No interior de um solenoide (B = μ·N·i / L), o campo magnético B é diretamente proporcional à corrente i. Se a corrente dobra, o campo também dobra!"
            },
            {
                pergunta: `Você configurou núcleo de ${nucleo === 3 ? 'Ferro' : 'Ar'}. Inserir Ferro no interior do solenoide faz o campo B:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Multiplicar intensamente", valor: "multiplica" },
                    { texto: "Cair para zero", valor: "zero" }
                ]),
                correta: "multiplica",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! A alta permeabilidade magnética do ferro amplificou o Eletroímã de Ampère!`,
                msgErro: `Errou! O ferro é ferromagnético e alinha seus domínios, multiplicando a intensidade do campo B.`,
                dicaErro: "Materiais ferromagnéticos (como o ferro) possuem alta permeabilidade magnética (μ), alinhando seus domínios magnéticos e multiplicando a força do eletroímã!"
            },
            {
                pergunta: `Seu eletroímã possui N = ${n} espiras. Se reduzirmos o número de espiras pela metade, o campo B:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Cai pela metade", valor: "metade" },
                    { texto: "Quadruplica", valor: "quadruplica" }
                ]),
                correta: "metade",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! Cada espira contribui somando linhas de campo; metade das espiras gera metade do campo B!`,
                msgErro: `Errou! O campo magnético do solenoide é diretamente proporcional ao número N de espiras.`,
                dicaErro: "Pela Lei de Ampère aplicada ao solenoide, cada espira soma seu campo magnético ao conjunto. Reduzir N pela metade reduz o campo B pela metade!"
            },
            {
                pergunta: `Se Ampère inverter o sentido da corrente elétrica (i = ${i} A) nas espiras, os polos Norte e Sul:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Se invertem imediatamente", valor: "invertem" },
                    { texto: "Continuam na mesma posição", valor: "iguais" }
                ]),
                correta: "invertem",
                dano: res.dano,
                escudo: res.escudo,
                msgAcerto: `Acertou! A polaridade do eletroímã depende do sentido da corrente pela Regra da Mão Direita!`,
                msgErro: `Errou! Inverter o sentido da corrente no solenoide inverte o sentido do vetor campo magnético B.`,
                dicaErro: "Pela Regra da Mão Direita de Ampère, os dedos acompanham a corrente nas espiras e o polegar aponta o Polo Norte. Inverter a corrente inverte os polos!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    if (idGuardiao === 'wilhelm') {
        const agu = parseInt(document.getElementById('input-agu')?.value || "2", 10);
        const res = calcularBussolaWilhelm(agu);

        const variacoes = [
            {
                pergunta: `Com ${agu} agulha(s) de Weber: ao AUMENTAR a distância (r) até o fio condutor, o campo magnético (B):`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Diminui (B ∝ 1/r)", valor: "diminui" },
                    { texto: "Aumenta (B ∝ r)", valor: "aumenta" }
                ]),
                correta: "diminui",
                dano: res.dano,
                escudo: 0,
                msgAcerto: `Acertou! Wilhelm triangulou o decaimento B ∝ 1/r com ${agu} agulha(s), causando ${res.dano} de dano!`,
                msgErro: `Errou! Pela Lei de Biot-Savart (B = μ₀·i / 2πr), o campo diminui conforme nos afastamos do fio.`,
                dicaErro: "Pela Lei de Biot-Savart (B = μ₀·i / 2π·r), a intensidade do campo magnético B é inversamente proporcional à distância r. Mais longe do fio, menor é o campo!"
            },
            {
                pergunta: `Ao redor de um fio retilíneo com corrente, as linhas de campo que orientam as ${agu} agulha(s) têm formato:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Circular concêntrico ao fio", valor: "circular" },
                    { texto: "Retilíneo paralelo ao fio", valor: "paralelo" }
                ]),
                correta: "circular",
                dano: res.dano,
                escudo: 0,
                msgAcerto: `Acertou! As bússolas de Wilhelm alinham-se tangencialmente às linhas circulares ao redor do condutor!`,
                msgErro: `Errou! O experimento de Œrsted e Weber mostra que o campo forma círculos concêntricos ao redor do fio.`,
                dicaErro: "Uma corrente elétrica em um fio retilíneo cria linhas de indução magnética circulares e concêntricas ao redor do fio. As agulhas apontam tangentes a esses círculos!"
            },
            {
                pergunta: `Se o Polo Norte do magnetômetro de Wilhelm apontar para o Polo SUL do alvo, a interação será de:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Atração magnética", valor: "atracao" },
                    { texto: "Repulsão magnética", valor: "repulsao" }
                ]),
                correta: "atracao",
                dano: res.dano,
                escudo: 0,
                msgAcerto: `Acertou! Polos opostos (Norte e Sul) se atraem, guiando o disparo de ${res.dano} de dano!`,
                msgErro: `Errou! No magnetismo, polos de mesmo nome se repelem e polos opostos (Norte e Sul) se atraem.`,
                dicaErro: "Princípio fundamental dos dipolos magnéticos: polos iguais (Norte-Norte ou Sul-Sul) se repelem, enquanto polos opostos (Norte-Sul) se atraem!"
            },
            {
                pergunta: `Se a corrente elétrica no fio oculto TRIPLICAR a uma mesma distância r, a intensidade do campo B nas agulhas:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Triplica de intensidade", valor: "triplica" },
                    { texto: "Cai para um terço", valor: "terco" }
                ]),
                correta: "triplica",
                dano: res.dano,
                escudo: 0,
                msgAcerto: `Acertou! Como B = μ₀·i / (2πr), triplicar a corrente triplica o campo magnético detectado!`,
                msgErro: `Errou! A uma distância r fixa, o campo B gerado por um fio é diretamente proporcional à corrente i.`,
                dicaErro: "Na equação do fio condutor (B = μ₀·i / 2π·r), a corrente i está no numerador. Se a corrente triplica, o campo magnético B também fica 3 vezes mais forte!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    // OHM
    const r = parseFloat(document.getElementById('input-r')?.value || "3");
    const res = calcularCurtoControlado(r);
    const queimaria = res.queima ? 'sim' : 'nao';
    const iCorreta = res.corrente.toFixed(1).replace('.0', '');
    const iIncorreta = (r === 2) ? "3" : "6";

    const variacoesOhm = [
        {
            pergunta: `Com tensão V = 12 V e R = ${r} Ω, a corrente ultrapassará o limite de 6 A do fusível?`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: "Sim (Passa de 6 A)", valor: "sim" },
                { texto: "Não (Até 6 A)", valor: "nao" }
            ]),
            correta: queimaria,
            dano: res.dano,
            escudo: res.escudo,
            msgAcerto: `Acertou! Com i = ${res.corrente.toFixed(1)} A, Ohm liberou ${res.dano} de dano${res.escudo > 0 ? ' + 25% Escudo!' : '!'}`,
            msgErro: `Errou! Pela Lei de Ohm (i = 12 / ${r}), a corrente gerada é de ${res.corrente.toFixed(1)} A.`,
            dicaErro: "Pela 1ª Lei de Ohm (i = V / R), divida a tensão (12 V) pela resistência R escolhida. Se o resultado for maior que 6 A (como em R = 1.5 Ω → 8 A), o fusível entra em sobrecarga!"
        },
        {
            pergunta: `Pela 1ª Lei de Ohm (i = V / R), qual é a corrente exata para V = 12 V e R = ${r} Ω?`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: `i = ${iCorreta} A`, valor: "correta" },
                { texto: `i = ${iIncorreta} A`, valor: "errada" }
            ]),
            correta: "correta",
            dano: res.dano,
            escudo: res.escudo,
            msgAcerto: `Cálculo exato! i = 12 V / ${r} Ω = ${iCorreta} A, disparando ${res.dano} de dano!`,
            msgErro: `Errou! Dividindo V = 12 V por R = ${r} Ω, a corrente correta é ${iCorreta} A.`,
            dicaErro: `Para achar a corrente elétrica, basta dividir a tensão pela resistência: i = V / R = 12 / ${r} = ${iCorreta} A!`
        },
        {
            pergunta: `Mantendo a fonte em V = 12 V, se reduzirmos a resistência R (hoje ${r} Ω), a potência elétrica (P = V·i):`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: "Aumenta (maior corrente)", valor: "aumenta" },
                { texto: "Diminui (menor corrente)", valor: "diminui" }
            ]),
            correta: "aumenta",
            dano: res.dano,
            escudo: res.escudo,
            msgAcerto: `Acertou! Menor resistência sob tensão constante eleva a corrente e a potência (P = V²/R)!`,
            msgErro: `Errou! Como P = V² / R, diminuir a resistência R aumenta a corrente e a potência dissipada.`,
            dicaErro: "Em um circuito com tensão V constante (12 V), diminuir a resistência R faz passar mais corrente (i = V/R), aumentando a potência elétrica (P = V·i)!"
        },
        {
            pergunta: `Se associarmos outro resistor em SÉRIE ao seu resistor de ${r} Ω, a resistência total e a corrente vão:`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: "R aumenta e corrente cai", valor: "serie" },
                { texto: "R diminui e corrente sobe", valor: "paralelo" }
            ]),
            correta: "serie",
            dano: res.dano,
            escudo: res.escudo,
            msgAcerto: `Acertou! Em série as resistências se somam (R_eq = R1 + R2), reduzindo a corrente total!`,
            msgErro: `Errou! Na associação em série, a resistência equivalente aumenta e a corrente diminui.`,
            dicaErro: "Na associação em SÉRIE, as resistências se somam (R_eq = R₁ + R₂), dificultando a passagem da corrente elétrica!"
        }
    ];
    return variacoesOhm[Math.floor(Math.random() * variacoesOhm.length)];
}

// PERGUNTAS DINÂMICAS DOS ULTIMATOS (3 POR GUARDIÃO)

let perguntaDinamicaUltAtual = null;

function gerarPerguntaDinamicaUlt(idGuardiao) {
    if (idGuardiao === 'lorentz') {
        const i = parseInt(document.getElementById('input-i-trilho')?.value || "5", 10);
        const ang = parseInt(document.getElementById('input-ang-trilho')?.value || "90", 10);
        const res = calcularTrilhoForca(i, ang);

        const variacoes = [
            {
                pergunta: `ULT [Trilho de Força]: Com i = ${i} A e θ = ${ang}°, em qual ângulo a força magnética (F = B·i·L·sen θ) atinge o valor MÁXIMO?`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "90° (sen 90° = 1)", valor: "noventa" },
                    { texto: "0° (sen 0° = 0)", valor: "zero" }
                ]),
                correta: "noventa",
                dicaErro: "No Trilho de Força (F = B·i·L·sen θ), a força magnética é máxima quando o condutor é perpendicular ao campo (θ = 90°, pois sen 90° = 1)!"
            },
            {
                pergunta: `ULT [Trilho de Força]: Você gerou F = ${res.forca.toFixed(1)} N com i = ${i} A. Se a corrente no trilho aumentar, a força propulsora:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Aumenta proporcionalmente", valor: "aumenta" },
                    { texto: "Diminui até zerar", valor: "diminui" }
                ]),
                correta: "aumenta",
                dicaErro: "Pela Lei de Ampère-Lorentz (F = B·i·L·sen θ), a força magnética sobre o condutor é diretamente proporcional à corrente elétrica i!"
            },
            {
                pergunta: `ULT [Trilho de Força]: Se o disparo no trilho fosse paralelo às linhas de campo (θ = 0°), a força magnética seria:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Nula (F = 0 N)", valor: "nula" },
                    { texto: "Duplicada", valor: "duplicada" }
                ]),
                correta: "nula",
                dicaErro: "Quando a corrente é paralela às linhas de campo magnético (θ = 0°), temos sen 0° = 0, resultando em força magnética nula (F = 0)!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    if (idGuardiao === 'faraday') {
        const omega = parseInt(document.getElementById('input-omega')?.value || "4", 10);
        const A = parseInt(document.getElementById('input-a-ult')?.value || "4", 10);

        const variacoes = [
            {
                pergunta: `ULT [Gerador Manual]: Com giro ω = ${omega} rad/s, girar a espira mais rápido faz a força eletromotriz induzida (ε = -ΔΦ/Δt):`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Aumentar (variação mais rápida)", valor: "aumenta" },
                    { texto: "Cair a zero", valor: "zero" }
                ]),
                correta: "aumenta",
                dicaErro: "Pela Lei de Faraday (ε = -ΔΦ/Δt), quanto maior a velocidade angular ω, mais rápido o fluxo varia no tempo e MAIOR é a tensão induzida!"
            },
            {
                pergunta: `ULT [Gerador Manual]: Você calibrou Área A = ${A}. O Gerador Manual de Faraday converte diretamente:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Energia mecânica em elétrica", valor: "mecanica" },
                    { texto: "Energia térmica em gravidade", valor: "termica" }
                ]),
                correta: "mecanica",
                dicaErro: "O Gerador de Faraday utiliza a rotação mecânica da espira dentro de um campo magnético para induzir corrente elétrica (energia mecânica → elétrica)!"
            },
            {
                pergunta: `ULT [Gerador Manual]: Na rotação contínua com ω = ${omega} rad/s e área A = ${A}, a corrente induzida no gerador é:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Alternada (muda de sentido)", valor: "alternada" },
                    { texto: "Estática sem movimento", valor: "estatica" }
                ]),
                correta: "alternada",
                dicaErro: "Conforme a espira dá meia-volta no campo magnético, o fluxo ora aumenta, ora diminui, gerando uma corrente elétrica alternada!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    if (idGuardiao === 'ampere') {
        const n = parseInt(document.getElementById('input-n-inv')?.value || "3", 10);
        const i = parseInt(document.getElementById('input-i-inv')?.value || "3", 10);

        const variacoes = [
            {
                pergunta: `ULT [Inversão Polar]: Ao inverter abruptamente o sentido da corrente (i = ${i} A) nas ${n} espiras, o campo magnético B:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Inverte seus polos (Norte ⇄ Sul)", valor: "inverte" },
                    { texto: "Mantém os mesmos polos", valor: "mantem" }
                ]),
                correta: "inverte",
                dicaErro: "Pela Regra da Mão Direita de Ampère, inverter o sentido da corrente elétrica nas espiras inverte imediatamente os polos Norte e Sul do solenoide!"
            },
            {
                pergunta: `ULT [Inversão Polar]: Na sobrecarga com N = ${n} e i = ${i} A, a intensidade do campo no solenoide depende diretamente de:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Produto N · i (espiras × corrente)", valor: "produto" },
                    { texto: "Apenas da temperatura externa", valor: "temperatura" }
                ]),
                correta: "produto",
                dicaErro: "Na equação do solenoide (B = μ·N·i / L), a intensidade do campo magnético é diretamente proporcional ao produto N · i (ampère-espira)!"
            },
            {
                pergunta: `ULT [Inversão Polar]: No interior do solenoide de Ampère (N = ${n}, i = ${i} A), as linhas de campo magnético são:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Praticamente paralelas e uniformes", valor: "uniformes" },
                    { texto: "Inexistentes (campo nulo)", valor: "nulo" }
                ]),
                correta: "uniformes",
                dicaErro: "No interior de um solenoide longo percorrido por corrente, as linhas de indução magnética são retas, paralelas e distribuídas de modo uniforme!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    if (idGuardiao === 'wilhelm') {
        const polo = document.getElementById('input-polo-ult')?.value || 'N';
        const d = parseInt(document.getElementById('input-d-ult')?.value || "1", 10);

        const variacoes = [
            {
                pergunta: `ULT [Polos Opostos]: Com distância d = ${d} m, reduzir a distância entre os dipolos faz a força magnética (F ∝ 1/d²):`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Crescer intensamente", valor: "cresce" },
                    { texto: "Diminuir até sumir", valor: "diminui" }
                ]),
                correta: "cresce",
                dicaErro: "A força entre dipolos magnéticos varia com o inverso do quadrado da distância (F ∝ 1/d²). Quanto menor a distância d, muito maior é o impacto!"
            },
            polo === 'N' ? {
                pergunta: `ULT [Polos Opostos]: Você escolheu Polo Norte (Repulsão Explosiva). Para repelir o alvo, os polos enfrentados devem ser:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Iguais (Norte com Norte)", valor: "iguais" },
                    { texto: "Opostos (Norte com Sul)", valor: "opostos" }
                ]),
                correta: "iguais",
                dicaErro: "No magnetismo, polos de mesmo nome (Norte-Norte ou Sul-Sul) geram força de REPULSÃO, enquanto polos opostos se atraem!"
            } : {
                pergunta: `ULT [Polos Opostos]: Você escolheu Polo Sul (Atração + Dreno). Para atrair o alvo, os polos enfrentados devem ser:`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Opostos (Sul com Norte)", valor: "opostos" },
                    { texto: "Iguais (Sul com Sul)", valor: "iguais" }
                ]),
                correta: "opostos",
                dicaErro: "Para gerar ATRAÇÃO magnética e drenar energia, os polos interagentes devem ser opostos (Polo Sul com Polo Norte)!"
            },
            {
                pergunta: `ULT [Polos Opostos]: Se um ímã dipolar de Weber for partido ao meio durante a colisão, o que acontece com seus polos?`,
                opcoes: embaralharOpcoesPrevisao([
                    { texto: "Surgem dois ímãs com Norte e Sul", valor: "inseparaveis" },
                    { texto: "Fica um polo Norte e outro Sul isolados", valor: "isolados" }
                ]),
                correta: "inseparaveis",
                dicaErro: "Pela inseparabilidade dos polos magnéticos, não existem monopolos isolados: partir um ímã sempre origina dois novos ímãs completos (Norte e Sul)!"
            }
        ];
        return variacoes[Math.floor(Math.random() * variacoes.length)];
    }

    // OHM
    const r = parseInt(document.getElementById('input-r-curto')?.value || "1", 10);
    const res = calcularUltOhm(r);
    const iExata = Math.round(res.corrente);
    const iErrada = r === 1 ? 6 : 12;
    const potExata = 12 * iExata;

    const variacoesOhm = [
        {
            pergunta: `ULT [Curto Controlado]: Com fonte V = 12 V e resistência reduzida para R = ${r} Ω, qual é a corrente de descarga (i = V/R)?`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: `i = ${iExata} A`, valor: "correta" },
                { texto: `i = ${iErrada} A`, valor: "errada" }
            ]),
            correta: "correta",
            dicaErro: `Pela 1ª Lei de Ohm (i = V / R), dividindo a tensão de 12 V pela resistência de ${r} Ω, a corrente de descarga é i = ${iExata} A!`
        },
        {
            pergunta: `ULT [Curto Controlado]: Com V = 12 V e corrente i = ${iExata} A (R = ${r} Ω), qual é a potência elétrica (P = V · i) liberada?`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: `P = ${potExata} W`, valor: "pot_correta" },
                { texto: `P = ${12 + iExata} W`, valor: "pot_errada" }
            ]),
            correta: "pot_correta",
            dicaErro: `A potência elétrica dissipada é o produto da tensão pela corrente (P = V · i). Logo, P = 12 V × ${iExata} A = ${potExata} W!`
        },
        {
            pergunta: `ULT [Curto Controlado]: Por que reduzir a resistência para R = 1 Ω gera o Curto-Circuito de potência máxima (P = V²/R)?`,
            opcoes: embaralharOpcoesPrevisao([
                { texto: "Mínima oposição libera corrente máxima", valor: "minima" },
                { texto: "A resistência apaga a tensão da fonte", valor: "apaga" }
            ]),
            correta: "minima",
            dicaErro: "Em um curto-circuito (R → mínimo), a oposição à passagem de cargas cai drasticamente, elevando a corrente i e a potência dissipada (P = V²/R) ao máximo!"
        }
    ];
    return variacoesOhm[Math.floor(Math.random() * variacoesOhm.length)];
}

if (btnConfirmar) {
    btnConfirmar.addEventListener('click', () => {
        if (jogoPausado) return;
        audioManager.tocarClique();
        const ultAtiva = modoUltimatoSelecionado && (parseInt(document.getElementById('foco-jogador').innerText, 10) >= 3);

        if (jogadorAtual.id === 'faraday' && faradayModoDefesaAtivo && !ultAtiva) {
            if (audioManager.tocarEscudo) audioManager.tocarEscudo();
            faseAtual = 5;
            painelAcoes.classList.add('hidden');

            const spriteJBody = document.getElementById('sprite-jogador-body');
            const spriteJPeq = document.getElementById('sprite-jogador-peq');

            if (spriteJPeq) {
                spriteJPeq.classList.add('atacar-peq-esq');
                agendarTimerBatalha(() => spriteJPeq.classList.remove('atacar-peq-esq'), 800);
            }
            if (spriteJBody) {
                spriteJBody.src = `assets/faraday_body_atk.png`;
                spriteJBody.className = "sprite-grande atacar-gr-esq sprite-batalha-jogador";
                agendarTimerBatalha(() => {
                    spriteJBody.src = `assets/faraday_body.png`;
                    spriteJBody.className = "sprite-grande idle-esq sprite-batalha-jogador";
                }, 800);
            }

            const enAtual = parseInt(document.getElementById('en-jogador').innerText, 10);
            document.getElementById('en-jogador').innerText = Math.max(0, enAtual - 2);
            protecaoJogador = 0.65;

            const focoAtual = parseInt(document.getElementById('foco-jogador').innerText, 10) || 0;
            if (focoAtual < 3) document.getElementById('foco-jogador').innerText = focoAtual + 1;

            painelFeedback.classList.remove('painel-flutuante-direito', 'erro', 'sucesso');
            painelFeedback.classList.add('painel-flutuante-esquerdo', 'sucesso');

            document.getElementById('feedback-titulo').innerText = "Barreira de Lenz!";
            document.getElementById('feedback-causa').innerText = "Faraday posicionou sua espira defensiva, bloqueando 65% do dano e induzindo +1 de Foco!";
            document.getElementById('feedback-dano').innerHTML = `<img src="assets/dfs.png" class="icone-hud" alt="Def"> Proteção: 65%`;
            document.getElementById('feedback-foco').innerHTML = `<img src="assets/ult.png" class="icone-hud" alt="ULT"> Ult: +1 (2 EN)`;

            adicionarLog(`Faraday ativou a Barreira de Lenz (65% de mitigação e +1 ULT).`, 'jogador');
            painelFeedback.classList.remove('hidden');
            atualizarHUD();

            agendarTimerBatalha(() => {
                painelFeedback.classList.add('hidden');
                if (!verificarFimDeJogo()) passarTurno();
            }, 3500);
            return;
        }

        faseAtual = 4;
        if (inputsDinamicos) inputsDinamicos.classList.add('hidden');
        document.getElementById('fase-configuracao').classList.add('hidden');
        document.getElementById('fase-previsao').classList.remove('hidden');
        const botoesPrevisao = document.getElementById('botoes-previsao');

        const equacoesPorGuardiao = {
            lorentz: ultAtiva ? "F = B · i · L · sen(θ)" : "F = |q|·v·B  |  r = m·v / (|q|·B)",
            faraday: ultAtiva ? "ε = - ΔΦ / Δt  (Giro ω)" : "Φ = B · A · cos(θ)  |  ε = -ΔΦ/Δt",
            ampere:  ultAtiva ? "B = μ · (N / L) · i  (Polos N ⇄ S)" : "B = μ · (N / L) · i",
            wilhelm: ultAtiva ? "Força Dipolar: F ∝ 1 / d²" : "Biot-Savart: B = μ₀·i / (2π·r)",
            ohm:     ultAtiva ? "i = V / R  |  P = V² / R (12 V)" : "1ª Lei de Ohm: i = V / R  (V = 12 V)"
        };
        const formulaAtual = equacoesPorGuardiao[jogadorAtual.id] || "Eletromagnetismo";

        if (!ultAtiva) {
            perguntaDinamicaAtual = gerarPerguntaDinamica(jogadorAtual.id);
            document.getElementById('texto-pregunta-previsao').innerText = perguntaDinamicaAtual.pergunta;
            botoesPrevisao.innerHTML = `
                <div class="badge-equacao-previsao">${formulaAtual}</div>
                ${perguntaDinamicaAtual.opcoes
                    .map((op, idx) => `<button class="btn-previsao" type="button" onclick="executarAtaque('${op.valor}')"><span class="kbd-atalho">${idx + 1}</span> ${op.texto}</button>`)
                    .join('')}
            `;
        } else {
            perguntaDinamicaUltAtual = gerarPerguntaDinamicaUlt(jogadorAtual.id);
            document.getElementById('texto-pregunta-previsao').innerText = perguntaDinamicaUltAtual.pergunta;
            botoesPrevisao.innerHTML = `
                <div class="badge-equacao-previsao">${formulaAtual}</div>
                ${perguntaDinamicaUltAtual.opcoes
                    .map((op, idx) => `<button class="btn-previsao" type="button" onclick="executarAtaque('${op.valor}')"><span class="kbd-atalho">${idx + 1}</span> ${op.texto}</button>`)
                    .join('')}
            `;
        }
    });
}

// ==========================================
// 4. MOTOR DE FÍSICA E CÁLCULOS BALANCEADOS
// ==========================================
const arenaAtual = { campoB: 3, sentido: 'entrando' };

function calcularDisparoCurvo(v, q) {
    const raio = v / arenaAtual.campoB;
    const desvio = (arenaAtual.sentido === 'entrando') ? (q > 0 ? 'cima' : 'baixo') : (q > 0 ? 'baixo' : 'cima');
    const dano = Math.min(25, Math.round(8 + (v * 1.8) + (arenaAtual.campoB * 0.6)));
    return { raio, desvio, dano };
}

function calcularInducaoFaraday(A, angGraus) {
    const rad = angGraus * (Math.PI / 180);
    const cosVal = Math.cos(rad);
    const sinVal = Math.sin(rad);
    const fluxoPct = Math.round(cosVal * 100);
    const dano = Math.min(25, Math.max(8, Math.round((9 + A * 2.1 + arenaAtual.campoB * 0.5) * (0.45 + 0.55 * cosVal))));
    const escudo = angGraus > 0 ? Number((sinVal * 0.35).toFixed(2)) : 0;
    const custo = Math.max(2, Math.min(6, A));
    return { dano, escudo, fluxoPct, custo };
}

function calcularGeradorManual(omega, A) {
    return { dano: Math.min(36, Math.round(14 + (arenaAtual.campoB * 0.8) + (A * omega * 0.85))) };
}

function calcularTrilhoForca(i, angGraus) {
    const rad = angGraus * (Math.PI / 180);
    const F = arenaAtual.campoB * i * 2 * Math.sin(rad);
    return { forca: F, dano: Math.min(36, Math.max(18, Math.round(14 + F * 0.55))) };
}

function calcularEletroima(n, i, nucleo) {
    const b = nucleo * n * i;
    const bonusFerro = nucleo === 3 ? 4 : 0;
    const dano = Math.min(26, Math.round(9 + (n * 1.8) + (i * 1.8) + bonusFerro));
    const escudo = (nucleo === 3 && b >= 12) ? 0.20 : 0;
    return { campoB: b, dano, escudo };
}

function calcularBussolaWilhelm(agu) {
    const custo = agu * 2 + 1;
    const bonusCrit = agu === 3 ? 3 : 0;
    const dano = Math.min(25, Math.round(9 + (agu * 4) + (arenaAtual.campoB * 0.5) + bonusCrit));
    return { dano, custo };
}

function calcularPolosOpostosUlt(polo, d) {
    const fatorDistancia = d === 1 ? 1.0 : (d === 2 ? 0.82 : 0.68);
    const base = polo === 'N' ? 36 : 29;
    const dano = Math.round(base * fatorDistancia);
    const drenoEn = polo === 'S' ? 3 : 0;
    const custo = d === 1 ? 6 : (d === 2 ? 5 : 4);
    return { dano, drenoEn, custo };
}

function calcularCurtoControlado(r) {
    const i = 12 / r;
    const p = 12 * i;
    let dano = 18;
    let custo = 4;
    let escudo = 0;

    if (r === 1.5) { dano = 24; custo = 5; }
    else if (r === 2) { dano = 22; custo = 5; }
    else if (r === 3) { dano = 18; custo = 4; }
    else if (r === 6) { dano = 14; custo = 3; escudo = 0.25; }

    return { corrente: i, potencia: p, dano, custo, escudo, queima: i > 6 };
}

function calcularUltOhm(r) {
    const i = 12 / r;
    if (r === 1) return { corrente: i, dano: 38, custo: 6, escudo: 0, cura: 0, extraTxt: "| Curto Máximo!" };
    if (r === 2) return { corrente: i, dano: 33, custo: 5, escudo: 0, cura: 0, extraTxt: "| Alta Descarga" };
    if (r === 4) return { corrente: i, dano: 28, custo: 4, escudo: 0.30, cura: 0, extraTxt: "| +30% Escudo" };
    return { corrente: i, dano: 24, custo: 3, escudo: 0, cura: 10, extraTxt: "| +10 PV Cura" };
}

let timerTypewriterFim = null;

function iniciarTypewriterFim(textoCompleto) {
    if (timerTypewriterFim) clearInterval(timerTypewriterFim);
    const elTexto = document.getElementById('texto-fim-typewriter');
    if (!elTexto) return;

    elTexto.textContent = "";
    let index = 0;
    let acumulado = "";

    timerTypewriterFim = setInterval(() => {
        if (index < textoCompleto.length) {
            const letra = textoCompleto.charAt(index);
            acumulado += letra;
            elTexto.textContent = acumulado;
            if (index % 2 === 0 && letra !== ' ' && audioManager.tocarBlipTexto) {
                audioManager.tocarBlipTexto('fim');
            }
            index++;
        } else {
            clearInterval(timerTypewriterFim);
            timerTypewriterFim = null;
        }
    }, 25);
}

function verificarFimDeJogo() {
    const pvJogador = parseInt(document.getElementById('pv-jogador').innerText, 10) || 0;
    const pvInimigo = parseInt(document.getElementById('pv-inimigo').innerText, 10) || 0;

    if (pvJogador <= 0 || pvInimigo <= 0) {
        const spriteJBody = document.getElementById('sprite-jogador-body');
        const spriteIBody = document.getElementById('sprite-inimigo-body');

        if (telaJogo) {
            telaJogo.classList.add('shake-ativo');
            agendarTimerBatalha(() => telaJogo.classList.remove('shake-ativo'), 600);
        }

        if (pvJogador <= 0) {
            mostrarSplash("DERROTA!", "#e74c3c", 1800);
            if (spriteJBody) spriteJBody.className = "sprite-grande nocaute-gr-esq sprite-batalha-jogador";
            if (spriteIBody && inimigoAtual) {
                spriteIBody.src = `assets/${inimigoAtual.id}_body_atk.png`;
                spriteIBody.className = "sprite-grande vitoria-gr-dir sprite-batalha-inimigo";
            }
            criarExplosaoParticulas(220, 275, '#e74c3c', 45);
            criarParticulasAscendentes(740, 275, '#f1c40f', 30);
        } else {
            mostrarSplash("VITÓRIA!", "#2ecc71", 1800);
            if (spriteIBody) spriteIBody.className = "sprite-grande nocaute-gr-dir sprite-batalha-inimigo";
            if (spriteJBody && jogadorAtual) {
                spriteJBody.src = `assets/${jogadorAtual.id}_body_atk.png`;
                spriteJBody.className = "sprite-grande vitoria-gr-esq sprite-batalha-jogador";
            }
            criarExplosaoParticulas(740, 275, '#e74c3c', 45);
            criarParticulasAscendentes(220, 275, '#f1c40f', 30);
        }

        agendarTimerBatalha(() => {
            pararLoopAnimacaoArena();
            if (telaJogo) telaJogo.classList.add('hidden');
            if (telaFimJogo) telaFimJogo.classList.remove('hidden');

            const tituloFim = document.getElementById('titulo-fim');
            const mensagemFim = document.getElementById('mensagem-fim');
            const btnProx = document.getElementById('btn-proxima-fase');

            if (timerTypewriterFim) clearInterval(timerTypewriterFim);

            if (pvJogador <= 0) {
                adicionarLog("Derrota! O seu Guardião foi vencido.", 'neutro');

                if (tituloFim) {
                    tituloFim.innerText = "DERROTA!";
                    tituloFim.style.color = "#e74c3c";
                    tituloFim.style.textShadow = "3px 3px 0px #000, 0 0 15px rgba(231, 76, 60, 0.6)";
                }

                if (btnProx) btnProx.classList.add('hidden');

                if (modoCampanhaAtivo) {
                    const isFaseAmpere = (faseAtualCampanha === 3 || (inimigoAtual && inimigoAtual.id === 'ampere'));
                    const FalanteFim = isFaseAmpere ? inimigoAtual : jogadorAtual;
                    const nomeExibido = FalanteFim ? FalanteFim.nome.toUpperCase() : "GUARDIÃO";
                    const retratoExibido = FalanteFim ? FalanteFim.retrato : "";
                    const tituloBalao = isFaseAmpere ? `${nomeExibido} (VITORIOSA):` : `${nomeExibido} (CIRCUITO APAGADO):`;
                    const falaQueda = isFaseAmpere
                        ? "A Forja Ferro-Magnética é implacável! Seu circuito não suportou a densidade do meu Eletroímã!"
                        : "Meu circuito entrou em colapso diante da sobrecarga... Preciso recalibrar meus parâmetros e tentar novamente!";

                    if (mensagemFim) {
                        mensagemFim.innerHTML = `
                            <div class="resumo-vitoria-campanha">
                                <div class="palco-cutscene palco-cutscene-fim">
                                    <div class="cutscene-speaker ${isFaseAmpere ? 'direita' : 'esquerda'}">
                                        <img src="${retratoExibido}" alt="${nomeExibido}" class="avatar-derrotado-cutscene">
                                        <span>${nomeExibido}</span>
                                    </div>
                                    <div class="caixa-texto-dialogo balao-boss">
                                        <h4>${tituloBalao}</h4>
                                        <p id="texto-fim-typewriter"></p>
                                    </div>
                                </div>
                            </div>
                        `;
                        if (isFaseAmpere && audioManager.tocarDublagem) {
                            audioManager.tocarDublagem('ampere_vitoriafase');
                        }
                        iniciarTypewriterFim(falaQueda);
                    }
                } else if (mensagemFim) {
                    mensagemFim.innerHTML = "Seu circuito entrou em sobrecarga e foi derrotado!";
                }

                audioManager.pararBGM();
                audioManager.tocarDerrota();

            } else {
                adicionarLog("Vitória! O oponente foi derrotado.", 'neutro');

                if (tituloFim) {
                    tituloFim.innerText = "VITÓRIA!";
                    tituloFim.style.color = "#2ecc71";
                    tituloFim.style.textShadow = "3px 3px 0px #000, 0 0 15px rgba(46, 204, 113, 0.6)";
                }

                if (modoCampanhaAtivo) {
                    const pctPv = pvJogador / maxPvJogador;
                    let estrelas = 1;
                    if (pctPv >= 0.50) estrelas = 2;
                    if (pctPv >= 0.85) estrelas = 3;

                    salvarProgressoCampanha(faseAtualCampanha, estrelas);

                    if (faseAtualCampanha === 2) desbloquearConquista('faraday_shield', 'Mestre da Indução', 'Concluiu a Arena de Faraday!');
                    if (faseAtualCampanha === 3) desbloquearConquista('ampere_master', 'Campo de Ampère', 'Concluiu a Arena de Ampère!');
                    if (faseAtualCampanha === 4) desbloquearConquista('wilhelm_master', 'Fluxo de Weber', 'Concluiu a Arena de Wilhelm!');

                    if (inimigoAtual && inimigoAtual.id === 'ohm' && !tomouDanoUltOhm) {
                        desbloquearConquista('ohm_flawless', 'Curto-Circuito Perfeito', 'Venceu o Ohm sem sofrer dano da Ult!');
                    }

                    const dadosBioma = estagiosCampanha[faseAtualCampanha];
                    const falaPosLuta = (dadosBioma && dadosBioma.falaDerrota) || "Seus conhecimentos de Eletromagnetismo superaram minhas defesas!";
                    const nomeBoss = inimigoAtual ? inimigoAtual.nome.toUpperCase() : "OPONENTE";
                    const retratoBoss = inimigoAtual ? inimigoAtual.retrato : "";

                    if (faseAtualCampanha === 5) {
                        desbloquearConquista('mestre_fluxo', 'Mestre Supremo do Fluxo', 'Zerou a Campanha e estabilizou o Pulso de Œrsted!');
                        if (btnProx) btnProx.classList.add('hidden');

                        if (tituloFim) {
                            tituloFim.innerText = "CAMPANHA CONCLUÍDA!";
                            tituloFim.style.color = "#f1c40f";
                            tituloFim.style.textShadow = "3px 3px 0px #000, 0 0 20px rgba(241, 196, 15, 0.8)";
                        }

                        let totalEstrelasCampanha = 0;
                        for (let f = 1; f <= 5; f++) {
                            totalEstrelasCampanha += (progressoCampanhaSalvo.estrelas[f] || 0);
                        }

                        const nomeHeroi = jogadorAtual ? jogadorAtual.nome.toUpperCase() : "GUARDIÃO";
                        const spriteHeroi = jogadorAtual ? `assets/${jogadorAtual.id}_body_atk.png` : "";
                        const textoEpilogo = `Com a vitória sobre Ohm no Núcleo de Alta Tensão, ${nomeHeroi} recalibrou os 5 setores da cidade e estabilizou definitivamente o Pulso de Œrsted! Seu domínio sobre a Força Magnética, a Indução de Faraday, os Solenoides de Ampère, o Fluxo de Weber e a Lei de Ohm consagrou você como o novo Mestre Supremo da Arena de Campo!`;

                        if (mensagemFim) {
                            mensagemFim.innerHTML = `
                                <div class="card-epilogo-zeramento">
                                    <div class="topo-certificado-epilogo">
                                        <span class="tag-epilogo-supremo">CERTIFICADO: MESTRE DO FLUXO</span>
                                        <span class="placar-estrelas-epilogo">
                                            <img src="assets/icon_estrelas.png" class="estrela-icone-png estrela-png-legenda on" alt="★">
                                            ESTRELAS: ${totalEstrelasCampanha} / 15
                                        </span>
                                    </div>
                                    <div class="corpo-epilogo-campeao">
                                        <div class="box-heroi-epilogo">
                                            <img src="${spriteHeroi}" alt="${nomeHeroi}">
                                            <span>${nomeHeroi}</span>
                                        </div>
                                        <div class="texto-narrativa-epilogo">
                                            <div>
                                                <h4>EPÍLOGO: O PULSO ESTABILIZADO</h4>
                                                <p id="texto-fim-typewriter"></p>
                                            </div>
                                            <div class="rodape-fala-ohm-epilogo">
                                                "${falaPosLuta}" — ${nomeBoss}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `;
                            iniciarTypewriterFim(textoEpilogo);
                        }
                    } else {
                        const estrelasHTML = `
                            <div class="status-estrelas-fase estrelas-fim-cutscene">
                                ${gerarEstrelasImgHTML(estrelas, 'estrela-png-fim')}
                            </div>
                        `;

                        if (mensagemFim) {
                            mensagemFim.innerHTML = `
                                <div class="resumo-vitoria-campanha">
                                    ${estrelasHTML}
                                    <div class="palco-cutscene palco-cutscene-fim">
                                        <div class="cutscene-speaker direita">
                                            <img src="${retratoBoss}" alt="${nomeBoss}" class="avatar-derrotado-cutscene">
                                            <span>${nomeBoss}</span>
                                        </div>
                                        <div class="caixa-texto-dialogo balao-player">
                                            <h4>${nomeBoss} (DERROTADO):</h4>
                                            <p id="texto-fim-typewriter"></p>
                                        </div>
                                    </div>
                                </div>
                            `;
                            if ((faseAtualCampanha === 3 || (inimigoAtual && inimigoAtual.id === 'ampere')) && audioManager.tocarDublagem) {
                                audioManager.tocarDublagem('ampere_derrotafase');
                            }
                            iniciarTypewriterFim(falaPosLuta);
                        }

                        if (btnProx) btnProx.classList.remove('hidden');
                    }
                } else {
                    if (btnProx) btnProx.classList.add('hidden');
                    if (mensagemFim) {
                        mensagemFim.innerHTML = "O Guardião adversário foi derrotado!";
                    }
                }

                audioManager.pararBGM();
                audioManager.tocarVitoria();
            }
        }, 2200);
        return true;
    }
    return false;
}

const btnProximaFase = document.getElementById('btn-proxima-fase');
if (btnProximaFase) {
    btnProximaFase.addEventListener('click', () => {
        audioManager.tocarClique();
        if (audioManager.pararDublagem) audioManager.pararDublagem();
        if (telaFimJogo) telaFimJogo.classList.add('hidden');

        if (faseAtualCampanha < 5) {
            faseAtualCampanha++;
            pvPersistenteJogador = Math.min(maxPvJogador, (parseInt(document.getElementById('pv-jogador').innerText, 10) || maxPvJogador) + 20);

            const boss = obterInimigoCampanha(jogadorAtual.id);
            iniciarCutsceneCampanha(faseAtualCampanha, jogadorAtual, boss, () => {
                iniciarBatalha(jogadorAtual);
            });
        }
    });
}

// ==========================================
// 5. EXECUÇÃO DE ATAQUE E ANIMAÇÕES
// ==========================================
const dicasDidaticas = {
    lorentz: "Pela Regra da Mão Direita (F = q·v × B), se o campo entra na tela: carga positiva (+) desvia para CIMA e negativa (-) desvia para BAIXO!",
    faraday: "O fluxo magnético é máximo quando o ângulo θ é 0° (espira perpendicular ao campo, cos 0° = 1). Ao aumentar θ até 90°, o fluxo reduz a zero!",
    ampere: "Pela Lei de Ampère, o campo magnético B no solenoide é diretamente proporcional à corrente i (B = μ·N·i). Se dobrarmos a corrente, o campo B também DOBRA!",
    wilhelm: "Pela Lei de Biot-Savart e os estudos de Weber, a intensidade do campo magnético B é inversamente proporcional à distância r (B ∝ 1/r)!",
    ohm: "Pela Lei de Ohm (i = V/R), quanto menor a resistência R, MAIOR será a corrente i. Se a corrente passar de 6 A, a sobrecarga queima o fusível!"
};

let timerTypewriterDica = null;

function exibirDicaDidaticaPersonagem(idGuardiao, textoCustomizado = null) {
    const boxBalao = document.getElementById('balao-dica-jogador');
    const imgAvatar = document.getElementById('img-dica-jogador');
    const txtAutor = document.getElementById('nome-dica-jogador');
    const txtTexto = document.getElementById('texto-dica-typewriter');

    if (!boxBalao || !txtTexto) return;
    if (timerTypewriterDica) clearInterval(timerTypewriterDica);

    const textoDica = textoCustomizado || dicasDidaticas[idGuardiao] || "Lembre-se dos princípios fundamentais do Eletromagnetismo para ajustar os parâmetros com precisão!";

    if (imgAvatar && jogadorAtual) imgAvatar.src = jogadorAtual.retrato;
    if (txtAutor && jogadorAtual) txtAutor.innerText = `${jogadorAtual.nome.toUpperCase()} EXPLICA:`;

    txtTexto.textContent = "";
    boxBalao.classList.remove('hidden');

    let charIndex = 0;
    let acumulado = "";

    timerTypewriterDica = setInterval(() => {
        if (jogoPausado) return;
        if (charIndex < textoDica.length) {
            const letra = textoDica.charAt(charIndex);
            acumulado += letra;
            txtTexto.textContent = acumulado;
            if (charIndex % 2 === 0 && letra !== ' ' && audioManager.tocarBlipTexto) {
                audioManager.tocarBlipTexto('dica');
            }
            charIndex++;
        } else {
            clearInterval(timerTypewriterDica);
            timerTypewriterDica = null;
        }
    }, 20);
}

let ultimoTurnoDescansoIA = -5;

function executarAtaque(previsaoJogador) {
    if (jogoPausado || faseAtual !== 4) return;
    faseAtual = 5;
    painelAcoes.classList.add('hidden');

    const ultAtiva = modoUltimatoSelecionado && (parseInt(document.getElementById('foco-jogador').innerText, 10) >= 3);

    if (ultAtiva) audioManager.tocarUltimato();
    else audioManager.tocarAtaque();

    const txtTitulo = document.getElementById('feedback-titulo');
    const txtCausa = document.getElementById('feedback-causa');
    const txtDano = document.getElementById('feedback-dano');
    const txtFoco = document.getElementById('feedback-foco');

    const spriteJPeq = document.getElementById('sprite-jogador-peq');
    const spriteJBody = document.getElementById('sprite-jogador-body');
    const spriteIPeq = document.getElementById('sprite-inimigo-peq');
    const spriteIBody = document.getElementById('sprite-inimigo-body');

    painelFeedback.classList.remove('painel-flutuante-direito', 'erro', 'sucesso');
    painelFeedback.classList.add('painel-flutuante-esquerdo');

    efeitoCanvas = { tipo: jogadorAtual.id, tempo: 0, isUlt: ultAtiva, params: { previsao: previsaoJogador } };

    let danoFinal = 0;
    let acertouInimigo = false;
    let acertouPrevisao = true;
    let escudoGanhoNoAtaque = 0;

    const custoAplicado = parseInt(document.getElementById('custo-en')?.innerText || "0", 10);
    const enAtual = parseInt(document.getElementById('en-jogador').innerText, 10) || 0;
    document.getElementById('en-jogador').innerText = Math.max(0, enAtual - custoAplicado);

    if (spriteJPeq) {
        spriteJPeq.classList.add('atacar-peq-esq');
        agendarTimerBatalha(() => spriteJPeq.classList.remove('atacar-peq-esq'), 800);
    }
    if (spriteJBody) {
        spriteJBody.src = `assets/${jogadorAtual.id}_body_atk.png`;
        spriteJBody.className = "sprite-grande atacar-gr-esq sprite-batalha-jogador";
        agendarTimerBatalha(() => {
            spriteJBody.src = `assets/${jogadorAtual.id}_body.png`;
            spriteJBody.className = "sprite-grande idle-esq sprite-batalha-jogador";
        }, 800);
    }

    if (ultAtiva) {
        document.getElementById('foco-jogador').innerText = "0";
        if (telaJogo) {
            telaJogo.classList.add('shake-ativo');
            agendarTimerBatalha(() => telaJogo.classList.remove('shake-ativo'), 500);
        }

        const pUlt = perguntaDinamicaUltAtual || gerarPerguntaDinamicaUlt(jogadorAtual.id);
        const acertouUlt = (previsaoJogador === pUlt.correta);

        if (jogadorAtual.id === 'faraday') {
            const omega = parseInt(document.getElementById('input-omega')?.value || "4", 10);
            const A = parseInt(document.getElementById('input-a-ult')?.value || "4", 10);
            const res = calcularGeradorManual(omega, A);
            danoFinal = res.dano;
            escudoGanhoNoAtaque = 0.30;
            txtCausa.innerText = `Gerador Manual em rotação máxima! Induziu ${danoFinal} de dano e 30% de Escudo!`;
        } else if (jogadorAtual.id === 'lorentz') {
            const i = parseInt(document.getElementById('input-i-trilho')?.value || "5", 10);
            const ang = parseInt(document.getElementById('input-ang-trilho')?.value || "90", 10);
            const res = calcularTrilhoForca(i, ang);
            danoFinal = res.dano;
            txtCausa.innerText = `Trilho de Força energizado! Força magnética de ${res.forca.toFixed(1)} N no alvo.`;
        } else if (jogadorAtual.id === 'ampere') {
            const n = parseInt(document.getElementById('input-n-inv')?.value || "3", 10);
            const i = parseInt(document.getElementById('input-i-inv')?.value || "3", 10);
            danoFinal = Math.min(36, (n + i) * 4 + arenaAtual.campoB);
            escudoGanhoNoAtaque = 0.30;
            txtCausa.innerText = `Ampère executou Inversão de Polaridade! Colapso magnético com barreira de 30%!`;
        } else if (jogadorAtual.id === 'wilhelm') {
            const polo = document.getElementById('input-polo-ult')?.value || 'N';
            const d = parseInt(document.getElementById('input-d-ult')?.value || "1", 10);
            const res = calcularPolosOpostosUlt(polo, d);
            danoFinal = res.dano;
            if (res.drenoEn > 0) {
                const enJ = parseInt(document.getElementById('en-jogador').innerText, 10) || 0;
                document.getElementById('en-jogador').innerText = Math.min(10, enJ + res.drenoEn);
                txtCausa.innerText = `Atração Dipolar de Weber (d=${d}m)! Causou ${danoFinal} de dano e drenou +${res.drenoEn} EN!`;
            } else {
                txtCausa.innerText = `Repulsão Magnética Explosiva (d=${d}m)! Impacto de ${danoFinal} de dano!`;
            }
        } else if (jogadorAtual.id === 'ohm') {
            const r = parseInt(document.getElementById('input-r-curto')?.value || "1", 10);
            const res = calcularUltOhm(r);
            danoFinal = res.dano;
            escudoGanhoNoAtaque = res.escudo;
            if (res.cura > 0) {
                const pvAtual = parseInt(document.getElementById('pv-jogador').innerText, 10) || 0;
                const curaReal = Math.min(maxPvJogador - pvAtual, res.cura);
                document.getElementById('pv-jogador').innerText = pvAtual + curaReal;
                if (curaReal > 0) criarTextoFlutuante("+" + curaReal, true, "cura");
            }
            txtCausa.innerText = `Curto Controlado (i = ${res.corrente.toFixed(1)} A)! Descarga de ${danoFinal} de dano ${res.extraTxt}!`;
        }

        if (acertouUlt) {
            danoFinal += 4;
            txtTitulo.innerText = "ULTIMATO CRÍTICO!";
            txtCausa.innerText = `[SOBRECARGA +4 DANO] ` + txtCausa.innerText;
            const boxBalao = document.getElementById('balao-dica-jogador');
            if (boxBalao) boxBalao.classList.add('hidden');
            painelFeedback.classList.add('sucesso');
        } else {
            if (audioManager.tocarErroFisica) audioManager.tocarErroFisica();
            danoFinal = Math.max(12, Math.round(danoFinal * 0.6));
            txtTitulo.innerText = "ULTIMATO INSTÁVEL!";
            txtCausa.innerText = `Previsão incorreta! O Ultimato perdeu estabilidade e causou ${danoFinal} de dano reduzido.`;
            exibirDicaDidaticaPersonagem(jogadorAtual.id, pUlt.dicaErro);
            painelFeedback.classList.add('erro');
        }

        if (escudoGanhoNoAtaque > 0) protecaoJogador = Math.max(protecaoJogador, escudoGanhoNoAtaque);
        acertouInimigo = true;
        txtDano.innerHTML = `<img src="assets/atk.png" class="icone-hud" alt="Atk"> Dano Ult: ${danoFinal}`;
        txtFoco.innerHTML = `<img src="assets/ult.png" class="icone-hud" alt="Ult"> Ult: Consumida`;
        adicionarLog(`${jogadorAtual.nome} usou ULTIMATO (${acertouUlt ? 'Crítico' : 'Instável'}) causando ${danoFinal} de dano!`, 'jogador');

    } else {
        const pDin = perguntaDinamicaAtual || gerarPerguntaDinamica(jogadorAtual.id);
        acertouPrevisao = (previsaoJogador === pDin.correta);

        if (pDin.desvioCanvas) {
            efeitoCanvas.params.desvio = pDin.desvioCanvas;
        }

        if (acertouPrevisao) {
            danoFinal = pDin.dano;
            txtCausa.innerText = pDin.msgAcerto;

            if (pDin.escudo > 0) {
                escudoGanhoNoAtaque = pDin.escudo;
                protecaoJogador = Math.max(protecaoJogador, escudoGanhoNoAtaque);
            }

            if (jogadorAtual.id === 'lorentz') {
                acertosSeguidosLorentz++;
                if (acertosSeguidosLorentz >= 5) {
                    desbloquearConquista('lorentz_master', 'Mestre da Força de Lorentz', 'Acertou 5 previsões seguidas com Lorentz!');
                }
            }
        } else {
            danoFinal = 0;
            txtCausa.innerText = pDin.msgErro;
            if (jogadorAtual.id === 'lorentz') acertosSeguidosLorentz = 0;
        }

        if (!acertouPrevisao) {
            if (audioManager.tocarErroFisica) audioManager.tocarErroFisica();
            painelFeedback.classList.add('erro');
            txtTitulo.innerText = "Falha Crítica!";
            txtDano.innerHTML = `<img src="assets/atk.png" class="icone-hud" alt="Atk"> Dano: 0`;
            txtFoco.innerHTML = `<img src="assets/ult.png" class="icone-hud" alt="Ult"> Ult: +0`;
            adicionarLog(`${jogadorAtual.nome} errou a previsão! Falha crítica (0 de dano).`, 'jogador');
            exibirDicaDidaticaPersonagem(jogadorAtual.id, pDin.dicaErro);
        } else {
            const boxBalao = document.getElementById('balao-dica-jogador');
            if (boxBalao) boxBalao.classList.add('hidden');

            painelFeedback.classList.add('sucesso');
            let ganhoUlt = 0;
            const focoAtual = parseInt(document.getElementById('foco-jogador').innerText, 10) || 0;
            if (focoAtual < 3) {
                ganhoUlt = 1;
                document.getElementById('foco-jogador').innerText = focoAtual + 1;
            }
            txtTitulo.innerText = "Ação Bem Sucedida!";
            txtDano.innerHTML = `<img src="assets/atk.png" class="icone-hud" alt="Atk"> Dano: ${danoFinal}`;
            txtFoco.innerHTML = `<img src="assets/ult.png" class="icone-hud" alt="Ult"> Ult: +${ganhoUlt}`;

            if (danoFinal > 0) {
                acertouInimigo = true;
                adicionarLog(`${jogadorAtual.nome} acertou a previsão causando ${danoFinal} de dano.`, 'jogador');
            }
        }
    }

    // =========================================================
    // MODIFICADORES ELEMENTAIS DOS 5 BIOMAS DA ARENA
    // =========================================================
    if (estagioCenarioAtual === 1) {
        // 1. Ciclotron: +15% Dano Básico | -15% Escudos
        if (!ultAtiva && danoFinal > 0) danoFinal = Math.round(danoFinal * 1.15);
        if (escudoGanhoNoAtaque > 0) {
            protecaoJogador = Math.max(0.05, Number((protecaoJogador - 0.15).toFixed(2)));
        }
    } else if (estagioCenarioAtual === 3) {
        // 3. Forja Ferro-Magnética: +15% Escudos | -4 PV por Calor de Curie na ULT
        if (escudoGanhoNoAtaque > 0) {
            protecaoJogador = Math.min(0.85, Number((protecaoJogador + 0.15).toFixed(2)));
        }
        if (ultAtiva) {
            const pvJ = parseInt(document.getElementById('pv-jogador').innerText, 10) || 1;
            document.getElementById('pv-jogador').innerText = Math.max(1, pvJ - 4);
            criarTextoFlutuante("-4 CALOR", true, "dano");
            adicionarLog("Calor de Curie da Forja drenou 4 PV durante a sobrecarga da ULT!", 'inimigo');
        }
    } else if (estagioCenarioAtual === 4) {
        // 4. Observatório Boreal: Falha na previsão causa Congelamento (-4 PV)
        if (!acertouPrevisao || (ultAtiva && txtTitulo.innerText.includes("INSTÁVEL"))) {
            const pvJ = parseInt(document.getElementById('pv-jogador').innerText, 10) || 1;
            document.getElementById('pv-jogador').innerText = Math.max(1, pvJ - 4);
            criarTextoFlutuante("-4 FRIO", true, "dano");
            adicionarLog("O frio extremo do Observatório Boreal congelou seu circuito (-4 PV)!", 'inimigo');
        }
    } else if (estagioCenarioAtual === 5) {
        // 5. Núcleo de Alta Tensão: +20% Dano ULT | -6 PV ao errar previsão
        if (ultAtiva && danoFinal > 0) danoFinal = Math.round(danoFinal * 1.20);
        if (!acertouPrevisao || (ultAtiva && txtTitulo.innerText.includes("INSTÁVEL"))) {
            const pvJ = parseInt(document.getElementById('pv-jogador').innerText, 10) || 1;
            document.getElementById('pv-jogador').innerText = Math.max(1, pvJ - 6);
            criarTextoFlutuante("-6 ARCO", true, "dano");
            adicionarLog("Arco voltaico do Núcleo causou 6 PV de choque de retorno!", 'inimigo');
        }
    }
    
    if (protecaoInimigo > 0) {
        if (danoFinal > 0) {
            danoFinal = Math.round(danoFinal * (1 - protecaoInimigo));
            txtCausa.innerText += ` (Escudo inimigo mitigou parte do dano!)`;
            txtDano.innerHTML = `<img src="assets/atk.png" class="icone-hud" alt="Atk"> Dano Final: ${danoFinal}`;
            adicionarLog(`O Escudo Eletromagnético do oponente mitigou o impacto para ${danoFinal}!`, 'neutro');
        }
        protecaoInimigo = 0;
    }

    if (!acertouPrevisao && !ultAtiva) {
        criarCalloutTatico("FALHA FÍSICA!", true, "#e74c3c");
    }

    if (danoFinal > 0) {
        acertouInimigo = true;
        audioManager.tocarDano();
        const pvInimigoAtual = parseInt(document.getElementById('pv-inimigo').innerText, 10) || 0;
        document.getElementById('pv-inimigo').innerText = Math.max(0, pvInimigoAtual - danoFinal);
        criarTextoFlutuante("-" + danoFinal, false, "dano");

        if (ultAtiva) {
            criarCalloutTatico("IMPACTO MÁXIMO!", false, "#ff00ff");
        } else if (danoFinal >= 20) {
            criarCalloutTatico("ALTA POTÊNCIA!", false, "#f1c40f");
        }
    }

    if (acertouInimigo && spriteIPeq && spriteIBody) {
        agendarTimerBatalha(() => {
            criarExplosaoParticulas(740, 275, ultAtiva ? '#ff00ff' : '#00ffff', ultAtiva ? 36 : 20);

            if (!ultAtiva && telaJogo) {
                telaJogo.classList.add('shake-leve');
                agendarTimerBatalha(() => telaJogo.classList.remove('shake-leve'), 300);
            }

            spriteIPeq.classList.add('sofrer-dano-peq-dir');
            spriteIBody.className = "sprite-grande sofrer-dano-gr-dir sprite-batalha-inimigo";
            agendarTimerBatalha(() => {
                spriteIPeq.classList.remove('sofrer-dano-peq-dir');
                spriteIBody.className = "sprite-grande idle-dir sprite-batalha-inimigo";
            }, 500);
        }, 200);
    }

    painelFeedback.classList.remove('hidden');
    atualizarHUD();

    agendarTimerBatalha(() => {
        painelFeedback.classList.add('hidden');
        if (!verificarFimDeJogo()) passarTurno();
    }, 4500);
}

// IA COM PERSONALIDADES POR GUARDIÃO
function jogadaDaIA() {
    if (!inimigoAtual) return;

    const txtTitulo = document.getElementById('feedback-titulo');
    const txtCausa = document.getElementById('feedback-causa');
    const txtDano = document.getElementById('feedback-dano');
    const txtFoco = document.getElementById('feedback-foco');
    const spriteJPeq = document.getElementById('sprite-jogador-peq');
    const spriteJBody = document.getElementById('sprite-jogador-body');
    const spriteIPeq = document.getElementById('sprite-inimigo-peq');
    const spriteIBody = document.getElementById('sprite-inimigo-body');

    painelFeedback.classList.remove('painel-flutuante-esquerdo', 'sucesso');
    painelFeedback.classList.add('painel-flutuante-direito', 'erro');

    const focoI = parseInt(document.getElementById('foco-inimigo').innerText, 10) || 0;
    const isUlt = (focoI >= 3);
    const enI = parseInt(document.getElementById('en-inimigo').innerText, 10) || 0;
    const pvI = parseInt(document.getElementById('pv-inimigo').innerText, 10) || 0;
    const pctPvI = pvI / maxPvInimigo;
    let danoFinal = 0;

    const podeDescansar = (numeroTurno - ultimoTurnoDescansoIA) >= 2;
    const querDescansarPorEnergia = (!isUlt && enI <= 3);
    const querDescansarPorVida = (!isUlt && podeDescansar && pctPvI <= 0.45 && (enI <= 6 || Math.random() < 0.55));

    if (querDescansarPorEnergia || querDescansarPorVida) {
        ultimoTurnoDescansoIA = numeroTurno;
        let cura = 10;
        if (pvI + cura > maxPvInimigo) cura = maxPvInimigo - pvI;

        document.getElementById('pv-inimigo').innerText = pvI + cura;
        if (cura > 0) criarTextoFlutuante("+" + cura, false, "cura");
        aplicarEfeitoCuraVisual(false);

        const energiaRecuperada = 4;
        document.getElementById('en-inimigo').innerText = Math.min(10, enI + energiaRecuperada);

        const frasesDescansoIA = {
            lorentz: "Lorentz desacelerou no Ciclotron para resfriar os capacitores e recarregar partículas!",
            faraday: "Faraday estabilizou o fluxo de sua espira para regenerar o circuito magnético!",
            ampere: "Ampère dissipou o calor do núcleo de ferro para restaurar sua integridade e energia!",
            wilhelm: "Wilhelm realinhou suas agulhas com o norte magnético, recuperando vigor e energia!",
            ohm: "Ohm abriu a chave do circuito principal para evitar sobrecarga e restaurar seus resistores!"
        };

        txtTitulo.innerText = `Descanso Tático (${inimigoAtual.nome})`;
        txtCausa.innerText = frasesDescansoIA[inimigoAtual.id] || `${inimigoAtual.nome} poupou energias e estabilizou seu circuito!`;
        txtDano.innerHTML = `Cura Recebida: +${cura} <img src="assets/pv.png" class="icone-hud" alt="PV">`;
        txtFoco.innerHTML = `Energia: +${energiaRecuperada} <img src="assets/en.png" class="icone-hud" alt="EN">`;
        adicionarLog(`${inimigoAtual.nome} realizou Descanso Tático (+${cura} PV / +${energiaRecuperada} EN).`, 'inimigo');

        painelFeedback.classList.remove('hidden');
        atualizarHUD();
        agendarTimerBatalha(() => {
            painelFeedback.classList.add('hidden');
            if (!verificarFimDeJogo()) passarTurno();
        }, 4200);
        return;
    }

    txtTitulo.innerText = isUlt ? "ULTIMATO INIMIGO!" : `Ação de ${inimigoAtual.nome}`;
    efeitoCanvas = { tipo: inimigoAtual.id, tempo: 0, isUlt: isUlt, isEnemy: true, params: {} };

    if (spriteIPeq && spriteIBody) {
        spriteIPeq.classList.add('atacar-peq-dir');
        spriteIBody.src = `assets/${inimigoAtual.id}_body_atk.png`;
        spriteIBody.className = "sprite-grande atacar-gr-dir sprite-batalha-inimigo";
        agendarTimerBatalha(() => {
            spriteIPeq.classList.remove('atacar-peq-dir');
            spriteIBody.src = `assets/${inimigoAtual.id}_body.png`;
            spriteIBody.className = "sprite-grande idle-dir sprite-batalha-inimigo";
        }, 800);
    }

    if (isUlt) {
        audioManager.tocarUltimato();
        document.getElementById('foco-inimigo').innerText = "0";
        document.getElementById('en-inimigo').innerText = Math.max(0, enI - 4);
        if (telaJogo) {
            telaJogo.classList.add('shake-ativo');
            agendarTimerBatalha(() => telaJogo.classList.remove('shake-ativo'), 500);
        }

        if (inimigoAtual.id === 'lorentz') { danoFinal = 30; txtCausa.innerText = "Lorentz disparou o Trilho de Força em ângulo perpendicular (90°)!"; }
        else if (inimigoAtual.id === 'faraday') { danoFinal = 31; protecaoInimigo = 0.25; txtCausa.innerText = "Faraday sobrecarregou o Gerador Manual e ergueu barreira de 25%!"; }
        else if (inimigoAtual.id === 'ampere') { danoFinal = 29; protecaoInimigo = 0.25; txtCausa.innerText = "Ampère reverteu a polaridade do Solenoide com impacto brutal!"; }
        else if (inimigoAtual.id === 'wilhelm') { danoFinal = 28; txtCausa.innerText = "Wilhelm colidiu os Polos Opostos na distância mínima (1/d²)!"; }
        else if (inimigoAtual.id === 'ohm') { danoFinal = 33; txtCausa.innerText = "Ohm provocou um Curto-Circuito Massivo de Alta Potência!"; }

        txtDano.innerHTML = `Dano Recebido: ${danoFinal} <img src="assets/atk.png" class="icone-hud" alt="Atk">`;
        txtFoco.innerHTML = `Ult: Consumida <img src="assets/ult.png" class="icone-hud" alt="Ult">`;
        adicionarLog(`${inimigoAtual.nome} usou ULTIMATO causando ${danoFinal} de dano!`, 'inimigo');

    } else {
        if (focoI < 3) document.getElementById('foco-inimigo').innerText = focoI + 1;

        if (inimigoAtual.id === 'lorentz') {
            const custo = enI >= 6 ? 5 : 4;
            document.getElementById('en-inimigo').innerText = Math.max(0, enI - custo);
            danoFinal = custo === 5 ? 19 : 15;
            efeitoCanvas.params.desvio = Math.random() > 0.5 ? 'cima' : 'baixo';
            audioManager.tocarAtaque();
            txtCausa.innerText = `Lorentz acelerou uma partícula a v = ${custo * 2} m/s em trajetória curva!`;
            adicionarLog(`Lorentz realizou Disparo Curvo Rápido (${danoFinal} de dano).`, 'inimigo');

        } else if (inimigoAtual.id === 'faraday') {
            if (protecaoInimigo === 0 && Math.random() < 0.45) {
                if (audioManager.tocarEscudo) audioManager.tocarEscudo();
                document.getElementById('en-inimigo').innerText = Math.max(0, enI - 3);
                danoFinal = 0;
                protecaoInimigo = 0.50;
                txtTitulo.innerText = "Barreira Induzida (Faraday)";
                txtCausa.innerText = "Faraday alinhou sua Espira em θ = 0° e ergueu um Escudo Eletromagnético (50%)!";
                adicionarLog(`Faraday ergueu Escudo Eletromagnético (50% de mitigação).`, 'inimigo');
            } else {
                const custo = enI >= 5 ? 4 : 3;
                document.getElementById('en-inimigo').innerText = Math.max(0, enI - custo);
                danoFinal = 16;
                protecaoInimigo = 0.20;
                audioManager.tocarAtaque();
                txtCausa.innerText = "Faraday variou o fluxo magnético, lançando descarga induzida com escudo residual (20%)!";
                adicionarLog(`Faraday atacou com Descarga Induzida (${danoFinal} de dano + 20% escudo).`, 'inimigo');
            }

        } else if (inimigoAtual.id === 'ampere') {
            const usaFerro = enI >= 5;
            const custo = usaFerro ? 5 : 3;
            document.getElementById('en-inimigo').innerText = Math.max(0, enI - custo);
            danoFinal = usaFerro ? 20 : 15;
            if (usaFerro) protecaoInimigo = 0.20;
            audioManager.tocarAtaque();
            txtCausa.innerText = usaFerro
                ? "Ampère acoplou o Núcleo de Ferro no Solenoide, multiplicando o campo B!"
                : "Ampère disparou um pulso magnético com núcleo de ar!";
            adicionarLog(`Ampère ativou Eletroímã (${danoFinal} de dano).`, 'inimigo');

        } else if (inimigoAtual.id === 'wilhelm') {
            const agulhas = enI >= 6 ? 3 : 2;
            const custo = agulhas === 3 ? 5 : 3;
            document.getElementById('en-inimigo').innerText = Math.max(0, enI - custo);
            danoFinal = agulhas === 3 ? 18 : 15;
            audioManager.tocarAtaque();
            txtCausa.innerText = `Wilhelm triangulou sua posição com ${agulhas} agulhas magnéticas de Weber!`;
            adicionarLog(`Wilhelm cravou ${agulhas} agulhas (${danoFinal} de dano).`, 'inimigo');

        } else if (inimigoAtual.id === 'ohm') {
            const altaPotencia = enI >= 6;
            const custo = altaPotencia ? 5 : 4;
            document.getElementById('en-inimigo').innerText = Math.max(0, enI - custo);
            danoFinal = altaPotencia ? 21 : 16;
            if (!altaPotencia) protecaoInimigo = 0.25;
            audioManager.tocarAtaque();
            txtCausa.innerText = altaPotencia
                ? "Ohm reduziu a resistência para 2 Ω, disparando potência máxima de 72 W!"
                : "Ohm associou resistores em série, atacando e gerando blindagem de 25%!";
            adicionarLog(`Ohm executou Circuito de Potência (${danoFinal} de dano).`, 'inimigo');
        }

        txtDano.innerHTML = danoFinal > 0
            ? `Dano Recebido: ${danoFinal} <img src="assets/atk.png" class="icone-hud" alt="Atk">`
            : `Escudo Ativo: ${Math.round(protecaoInimigo * 100)}% <img src="assets/dfs.png" class="icone-hud" alt="Def">`;
        txtFoco.innerHTML = `Ult: +1 <img src="assets/ult.png" class="icone-hud" alt="Ult">`;
    }

    if (protecaoJogador > 0 && danoFinal > 0) {
        danoFinal = Math.round(danoFinal * (1 - protecaoJogador));
        txtCausa.innerText += ` (Seu escudo mitigou o impacto!)`;
        txtDano.innerHTML = `Dano Recebido: ${danoFinal} <img src="assets/atk.png" class="icone-hud" alt="Atk">`;
        adicionarLog(`Seu Escudo Eletromagnético reduziu o dano inimigo para ${danoFinal}!`, 'neutro');
        protecaoJogador = 0;
    } else if (protecaoJogador > 0 && danoFinal === 0) {
        protecaoJogador = 0;
    }

    if (inimigoAtual.id === 'ohm' && isUlt) {
        tomouDanoUltOhm = true;
    }

    if (danoFinal > 0) {
        audioManager.tocarDano();
        const pvJogador = parseInt(document.getElementById('pv-jogador').innerText, 10) || 0;
        document.getElementById('pv-jogador').innerText = Math.max(0, pvJogador - danoFinal);
        criarTextoFlutuante("-" + danoFinal, true, "dano");

        if (isUlt) {
            criarCalloutTatico("SOBRECARGA INIMIGA!", true, "#e74c3c");
        }

        if (spriteJPeq && spriteJBody) {
            agendarTimerBatalha(() => {
                criarExplosaoParticulas(220, 275, isUlt ? '#ff3344' : '#f1c40f', isUlt ? 36 : 18);

                if (!isUlt && telaJogo) {
                    telaJogo.classList.add('shake-leve');
                    agendarTimerBatalha(() => telaJogo.classList.remove('shake-leve'), 300);
                }

                spriteJPeq.classList.add('sofrer-dano-peq-esq');
                spriteJBody.className = "sprite-grande sofrer-dano-gr-esq sprite-batalha-jogador";
                agendarTimerBatalha(() => {
                    spriteJPeq.classList.remove('sofrer-dano-peq-esq');
                    spriteJBody.className = "sprite-grande idle-esq sprite-batalha-jogador";
                }, 800);
            }, 400);
        }
    }

    painelFeedback.classList.remove('hidden');
    atualizarHUD();

    agendarTimerBatalha(() => {
        painelFeedback.classList.add('hidden');
        if (!verificarFimDeJogo()) passarTurno();
    }, 4500);
}

function passarTurno() {
    const textoFase = document.getElementById('fase-atual');

    if (turnoDoJogador) {
        turnoDoJogador = false;
        if (textoFase) {
            textoFase.innerText = `TURNO 0${numeroTurno} • VEZ DO OPONENTE`;
            textoFase.className = "texto-turno-inimigo";
        }
        if (telaJogo) telaJogo.classList.add('turno-inimigo-ativo');

        // Modificador de Arena para o Inimigo: Usina (2) dá +1 EN | Boreal (4) tira -1 EN
        const bonusEnArenaI = (estagioCenarioAtual === 2) ? 1 : ((estagioCenarioAtual === 4) ? -1 : 0);
        const enAtualI = parseInt(document.getElementById('en-inimigo').innerText, 10) || 0;
        document.getElementById('en-inimigo').innerText = Math.min(10, enAtualI + Math.max(1, 2 + bonusEnArenaI));

        mostrarSplash("TURNO DO INIMIGO", "#e74c3c");
        atualizarHUD();
        agendarTimerBatalha(() => jogadaDaIA(), 1500);
    } else {
        turnoDoJogador = true;
        faseAtual = 1;
        numeroTurno++;

        const boxBalao = document.getElementById('balao-dica-jogador');
        if (boxBalao) boxBalao.classList.add('hidden');
        if (timerTypewriterDica) clearInterval(timerTypewriterDica);

        if (textoFase) {
            textoFase.innerText = `TURNO 0${numeroTurno} • SUA VEZ`;
            textoFase.className = "texto-turno-jogador";
        }
        if (telaJogo) telaJogo.classList.remove('turno-inimigo-ativo');

        // Modificador de Arena para o Jogador: Usina (2) dá +1 EN (5 EN) | Boreal (4) tira -1 EN (3 EN)
        const bonusEnArenaJ = (estagioCenarioAtual === 2) ? 1 : ((estagioCenarioAtual === 4) ? -1 : 0);
        const ganhoEnTurno = Math.max(2, 4 + bonusEnArenaJ);
        const enAtual = parseInt(document.getElementById('en-jogador').innerText, 10) || 0;
        document.getElementById('en-jogador').innerText = Math.min(10, enAtual + ganhoEnTurno);

        mostrarSplash("SEU TURNO", "#4da6ff");
        atualizarHUD();

        if (inputsDinamicos) inputsDinamicos.innerHTML = '';

        const fasePrevisao = document.getElementById('fase-previsao');
        const faseConfiguracao = document.getElementById('fase-configuracao');
        if (fasePrevisao) fasePrevisao.classList.add('hidden');
        if (faseConfiguracao) faseConfiguracao.classList.remove('hidden');
    }
}

// ==========================================
// 6. MOTOR GRÁFICO (Canvas e Partículas)
// ==========================================
const canvas = document.getElementById('arenaCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const imagensCenarios = {};
for (let i = 1; i <= 5; i++) {
    const img = new Image();
    img.src = estagiosCampanha[i].bg;
    imagensCenarios[i] = img;
}

let particulasImpacto = [];

function criarExplosaoParticulas(x, y, cor, quantidade = 22) {
    for (let i = 0; i < quantidade; i++) {
        const angulo = Math.random() * Math.PI * 2;
        const velocidade = 2 + Math.random() * 7;
        particulasImpacto.push({
            x: x,
            y: y,
            vx: Math.cos(angulo) * velocidade,
            vy: Math.sin(angulo) * velocidade - 1.5,
            tamanho: Math.random() > 0.4 ? 6 : 4,
            cor: Math.random() > 0.25 ? cor : '#ffffff',
            vida: 1.0,
            decaimento: 0.025 + Math.random() * 0.03
        });
    }
}

function atualizarEDesenharParticulas(contexto) {
    if (!contexto || particulasImpacto.length === 0) return;
    contexto.save();
    for (let i = particulasImpacto.length - 1; i >= 0; i--) {
        const p = particulasImpacto[i];
        if (!jogoPausado) {
            p.x += p.vx;
            p.y += p.vy;
            if (!p.semGravidade) p.vy += 0.18;
            p.vida -= p.decaimento;
        }

        if (p.vida <= 0) {
            particulasImpacto.splice(i, 1);
            continue;
        }

        contexto.globalAlpha = Math.max(0, p.vida);
        contexto.fillStyle = p.cor;
        contexto.shadowBlur = 8;
        contexto.shadowColor = p.cor;
        contexto.fillRect(Math.round(p.x), Math.round(p.y), p.tamanho, p.tamanho);
    }
    contexto.restore();
}

function criarParticulasAscendentes(x, y, cor = '#2ecc71', quantidade = 22) {
    for (let i = 0; i < quantidade; i++) {
        particulasImpacto.push({
            x: x + (Math.random() * 110 - 55),
            y: y + 40 - (Math.random() * 30),
            vx: (Math.random() - 0.5) * 1.2,
            vy: -2.2 - Math.random() * 3.5,
            tamanho: Math.random() > 0.4 ? 6 : 4,
            cor: Math.random() > 0.3 ? cor : '#ffffff',
            vida: 1.0,
            decaimento: 0.02 + Math.random() * 0.02,
            semGravidade: true
        });
    }
}

function aplicarEfeitoCuraVisual(isJogador) {
    if (audioManager.tocarCura) audioManager.tocarCura();
    const spriteBody = document.getElementById(isJogador ? 'sprite-jogador-body' : 'sprite-inimigo-body');
    const spritePeq = document.getElementById(isJogador ? 'sprite-jogador-peq' : 'sprite-inimigo-peq');
    const xAlvo = isJogador ? 220 : 740;

    criarParticulasAscendentes(xAlvo, 275, '#2ecc71', 26);
    criarCalloutTatico("CIRCUITO ESTABILIZADO!", isJogador, "#2ecc71");

    if (spritePeq) {
        spritePeq.classList.add('reacao-cura-peq');
        agendarTimerBatalha(() => spritePeq.classList.remove('reacao-cura-peq'), 1200);
    }

    if (spriteBody) {
        const classeCura = isJogador ? 'reacao-cura-esq' : 'reacao-cura-dir';
        const classeIdle = isJogador ? 'idle-esq' : 'idle-dir';
        const classePos = isJogador ? 'sprite-batalha-jogador' : 'sprite-batalha-inimigo';

        spriteBody.className = `sprite-grande ${classeCura} ${classePos}`;
        agendarTimerBatalha(() => {
            spriteBody.className = `sprite-grande ${classeIdle} ${classePos}`;
        }, 1200);
    }
}

function desenharCampoMagneticoArena(contexto) {
    if (!contexto || !canvas) return;
    contexto.save();
    const tempo = obterTempoArena() / 600;
    const entrando = arenaAtual.sentido === 'entrando';
    const corVetores = entrando ? 'rgba(77, 166, 255, 0.18)' : 'rgba(241, 196, 15, 0.18)';

    const espacamentoX = 160;
    const espacamentoY = 120;

    contexto.strokeStyle = corVetores;
    contexto.fillStyle = corVetores;
    contexto.lineWidth = 2;

    for (let gx = 80; gx < canvas.width; gx += espacamentoX) {
        for (let gy = 70; gy < canvas.height - 90; gy += espacamentoY) {
            const flutuarY = gy + Math.sin(tempo + gx * 0.01) * 4;
            if (entrando) {
                const tam = 5;
                contexto.beginPath();
                contexto.moveTo(gx - tam, flutuarY - tam);
                contexto.lineTo(gx + tam, flutuarY + tam);
                contexto.moveTo(gx + tam, flutuarY - tam);
                contexto.lineTo(gx - tam, flutuarY + tam);
                contexto.stroke();
            } else {
                contexto.beginPath();
                contexto.arc(gx, flutuarY, 3, 0, Math.PI * 2);
                contexto.fill();
                contexto.beginPath();
                contexto.arc(gx, flutuarY, 7 + Math.sin(tempo * 2) * 1.5, 0, Math.PI * 2);
                contexto.stroke();
            }
        }
    }
    contexto.restore();
}

let particulasAmbiente = [];

function inicializarClimaBioma() {
    particulasAmbiente = [];
    const qtd = 34;
    for (let i = 0; i < qtd; i++) {
        particulasAmbiente.push({
            x: Math.random() * 960,
            y: Math.random() * 525,
            velX: (Math.random() - 0.5) * 1.8,
            velY: (Math.random() - 0.5) * 1.8,
            tam: Math.random() > 0.5 ? 4 : 3,
            fase: Math.random() * Math.PI * 2
        });
    }
}

function desenharAtmosferaBioma(contexto) {
    if (!contexto || !canvas) return;
    contexto.save();

    const bioma = estagiosCampanha[estagioCenarioAtual] || estagiosCampanha[1];
    const tempo = obterTempoArena() / 1000;
    const corClima = bioma ? bioma.corTema : '#4da6ff';
    const tipoClima = bioma ? bioma.clima : 'ions';

    if (bioma) {
        contexto.fillStyle = bioma.overlayCor;
        contexto.fillRect(0, 0, canvas.width, canvas.height);
    }

    if (tipoClima === 'ions') {
        contexto.save();
        contexto.translate(canvas.width / 2, canvas.height / 2 - 20);
        for (let r = 1; r <= 2; r++) {
            const raioPulso = (r * 130) + Math.sin(tempo * 3 + r) * 12;
            contexto.beginPath();
            contexto.arc(0, 0, raioPulso, 0, Math.PI * 2);
            contexto.strokeStyle = `rgba(0, 229, 255, ${0.14 - r * 0.04})`;
            contexto.lineWidth = 3;
            contexto.stroke();
        }
        contexto.restore();

    } else if (tipoClima === 'fluxo') {
        contexto.save();
        contexto.beginPath();
        for (let x = 0; x <= canvas.width; x += 16) {
            const yOnda = 230 + Math.sin((x * 0.015) + (tempo * 3.5)) * 45;
            if (x === 0) contexto.moveTo(x, yOnda);
            else contexto.lineTo(x, yOnda);
        }
        contexto.strokeStyle = 'rgba(241, 196, 15, 0.22)';
        contexto.lineWidth = 3;
        contexto.shadowBlur = 12;
        contexto.shadowColor = '#f1c40f';
        contexto.stroke();
        contexto.restore();

    } else if (tipoClima === 'forja') {
        const gradForja = contexto.createLinearGradient(0, canvas.height - 180, 0, canvas.height);
        const alphaCalor = 0.18 + Math.sin(tempo * 4) * 0.07;
        gradForja.addColorStop(0, 'rgba(255, 82, 82, 0)');
        gradForja.addColorStop(1, `rgba(255, 82, 20, ${alphaCalor})`);
        contexto.fillStyle = gradForja;
        contexto.fillRect(0, canvas.height - 180, canvas.width, 180);

    } else if (tipoClima === 'aurora') {
        contexto.save();
        // Vinheta de Geada / Frio Criogênico nas bordas da Arena Boreal
        const gradGeada = contexto.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 220,
            canvas.width / 2, canvas.height / 2, 540
        );
        gradGeada.addColorStop(0, 'rgba(24, 255, 255, 0)');
        gradGeada.addColorStop(1, `rgba(180, 245, 255, ${0.18 + Math.sin(tempo * 2) * 0.05})`);
        contexto.fillStyle = gradGeada;
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        for (let faixa = 0; faixa < 2; faixa++) {
            contexto.beginPath();
            for (let x = 0; x <= canvas.width; x += 20) {
                const yAurora = 75 + faixa * 40 + Math.sin((x * 0.008) + tempo * 1.8 + faixa) * 24;
                if (x === 0) contexto.moveTo(x, yAurora);
                else contexto.lineTo(x, yAurora);
            }
            contexto.strokeStyle = faixa === 0 ? 'rgba(24, 255, 255, 0.26)' : 'rgba(105, 240, 174, 0.22)';
            contexto.lineWidth = 18;
            contexto.shadowBlur = 25;
            contexto.shadowColor = '#18ffff';
            contexto.stroke();
        }
        contexto.restore();

    } else if (tipoClima === 'plasma' && !jogoPausado) {
        if (Math.random() > 0.65) {
            contexto.save();
            let xRaio = 180 + Math.random() * 600;
            let yRaio = 40;
            contexto.beginPath();
            contexto.moveTo(xRaio, yRaio);
            for (let seg = 0; seg < 6; seg++) {
                xRaio += (Math.random() - 0.5) * 60;
                yRaio += 35 + Math.random() * 25;
                contexto.lineTo(xRaio, yRaio);
            }
            contexto.strokeStyle = Math.random() > 0.5 ? 'rgba(224, 64, 251, 0.55)' : 'rgba(0, 229, 255, 0.55)';
            contexto.lineWidth = 2.5;
            contexto.shadowBlur = 15;
            contexto.shadowColor = '#e040fb';
            contexto.stroke();
            contexto.restore();
        }
    }

    particulasAmbiente.forEach(p => {
        if (tipoClima === 'ions') {
            if (!jogoPausado) {
                p.x += 4.2;
                if (p.x > canvas.width) p.x = -20;
            }
            contexto.fillStyle = corClima;
            contexto.globalAlpha = 0.45;
            contexto.fillRect(p.x, p.y, 14, 2);
        } else if (tipoClima === 'fluxo') {
            if (!jogoPausado) {
                p.y -= 1.2;
                p.x += Math.sin(tempo * 2 + p.fase) * 1.1;
                if (p.y < 0) p.y = canvas.height;
            }
            contexto.fillStyle = corClima;
            contexto.globalAlpha = 0.45;
            contexto.fillRect(p.x, p.y, p.tam + 2, p.tam + 2);
        } else if (tipoClima === 'forja') {
            if (!jogoPausado) {
                p.y -= 2.0;
                p.x += Math.sin(tempo * 3 + p.fase) * 1.4;
                if (p.y < 0) { p.y = canvas.height; p.x = Math.random() * canvas.width; }
            }
            contexto.fillStyle = p.fase > 3 ? '#ff5252' : '#ffab00';
            contexto.globalAlpha = 0.65;
            contexto.fillRect(p.x, p.y, p.tam + 1, p.tam + 1);
        } else if (tipoClima === 'aurora') {
            if (!jogoPausado) {
                p.x += Math.cos(tempo + p.fase) * 0.8;
                p.y += 0.7;
                if (p.y > canvas.height) p.y = 0;
            }
            contexto.fillStyle = Math.sin(tempo + p.fase) > 0 ? '#18ffff' : '#69f0ae';
            contexto.globalAlpha = 0.45;
            contexto.fillRect(p.x, p.y, p.tam, p.tam);
        } else {
            if (!jogoPausado) {
                p.y -= 2.5;
                p.x += (Math.random() - 0.5) * 3.5;
                if (p.y < 0) p.y = canvas.height;
            }
            contexto.fillStyle = p.fase > 3 ? '#e040fb' : '#00e5ff';
            contexto.globalAlpha = 0.6;
            contexto.fillRect(p.x, p.y, p.tam + 2, p.tam + 2);
        }
    });

    contexto.restore();
}

function desenharArena() {
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const imgCenario = imagensCenarios[estagioCenarioAtual];
    if (imgCenario && imgCenario.complete && imgCenario.naturalWidth !== 0) {
        const tCam = obterTempoArena() / 1800;
        const escala = 1.035;
        const largAmpliada = canvas.width * escala;
        const altAmpliada = canvas.height * escala;
        const offsetX = -((largAmpliada - canvas.width) / 2) + Math.sin(tCam) * 10;
        const offsetY = -((altAmpliada - canvas.height) / 2) + Math.cos(tCam * 0.7) * 5;

        ctx.drawImage(imgCenario, offsetX, offsetY, largAmpliada, altAmpliada);
    } else {
        ctx.fillStyle = '#0d131a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    desenharAtmosferaBioma(ctx);
    desenharCampoMagneticoArena(ctx);
}

function loopAnimacao() {
    desenharArena();
    if (ctx) desenharEscudos(ctx);

    if (efeitoCanvas) {
        desenharEfeitosVisuais(ctx, efeitoCanvas);
        if (!jogoPausado) {
            efeitoCanvas.tempo += 1;
            if (efeitoCanvas.tempo > 130) efeitoCanvas = null;
        }
    }

    if (ctx) atualizarEDesenharParticulas(ctx);

    idLoopAnimacao = requestAnimationFrame(loopAnimacao);
}

function desenharEscudos(contexto) {
    const tempoGeral = obterTempoArena() / 25;
    if (protecaoJogador > 0) desenharEscudoFaraday(contexto, 220, 275, tempoGeral, '#4da6ff');
    if (protecaoInimigo > 0) desenharEscudoFaraday(contexto, 740, 275, tempoGeral, '#e74c3c');
}

function desenharEscudoFaraday(contexto, x, y, tempo, cor) {
    contexto.save();
    contexto.translate(x, y);
    for (let anel = 1; anel <= 3; anel++) {
        contexto.save();
        contexto.rotate(tempo * 0.05 * anel * (anel % 2 === 0 ? 1 : -1));
        contexto.strokeStyle = cor;
        contexto.lineWidth = 3;
        contexto.globalAlpha = 0.7;
        contexto.shadowBlur = 15;
        contexto.shadowColor = cor;
        contexto.beginPath();
        contexto.rect(-35 * anel, -35 * anel, 70 * anel, 70 * anel);
        contexto.stroke();
        contexto.restore();
    }
    contexto.beginPath();
    contexto.arc(0, 0, 20 + Math.sin(tempo * 0.1) * 5, 0, Math.PI * 2);
    contexto.fillStyle = `rgba(255, 255, 255, 0.2)`;
    contexto.shadowBlur = 20;
    contexto.shadowColor = cor;
    contexto.fill();
    contexto.restore();
}

function desenharEfeitosVisuais(contexto, efeito) {
    if (!contexto || !canvas) return;
    contexto.save();

    if (efeito.isUlt) {
        contexto.fillStyle = `rgba(255, 255, 255, ${Math.max(0, 0.6 - efeito.tempo / 60)})`;
        contexto.fillRect(0, 0, canvas.width, canvas.height);

        contexto.save();
        contexto.translate(canvas.width / 2, canvas.height / 2);
        contexto.beginPath();
        contexto.arc(0, 0, efeito.tempo * 12, 0, Math.PI * 2);
        contexto.strokeStyle = `hsla(${(efeito.tempo * 10) % 360}, 100%, 70%, ${Math.max(0, 1 - efeito.tempo / 100)})`;
        contexto.lineWidth = Math.max(1, 40 - (efeito.tempo / 3));
        contexto.shadowBlur = 50;
        contexto.shadowColor = contexto.strokeStyle;
        contexto.stroke();
        contexto.restore();
    }

    const xOrigem = efeito.isEnemy ? 740 : 220;
    const xDestino = efeito.isEnemy ? 220 : 740;
    const dirX = efeito.isEnemy ? -1 : 1;
    const yBase = 275;

    if (efeito.tipo === 'lorentz') {
        const direcao = (efeito.params.desvio === 'cima') ? -1 : 1;
        const raioParticle = efeito.isUlt ? 22 : 12;
        const corParticle = efeito.isUlt ? '#ff00ff' : '#00ffff';

        for (let i = 0; i < 20; i++) {
            const tempoRastro = Math.max(0, efeito.tempo - i);
            if (tempoRastro === 0) continue;

            const xRastro = xOrigem + (tempoRastro * 6 * dirX);
            const yRastro = yBase + (direcao * Math.pow(tempoRastro, 2) * 0.04);

            contexto.beginPath();
            contexto.arc(xRastro, yRastro, Math.max(1, raioParticle - (i * 0.6)), 0, Math.PI * 2);
            contexto.fillStyle = corParticle;
            contexto.globalAlpha = Math.max(0, 1 - (i / 20));
            contexto.shadowBlur = i === 0 ? 30 : 0;
            contexto.shadowColor = corParticle;
            contexto.fill();
        }
        contexto.globalAlpha = 1.0;

    } else if (efeito.tipo === 'faraday') {
        contexto.translate(xOrigem + (dirX * efeito.tempo * 2.5), yBase);
        const corBase = efeito.isUlt ? '#00ffff' : '#f1c40f';

        for (let anel = 1; anel <= 3; anel++) {
            contexto.save();
            contexto.rotate(efeito.tempo * 0.08 * anel * (anel % 2 === 0 ? 1 : -1));
            contexto.strokeStyle = corBase;
            contexto.lineWidth = efeito.isUlt ? 5 : 2;
            contexto.shadowBlur = 20;
            contexto.shadowColor = corBase;
            contexto.globalAlpha = Math.max(0, 1 - (efeito.tempo / 120));
            contexto.beginPath();
            contexto.rect(-25 * anel, -25 * anel, 50 * anel, 50 * anel);
            contexto.stroke();
            contexto.restore();
        }
        contexto.beginPath();
        contexto.arc(0, 0, 10 + Math.sin(efeito.tempo * 0.2) * 8, 0, Math.PI * 2);
        contexto.fillStyle = '#fff';
        contexto.shadowBlur = 30;
        contexto.shadowColor = corBase;
        contexto.fill();

    } else if (efeito.tipo === 'ampere') {
        contexto.translate(xOrigem, yBase);
        const aneis = efeito.isUlt ? 6 : 4;
        const corAmpere = efeito.isUlt ? '255, 50, 255' : '255, 100, 100';

        for (let i = 0; i < aneis; i++) {
            const raio = ((efeito.tempo * 6) + (i * 45)) % 400;
            const alpha = Math.max(0, 1 - raio / 400);

            contexto.beginPath();
            contexto.ellipse(0, 0, raio / 2, raio, 0, 0, Math.PI * 2);
            contexto.strokeStyle = `rgba(${corAmpere}, ${alpha})`;
            contexto.lineWidth = efeito.isUlt ? 8 : 4;
            contexto.shadowBlur = 25;
            contexto.shadowColor = `rgb(${corAmpere})`;
            contexto.stroke();

            if (!jogoPausado && Math.random() > 0.5) {
                const angFaisca = Math.random() * Math.PI * 2;
                contexto.fillStyle = '#fff';
                contexto.fillRect(Math.cos(angFaisca) * (raio / 2), Math.sin(angFaisca) * raio, 4, 4);
            }
        }

    } else if (efeito.tipo === 'wilhelm') {
        const corVermelha = efeito.isUlt ? '#ff00ff' : '#ff3344';
        const corAzul = efeito.isUlt ? '#00ffff' : '#00e5ff';

        contexto.lineCap = 'round';
        contexto.lineJoin = 'miter';

        const linhas = [
            { cor: corAzul, desvioY: -20 },
            { cor: corVermelha, desvioY: 20 }
        ];

        linhas.forEach((linha, index) => {
            contexto.beginPath();
            contexto.moveTo(xOrigem, yBase);
            const segments = 12;
            const stepX = (xDestino - xOrigem) / segments;
            let currentX = xOrigem;
            let currentY = yBase + linha.desvioY;
            const maxSegments = Math.min(segments, Math.floor(efeito.tempo / 4));

            for (let i = 1; i <= maxSegments; i++) {
                currentX += stepX;
                const tremor = Math.sin(efeito.tempo * 0.4 + i + index) * 18;
                const yOffset = (i === segments) ? 0 : tremor;
                currentY = yBase + linha.desvioY + yOffset;
                contexto.lineTo(currentX, currentY);
            }

            contexto.shadowBlur = 25;
            contexto.shadowColor = linha.cor;
            contexto.lineWidth = efeito.isUlt ? 8 : 4;
            contexto.strokeStyle = linha.cor;
            contexto.stroke();

            if (maxSegments >= segments) {
                contexto.shadowBlur = 10;
                contexto.shadowColor = '#ffffff';
                contexto.lineWidth = 1.5;
                contexto.strokeStyle = '#ffffff';
                contexto.stroke();
            }
        });

    } else if (efeito.tipo === 'ohm') {
        const corRaio = efeito.isUlt ? '#00ffff' : '#ffff00';
        contexto.lineCap = 'round';
        contexto.lineJoin = 'miter';
        const qtdRaios = efeito.isUlt ? 3 : 1;
        const maxSegments = Math.min(10, Math.floor(efeito.tempo / 6));

        for (let r = 0; r < qtdRaios; r++) {
            contexto.beginPath();
            contexto.moveTo(xOrigem, yBase);
            const stepX = (xDestino - xOrigem) / 10;
            let currentX = xOrigem;
            let currentY = yBase;

            for (let i = 1; i <= maxSegments; i++) {
                currentX += stepX;
                const amplitude = (10 - i) * 12;
                const variacao = Math.sin(efeito.tempo * 0.8 + i * 2.3 + r) * amplitude;
                currentY = yBase + (i < 10 ? variacao : 0);
                contexto.lineTo(currentX, currentY);
            }
            contexto.shadowBlur = 40;
            contexto.shadowColor = corRaio;
            contexto.lineWidth = efeito.isUlt ? 10 : 5;
            contexto.strokeStyle = r === 0 ? '#ffffff' : corRaio;
            contexto.stroke();
        }
    }
    contexto.restore();
}

// CONTROLES DE PAUSA REAL (INTEGRADOS NO MODAL)

const modalPausa = document.getElementById('modal-pausa');
const tituloModalPausa = document.getElementById('titulo-modal-pausa');
const btnRetomar = document.getElementById('btn-retomar');
const btnModalRecomecar = document.getElementById('btn-modal-recomecar');
const btnModalConfig = document.getElementById('btn-modal-config');
const btnVoltarPausaConfig = document.getElementById('btn-voltar-pausa-config');
const menuPausaOpcoes = document.getElementById('menu-pausa-opcoes');
const pausaConfigOpcoes = document.getElementById('pausa-config-opcoes');
const confirmacaoSair = document.getElementById('confirmacao-sair');
const btnModalSair = document.getElementById('btn-modal-sair');
const btnConfirmaSairSim = document.getElementById('btn-confirma-sair-sim');
const btnConfirmaSairNao = document.getElementById('btn-confirma-sair-nao');
const btnPausa = document.getElementById('btn-pausa');

function abrirModalPausaPadrao() {
    definirEstadoPausa(true);
    atualizarBotoesAudioUI();
    if (tituloModalPausa) tituloModalPausa.innerText = "JOGO PAUSADO";
    if (menuPausaOpcoes) menuPausaOpcoes.classList.remove('hidden');
    if (pausaConfigOpcoes) pausaConfigOpcoes.classList.add('hidden');
    if (confirmacaoSair) confirmacaoSair.classList.add('hidden');
    if (modalPausa) modalPausa.classList.remove('hidden');
}

if (btnPausa) {
    btnPausa.addEventListener('click', () => {
        audioManager.tocarClique();
        abrirModalPausaPadrao();
    });
}

if (btnRetomar) {
    btnRetomar.addEventListener('click', () => {
        audioManager.tocarClique();
        definirEstadoPausa(false);
        if (modalPausa) modalPausa.classList.add('hidden');
    });
}

if (btnModalConfig) {
    btnModalConfig.addEventListener('click', () => {
        audioManager.tocarClique();
        atualizarBotoesAudioUI();
        if (tituloModalPausa) tituloModalPausa.innerText = "CONFIGURAÇÕES";
        if (menuPausaOpcoes) menuPausaOpcoes.classList.add('hidden');
        if (confirmacaoSair) confirmacaoSair.classList.add('hidden');
        if (pausaConfigOpcoes) pausaConfigOpcoes.classList.remove('hidden');
    });
}

if (btnVoltarPausaConfig) {
    btnVoltarPausaConfig.addEventListener('click', () => {
        audioManager.tocarClique();
        if (tituloModalPausa) tituloModalPausa.innerText = "JOGO PAUSADO";
        if (pausaConfigOpcoes) pausaConfigOpcoes.classList.add('hidden');
        if (menuPausaOpcoes) menuPausaOpcoes.classList.remove('hidden');
    });
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && telaJogo && !telaJogo.classList.contains('hidden')) {
        audioManager.tocarClique();
        if (!jogoPausado) {
            abrirModalPausaPadrao();
        } else {
            definirEstadoPausa(false);
            if (modalPausa) modalPausa.classList.add('hidden');
        }
    }
});

function recomecarPartida() {
    if (modalPausa) modalPausa.classList.add('hidden');
    definirEstadoPausa(false);
    if (jogadorAtual) iniciarBatalha(jogadorAtual);
}

if (btnModalRecomecar) {
    btnModalRecomecar.addEventListener('click', () => {
        audioManager.tocarClique();
        recomecarPartida();
    });
}

if (btnModalSair) {
    btnModalSair.addEventListener('click', () => {
        audioManager.tocarClique();
        if (tituloModalPausa) tituloModalPausa.innerText = "SAIR DA PARTIDA?";
        if (menuPausaOpcoes) menuPausaOpcoes.classList.add('hidden');
        if (pausaConfigOpcoes) pausaConfigOpcoes.classList.add('hidden');
        if (confirmacaoSair) confirmacaoSair.classList.remove('hidden');
    });
}

if (btnConfirmaSairNao) {
    btnConfirmaSairNao.addEventListener('click', () => {
        audioManager.tocarClique();
        if (tituloModalPausa) tituloModalPausa.innerText = "JOGO PAUSADO";
        if (confirmacaoSair) confirmacaoSair.classList.add('hidden');
        if (menuPausaOpcoes) menuPausaOpcoes.classList.remove('hidden');
    });
}

if (btnConfirmaSairSim) {
    btnConfirmaSairSim.addEventListener('click', () => {
        audioManager.tocarClique();
        if (confirmacaoSair) confirmacaoSair.classList.add('hidden');
        sairParaMenu();
    });
}

function sairParaMenu() {
    limparTimersBatalha();
    pararLoopAnimacaoArena();
    definirEstadoPausa(false);
    if (audioManager.pararDublagem) audioManager.pararDublagem();

    const splash = document.getElementById('splash-turno');
    if (splash) {
        splash.classList.remove('animar-splash');
        splash.classList.add('hidden');
    }

    if (modalPausa) modalPausa.classList.add('hidden');
    if (telaJogo) telaJogo.classList.add('hidden');
    if (telaFimJogo) telaFimJogo.classList.add('hidden');
    if (telaInicio) telaInicio.classList.remove('hidden');
    atualizarContadoresMenuInicio();
    if (audioManager.musicaAtivada) audioManager.iniciarBGM();
}

function voltarParaMenuDoFim() {
    audioManager.tocarClique();
    sairParaMenu();
}

// MODO CAMPANHA

let faseSelecionadaNoMapa = 1;

function abrirModoCampanha() {
    if (telaInicio) telaInicio.classList.add('hidden');
    const telaCampanha = document.getElementById('tela-campanha');
    if (telaCampanha) telaCampanha.classList.remove('hidden');
    faseSelecionadaNoMapa = progressoCampanhaSalvo.faseMax;
    renderizarMapaCampanhaArcade();
}

const coordenadasPedestaisMapa = {
    1: { left: '18.0%', top: '71.2%' },
    2: { left: '35.0%', top: '46.5%' },
    3: { left: '50.0%', top: '71.2%' },
    4: { left: '66.3%', top: '46.5%' },
    5: { left: '82.6%', top: '71.2%' }
};

function atualizarContadoresMenuInicio() {
    const elEstrelas = document.getElementById('menu-contador-estrelas');
    const elConquistas = document.getElementById('menu-contador-conquistas');

    if (elEstrelas) {
        let totalEstrelas = 0;
        for (let f = 1; f <= 5; f++) {
            totalEstrelas += (progressoCampanhaSalvo.estrelas[f] || 0);
        }
        elEstrelas.innerText = `${totalEstrelas} / 15`;
    }

    if (elConquistas) {
        const totalDesbloqueadas = Object.keys(conquistasSalvas).filter(k => conquistasSalvas[k]).length;
        elConquistas.innerText = `${totalDesbloqueadas} / 6`;
    }
}

setTimeout(atualizarContadoresMenuInicio, 150);

function gerarEstrelasImgHTML(qtdAtivas, classeTamanho = 'estrela-png-pedestal') {
    let html = '';
    for (let s = 1; s <= 3; s++) {
        const estado = s <= qtdAtivas ? 'on' : 'off';
        html += `<img src="assets/icon_estrelas.png" class="estrela-icone-png ${classeTamanho} ${estado}" alt="Estrela">`;
    }
    return html;
}

function renderizarMapaCampanhaArcade() {
    const gridContainer = document.getElementById('grid-fases-campanha');
    if (!gridContainer) return;
    gridContainer.innerHTML = '';

    const camadaEfeitos = document.createElement('div');
    camadaEfeitos.className = 'camada-efeitos-mapa-vivo';
    camadaEfeitos.innerHTML = `
        <div class="scanner-holografico-mapa"></div>
        <div class="fx-estrutura fx-vortice-ciclotron"></div>
        <div class="fx-estrutura fx-turbinas-usina"></div>
        <div class="fx-estrutura fx-calor-forja">
            <span class="brasa-mapa b1"></span>
            <span class="brasa-mapa b2"></span>
            <span class="brasa-mapa b3"></span>
        </div>
        <div class="fx-estrutura fx-aurora-boreal"></div>
        <div class="fx-estrutura fx-plasma-nucleo">
            <div class="onda-plasma-mapa o1"></div>
            <div class="onda-plasma-mapa o2"></div>
        </div>
        <span class="particula-mapa p1"></span>
        <span class="particula-mapa p2"></span>
        <span class="particula-mapa p3"></span>
        <span class="particula-mapa p4"></span>
        <span class="particula-mapa p5"></span>
        <span class="particula-mapa p6"></span>
    `;
    gridContainer.appendChild(camadaEfeitos);

    for (let i = 1; i <= 5; i++) {
        const idBoss = ordemChefesCampanha[i - 1];
        const dadosBoss = guardioesData.find(g => g.id === idBoss) || { nome: idBoss, retrato: `assets/${idBoss}.png` };
        const bioma = estagiosCampanha[i] || estagiosCampanha[1];
        const coord = coordenadasPedestaisMapa[i];
        const estaBloqueado = i > progressoCampanhaSalvo.faseMax;
        const estrelasFase = progressoCampanhaSalvo.estrelas[i] || 0;

        const node = document.createElement('div');
        node.className = `node-fase-card node-pedestal-mapa ${estaBloqueado ? 'bloqueado' : ''} ${i === 5 ? 'chefe' : ''} ${i === faseSelecionadaNoMapa ? 'selecionado' : ''}`;
        node.style.left = coord.left;
        node.style.top = coord.top;
        node.style.setProperty('--cor-setor', bioma.corTema);

        node.innerHTML = `
            <div class="anel-energia-pedestal"></div>
            <div class="avatar-container-node">
                <img src="${dadosBoss.retrato}" class="avatar-node-fase" alt="${dadosBoss.nome}">
                ${estaBloqueado ? '<img src="assets/cadeado.png" class="cadeado-overlay" alt="Bloqueado">' : ''}
            </div>
            <div class="placa-info-pedestal">
                <span class="numero-node">0${i}. ${dadosBoss.nome.toUpperCase()}</span>
                <div class="mini-estrelas-pedestal">
                    ${gerarEstrelasImgHTML(estrelasFase, 'estrela-png-pedestal')}
                </div>
            </div>
        `;

        if (!estaBloqueado) {
            node.addEventListener('click', () => {
                audioManager.tocarClique();
                faseSelecionadaNoMapa = i;
                renderizarMapaCampanhaArcade();
            });
        }

        gridContainer.appendChild(node);
    }

    const icoEstrela = `<img src="assets/icon_estrelas.png" class="estrela-icone-png estrela-png-legenda on" alt="★">`;
    const badgeEstrelasMapa = document.createElement('div');
    badgeEstrelasMapa.className = 'detalhe-estrelas-mapa-inferior';
    badgeEstrelasMapa.innerHTML = `
        <span class="grupo-legenda-estrela">${icoEstrela} Vencer</span>
        <span class="sep-estrela-mapa">•</span>
        <span class="grupo-legenda-estrela">${icoEstrela}${icoEstrela} ≥ 50% PV</span>
        <span class="sep-estrela-mapa">•</span>
        <span class="grupo-legenda-estrela">${icoEstrela}${icoEstrela}${icoEstrela} ≥ 85% PV</span>
    `;
    gridContainer.appendChild(badgeEstrelasMapa);

    atualizarPreviewFaseCampanha();
}

function atualizarPreviewFaseCampanha() {
    const idBoss = ordemChefesCampanha[faseSelecionadaNoMapa - 1];
    const dadosBoss = guardioesData.find(g => g.id === idBoss) || { nome: idBoss };
    const bioma = estagiosCampanha[faseSelecionadaNoMapa] || estagiosCampanha[1];

    const painelPreview = document.getElementById('painel-preview-fase');
    const txtNome = document.getElementById('preview-nome-fase');
    const txtDesc = document.getElementById('preview-desc-fase');

    if (painelPreview) {
        painelPreview.style.setProperty('--cor-setor-preview', bioma.corTema);
    }

    // Separa automaticamente o texto de Bônus e Penalidade para exibir na mesma caixa unificada
    const partesResumo = (bioma.efeitoResumo || "").split('|');
    const txtBonusLimpo = (partesResumo[0] || "").replace(/Bônus:\s*/i, '').trim();
    const txtNerfLimpo = (partesResumo[1] || "").replace(/Penalidade:\s*/i, '').trim();
    const simboloSentido = bioma.sentido === 'entrando' ? '⊗ Entrando' : '⊙ Saindo';

    if (txtNome) {
        txtNome.innerHTML = `
            <div class="cabecalho-dossie-setor">
                <span style="color:${bioma.corTema};">SETOR 0${faseSelecionadaNoMapa}: ${bioma.nomeCurto.toUpperCase()} — CHEFE: ${dadosBoss.nome.toUpperCase()}</span>
                <span class="badge-condicao-setor" style="color:${bioma.corTema};"> ${bioma.efeitoTitulo || 'ANOMALIA ATIVA'}</span>
            </div>
        `;
        txtNome.style.marginBottom = "0";
    }

    if (txtDesc) {
        txtDesc.innerHTML = `
            <div class="preview-fase-simplificado" style="gap: 6px;">
                <p class="lore-bioma-mapa">${bioma.lore}</p>
                <div class="barra-telemetria-unificada-mapa">
                    <div class="celula-telemetria-mapa">
                        <span class="tag-label-telemetria campo">CAMPO</span>
                        <span style="color:#00e5ff;">B = ${bioma.campoB} T (${simboloSentido})</span>
                    </div>
                    <div class="celula-telemetria-mapa">
                        <span class="tag-label-telemetria bonus">BÔNUS</span>
                        <span style="color:#2ecc71;">${txtBonusLimpo}</span>
                    </div>
                    <div class="celula-telemetria-mapa">
                        <span class="tag-label-telemetria nerf">PENALIDADE</span>
                        <span style="color:#ff8a80;">${txtNerfLimpo}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

const btnIniciarFase = document.getElementById('btn-iniciar-fase-selecionada');
if (btnIniciarFase) {
    btnIniciarFase.addEventListener('click', () => {
        if (faseSelecionadaNoMapa > progressoCampanhaSalvo.faseMax) return;
        audioManager.tocarClique();
        modoCampanhaAtivo = true;
        faseAtualCampanha = faseSelecionadaNoMapa;

        renderizarSelecao();
        document.getElementById('tela-campanha').classList.add('hidden');
        if (telaSelecao) telaSelecao.classList.remove('hidden');
    });
}

function obterInimigoCampanha(jogadorId) {
    const idInimigoFixo = ordemChefesCampanha[faseAtualCampanha - 1];
    if (idInimigoFixo === jogadorId) {
        const alternatives = guardioesData.filter(g => g.id !== jogadorId);
        return alternatives[0];
    }
    return guardioesData.find(g => g.id === idInimigoFixo) || guardioesData[0];
}

// REGISTROS DO LIVRO DE CAMPO (LORE & GALERIA)

const codexDados = {
    regras: {
        titulo: "COMO JOGAR",
        sub: "Guia Rápido do Sistema de Duelo e Modos de Jogo",
        isLore: false,
        conteudo: `
            <div class="codex-secao">
                <h4><img src="assets/atk.png" class="icone-hud" alt="Modos"> 1. MODOS DE JOGO: JOGO LIVRE VS CAMPANHA</h4>
                <p><strong>Jogo Livre (Sala de Combate):</strong> Modo de duelo customizado onde você escolhe o seu Guardião (Azul), seleciona qualquer Oponente (Vermelho) e escolhe livremente entre os <strong>5 Mapas da Arena</strong>. Cada cenário aplica suas próprias condições de Campo Magnético (intensidade B e sentido entrando/saindo).</p>
                <p><strong>Modo Campanha (Jornada do Fluxo):</strong> Aventura progressiva em 5 estágios rumo ao epicentro do Pulso de Œrsted. Enfrente os Guardiões em seus setores de origem com diálogos de história, conquistas exclusivas, avaliação de até 3 estrelas (★) e <strong>PV persistente</strong> entre as batalhas (recuperando parte da vida ao avançar de fase).</p>
            </div>
            <div class="codex-secao">
                <h4><img src="assets/pv.png" class="icone-hud" alt="PV"> 2. RECURSOS DO TURNO</h4>
                <p><strong>PV (Pontos de Vida):</strong> Zere os PVs do Guardião adversário para vencer o duelo.</p>
                <p><strong>EN (Energia):</strong> Você inicia com 10 EN e recupera +4 EN por turno para calibrar os parâmetros dos seus ataques ou usar o Descanso Tático.</p>
                <p><strong>ULT (Ultimato):</strong> Acerte as previsões físicas para acumular 3 cargas e liberar a Habilidade Especial devastadora do seu Guardião.</p>
            </div>
            <div class="codex-secao">
                <h4><img src="assets/ult.png" class="icone-hud" alt="Ult"> 3. SIMULADOR DE TELEMETRIA E PREVISÃO</h4>
                <p>Ao ajustar os controles no seu turno, observe o <strong>Simulador de Telemetria</strong> para verificar a potência estimada do golpe. Ao confirmar, responda corretamente à <strong>Previsão Física</strong> do fenômeno para garantir o impacto máximo!</p>
            </div>
        `
    },
    lore: {
        titulo: "O PULSO DE ŒRSTED & SETORES DA ARENA",
        sub: "A Origem dos Guardiões e os 5 Cenários Científicos",
        isLore: false,
        conteudo: `
            <div class="codex-secao">
                <h4>O FENÔMENO E A ARENA DE CAMPO</h4>
                <p>Uma anomalia eletromagnética sem precedentes — batizada de <strong>Pulso de Œrsted</strong> — atingiu a cidade. Aqueles expostos à tempestade despertaram a capacidade de manipular forças físicas reais do Eletromagnetismo e fundaram a <strong>Arena de Campo</strong>, adotando os codinomes dos pioneiros da física: Lorentz, Faraday, Ampère, Wilhelm (Weber) e Ohm.</p>
            </div>
            <div class="codex-secao">
                <h4>OS 5 CENÁRIOS DA ARENA DE CAMPO</h4>
                <div class="codex-grid-cenarios">
                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #00e5ff;">
                            <img src="assets/bg_ciclotron.png" alt="Ciclotron de Partículas">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #00e5ff;">1. CICLOTRON DE PARTÍCULAS</h5>
                                <span class="codex-sub-cenario">Guardião Responsável: LORENTZ (Fronteira Externa)</span>
                                <p>Um túnel de aceleração subatômica onde feixes de íons vagam em alta velocidade sob um campo magnético constante.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #00e5ff; color: #00e5ff;">Campo Local: B = 3 T (⊗ Entrando na Arena)</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #f1c40f;">
                            <img src="assets/bg_usina.png" alt="Usina de Indução">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #f1c40f;">2. USINA DE INDUÇÃO</h5>
                                <span class="codex-sub-cenario">Guardiã Responsável: FARADAY (Geradores de Fluxo Variável)</span>
                                <p>Enormes turbinas giram no coração energético da cidade. Aqui o campo magnético emerge do solo com força ampliada.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #f1c40f; color: #f1c40f;">Campo Local: B = 4 T (⊙ Saindo da Arena)</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #ff5252;">
                            <img src="assets/bg_forja.png" alt="Forja Ferro-Magnética">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #ff5252;">3. FORJA FERRO-MAGNÉTICA</h5>
                                <span class="codex-sub-cenario">Guardiã Responsável: AMPÈRE (Fundição de Núcleo Pesado)</span>
                                <p>Uma câmara industrial aquecida onde solenoides gigantescos e núcleos de ferro fundido multiplicam as linhas de força.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #ff5252; color: #ff5252;">Campo Local: B = 5 T (⊗ Entrando na Arena)</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #18ffff;">
                            <img src="assets/bg_boreal.png" alt="Observatório Boreal">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #18ffff;">4. OBSERVATÓRIO BOREAL</h5>
                                <span class="codex-sub-cenario">Guardião(ã) Responsável: WILHELM (Torre de Magnetometria de Weber)</span>
                                <p>No topo gelado da cidade, correntes atmosféricas criam auroras magnéticas que desorientam qualquer bússola comum.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #18ffff; color: #18ffff;">Campo Local: B = 3 T (⊙ Saindo da Arena)</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #e040fb;">
                            <img src="assets/bg_nucleo.png" alt="Núcleo de Alta Tensão">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #e040fb;">5. NÚCLEO DE ALTA TENSÃO</h5>
                                <span class="codex-sub-cenario">Guardiã Chefe: OHM (Epicentro do Pulso de Œrsted)</span>
                                <p>O reator mestre onde a anomalia começou. Descargas extremas de plasma testam o limite absoluto da Lei de Ohm.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #e040fb; color: #e040fb;">Campo Local: B = 6 T (⊗ Entrando na Arena)</span>
                        </div>
                    </div>
                </div>
            </div>
        `
    },
    lorentz: {
        titulo: "LORENTZ",
        sub: "Propulsor (Ataque)",
        isLore: true,
        spriteIcone: "assets/lorentz.png",
        spriteBody: "assets/lorentz_body.png",
        spriteAtk: "assets/lorentz_body_atk.png",
        conteudo: `
            <div class="codex-secao">
                <h4>FORÇA DE LORENTZ</h4>
                <p>Uma carga elétrica <i>q</i> em movimento com velocidade <i>v</i> dentro de um campo magnético <i>B</i> sofre uma força magnética perpendicular à sua trajetória.</p>
                <div class="equacao-box">F = |q| · v · B  |  r = v / B</div>
            </div>
            <div class="codex-secao">
                <h4>HABILIDADES</h4>
                <p><strong><img src="assets/atk.png" class="icone-hud" alt="Atk"> Disparo Curvo (Básica):</strong> Ajusta a carga (+/-) e a velocidade v. A força faz a partícula desviar em arco de raio r.</p>
                <p><strong><img src="assets/ult.png" class="icone-hud" alt="Ult"> Trilho de Força (ULT):</strong> Submete um condutor com corrente i a um ângulo θ em relação ao campo. Força máxima ocorre em θ = 90°.</p>
            </div>
        `
    },
    faraday: {
        titulo: "FARADAY",
        sub: "Indutora (Defesa)",
        isLore: true,
        spriteIcone: "assets/faraday.png",
        spriteBody: "assets/faraday_body.png",
        spriteAtk: "assets/faraday_body_atk.png",
        conteudo: `
            <div class="codex-secao">
                <h4>LEI DE FARADAY-LENZ</h4>
                <p>A variação do fluxo magnético (Φ = B · A · cos θ) através de uma espira induz uma corrente elétrica que gera um campo oposto à variação.</p>
                <div class="equacao-box">Φ = B · A · cos(θ)  |  ε = - ΔΦ / Δt</div>
            </div>
            <div class="codex-secao">
                <h4>HABILIDADES</h4>
                <p><strong><img src="assets/atk.png" class="icone-hud" alt="Atk"> Estratégia de Faraday (Básica):</strong> Ataca modulando Área A e Ângulo θ (gerando dano e até 35% de escudo induzido) ou ergue a Barreira de Lenz (65% de mitigação e +1 ULT).</p>
                <p><strong><img src="assets/ult.png" class="icone-hud" alt="Ult"> Gerador Manual (ULT):</strong> Gira a espira com velocidade ω e área A para disparar uma descarga massiva e erguer 30% de escudo.</p>
            </div>
        `
    },
    ampere: {
        titulo: "AMPÈRE",
        sub: "Magnetista (Controle)",
        isLore: true,
        spriteIcone: "assets/ampere.png",
        spriteBody: "assets/ampere_body.png",
        spriteAtk: "assets/ampere_body_atk.png",
        conteudo: `
            <div class="codex-secao">
                <h4>LEI DE AMPÈRE & SOLENOIDES</h4>
                <p>Uma corrente elétrica passando por espiras (N) gera um campo magnético proporcional ao produto N·i. A inserção de um núcleo de ferro multiplica essa intensidade.</p>
                <div class="equacao-box">B = μ · (N / L) · i  |  Núcleo: Ar (1x) ou Ferro (3x)</div>
            </div>
            <div class="codex-secao">
                <h4>HABILIDADES</h4>
                <p><strong><img src="assets/atk.png" class="icone-hud" alt="Atk"> Eletroímã (Básica):</strong> Modula N, i e o núcleo ferromagnético para causar alto dano e gerar 20% de blindagem.</p>
                <p><strong><img src="assets/ult.png" class="icone-hud" alt="Ult"> Inversão de Polaridade (ULT):</strong> Inverte o sentido da corrente nas espiras para alternar os Polos Norte/Sul e colapsar a arena.</p>
            </div>
        `
    },
    wilhelm: {
        titulo: "WILHELM",
        sub: "Polarizador (Controle)",
        isLore: true,
        spriteIcone: "assets/wilhelm.png",
        spriteBody: "assets/wilhelm_body.png",
        spriteAtk: "assets/wilhelm_body_atk.png",
        conteudo: `
            <div class="codex-secao">
                <h4>MAGNETOMETRIA DE WEBER & LEI DE BIOT-SAVART</h4>
                <p>Correntes elétricas em fios criam campos magnéticos circulares ao redor do condutor (B ∝ 1/r). Bússolas alinham-se tangencialmente às linhas desse campo.</p>
                <div class="equacao-box">B = μ₀ · i / (2π · r)  |  Força Dipolar: F ∝ 1 / d²</div>
            </div>
            <div class="codex-secao">
                <h4>HABILIDADES</h4>
                <p><strong><img src="assets/atk.png" class="icone-hud" alt="Atk"> Bússola (Básica):</strong> Posiciona agulhas na arena para triangular a posição exata de fios ocultos e desferir descargas precisas.</p>
                <p><strong><img src="assets/ult.png" class="icone-hud" alt="Ult"> Polos Opostos (ULT):</strong> Usa o Polo Norte para repulsão explosiva (1/d²) ou o Polo Sul para atrair e drenar +3 EN do oponente.</p>
            </div>
        `
    },
    ohm: {
        titulo: "OHM",
        sub: "Engenheiro (Defesa)",
        isLore: true,
        spriteIcone: "assets/ohm.png",
        spriteBody: "assets/ohm_body.png",
        spriteAtk: "assets/ohm_body_atk.png",
        conteudo: `
            <div class="codex-secao">
                <h4>LEI DE OHM E POTÊNCIA</h4>
                <p>A corrente em um circuito depende da resistência (R) escolhida sob fonte de 12 V. A potência dissipada converte-se em energia de ataque e blindagem.</p>
                <div class="equacao-box">i = V / R  |  P = V · i  |  Fusível: i ≤ 6 A</div>
            </div>
            <div class="codex-secao">
                <h4>HABILIDADES</h4>
                <p><strong><img src="assets/atk.png" class="icone-hud" alt="Atk"> Montar Circuito (Básica):</strong> Escolhe resistores de 1.5 Ω a 6 Ω para dosar entre sobrecarga ofensiva (i > 6 A) ou estabilidade com +25% de escudo.</p>
                <p><strong><img src="assets/ult.png" class="icone-hud" alt="Ult"> Curto Controlado (ULT):</strong> Reduz a resistência até 1 Ω para liberar descarga máxima (38 de dano) ou modula R para obter escudo/cura.</p>
            </div>
        `
    }
};

const metaFichasCodex = {
    lorentz: { pv: "100 PV", setor: "1. Ciclotron" },
    faraday: { pv: "110 PV", setor: "2. Usina de Indução" },
    ampere:  { pv: "100 PV", setor: "3. Forja Ferro-Magnética" },
    wilhelm: { pv: "85 PV",  setor: "4. Observatório Boreal" },
    ohm:     { pv: "95 PV",  setor: "5. Núcleo de Alta Tensão" }
};

function abrirCodex() {
    audioManager.tocarClique();
    const telaCodex = document.getElementById('tela-codex');
    if (telaInicio) telaInicio.classList.add('hidden');
    if (telaCodex) telaCodex.classList.remove('hidden');
    mudarAbaCodex('regras');
}

function mudarAbaCodex(chaveAba) {
    if (chaveAba === 'bobina') chaveAba = 'ampere';
    if (chaveAba === 'polaris') chaveAba = 'wilhelm';
    audioManager.tocarClique();

    const abas = document.querySelectorAll('.btn-aba-codex');
    abas.forEach(aba => aba.classList.remove('ativa'));
    
    const btnAtivo = Array.from(abas).find(b => {
        const dataAba = b.getAttribute('data-aba');
        const attrOnclick = b.getAttribute('onclick') || '';
        return dataAba === chaveAba || attrOnclick.includes(chaveAba);
    });
    if (btnAtivo) btnAtivo.classList.add('ativa');

    const container = document.getElementById('codex-conteudo');
    const dados = codexDados[chaveAba];
    
    if (container && dados) {
        if (dados.isLore) {
            const meta = metaFichasCodex[chaveAba] || { pv: "100 PV", setor: "Arena de Campo" };
            container.innerHTML = `
                <div class="codex-personagem-card">
                    <div class="codex-galeria-sprites">
                        <div class="codex-sprite-box">
                            <img src="${dados.spriteIcone}" class="codex-img-icone" alt="${dados.titulo} Ícone">
                        </div>
                        <div class="codex-sprite-box">
                            <img src="${dados.spriteBody}" alt="${dados.titulo} Original">
                        </div>
                        <div class="codex-sprite-box">
                            <img src="${dados.spriteAtk}" alt="${dados.titulo} Ataque">
                        </div>
                    </div>
                    <div class="codex-detalhes">
                        <h3 class="codex-titulo-guarda">${dados.titulo}</h3>
                        <div class="codex-ficha-badges">
                            <span class="badge-ficha-codex"><img src="assets/icon_classe.png" class="icone-hud" alt="Classe"> ${dados.sub}</span>
                            <span class="badge-ficha-codex pv"><img src="assets/pv.png" class="icone-hud" alt="PV"> ${meta.pv}</span>
                            <span class="badge-ficha-codex setor"><img src="assets/icon_local.png" class="icone-hud" alt="Local"> ${meta.setor}</span>
                        </div>
                        ${dados.conteudo}
                    </div>
                </div>
            `;
        } else {
            container.innerHTML = `
                <h3 class="codex-titulo-guarda">${dados.titulo}</h3>
                <div class="codex-sub">${dados.sub}</div>
                ${dados.conteudo}
            `;
        }
    }
}

const btnCodex = document.getElementById('btn-codex');
if (btnCodex) btnCodex.addEventListener('click', abrirCodex);

const btnVoltarCodex = document.getElementById('btn-voltar-codex');
if (btnVoltarCodex) {
    btnVoltarCodex.addEventListener('click', () => {
        audioManager.tocarClique();
        document.getElementById('tela-codex').classList.add('hidden');
        if (telaInicio) telaInicio.classList.remove('hidden');
    });
}

// CONQUISTAS DA CAMPANHA

const listaConquistas = [
    { id: 'lorentz_master', titulo: 'Mestre da Força de Lorentz', desc: 'Acertou 5 previsões seguidas com Lorentz!', boss: 'lorentz' },
    { id: 'faraday_shield', titulo: 'Mestre da Indução', desc: 'Concluiu a Arena de Faraday!', boss: 'faraday' },
    { id: 'ampere_master', titulo: 'Campo de Ampère', desc: 'Concluiu a Arena de Ampère!', boss: 'ampere' },
    { id: 'wilhelm_master', titulo: 'Fluxo de Weber', desc: 'Concluiu a Arena de Wilhelm!', boss: 'wilhelm' },
    { id: 'ohm_flawless', titulo: 'Curto-Circuito Perfeito', desc: 'Venceu o Ohm sem sofrer dano da Ult!', boss: 'ohm' },
    { id: 'mestre_fluxo', titulo: 'Mestre Supremo do Fluxo', desc: 'Zerou a Campanha e estabilizou o Pulso de Œrsted!', boss: 'ohm' }
];

function renderizarConquistas() {
    const container = document.getElementById('lista-conquistas-container');
    if (!container) return;
    container.innerHTML = '';

    listaConquistas.forEach(c => {
        const foiDesbloqueada = !!conquistasSalvas[c.id];
        const dadosBoss = guardioesData.find(g => g.id === c.boss) || { retrato: `assets/${c.boss}.png` };
        
        const card = document.createElement('div');
        card.className = `card-conquista-item ${foiDesbloqueada ? 'desbloqueada' : 'bloqueada'}`;
        card.innerHTML = `
            <img src="${dadosBoss.retrato}" class="avatar-conquista-boss" alt="${c.boss}">
            <div class="info-conquista-detalhes">
                <span class="titulo-conquista-card">${c.titulo.toUpperCase()}</span>
                <span class="desc-conquista-card">${c.desc}</span>
            </div>
            <img src="${foiDesbloqueada ? 'assets/trofeu.png' : 'assets/cadeado.png'}" class="badge-status-conquista" alt="${foiDesbloqueada ? 'Concluído' : 'Bloqueado'}">
        `;
        container.appendChild(card);
    });
}

const btnAbrirConquistas = document.getElementById('btn-abrir-conquistas');
const btnFecharConquistas = document.getElementById('btn-fechar-conquistas');
const modalConquistas = document.getElementById('modal-conquistas');

if (btnAbrirConquistas) {
    btnAbrirConquistas.addEventListener('click', () => {
        audioManager.tocarClique();
        renderizarConquistas();
        if (modalConquistas) modalConquistas.classList.remove('hidden');
    });
}

if (btnFecharConquistas) {
    btnFecharConquistas.addEventListener('click', () => {
        audioManager.tocarClique();
        if (modalConquistas) modalConquistas.classList.add('hidden');
    });
}

// CONTROLE DE RESET DE PROGRESSO

const btnResetProgresso = document.getElementById('btn-reset-progresso');
const modalConfirmReset = document.getElementById('modal-confirm-reset');
const btnConfirmResetSim = document.getElementById('btn-confirm-reset-sim');
const btnConfirmResetNao = document.getElementById('btn-confirm-reset-nao');

if (btnResetProgresso) {
    btnResetProgresso.addEventListener('click', () => {
        audioManager.tocarClique();
        if (modalConfirmReset) modalConfirmReset.classList.remove('hidden');
    });
}

if (btnConfirmResetNao) {
    btnConfirmResetNao.addEventListener('click', () => {
        audioManager.tocarClique();
        if (modalConfirmReset) modalConfirmReset.classList.add('hidden');
    });
}

if (btnConfirmResetSim) {
    btnConfirmResetSim.addEventListener('click', () => {
        audioManager.tocarClique();
        
        localStorage.removeItem('guardioes_conquistas');
        localStorage.removeItem('guardioes_campanha');
        
        for (let key in conquistasSalvas) {
            delete conquistasSalvas[key];
        }
        progressoCampanhaSalvo.faseMax = 1;
        progressoCampanhaSalvo.estrelas = {};

        if (modalConfirmReset) modalConfirmReset.classList.add('hidden');
        atualizarContadoresMenuInicio();
        
        const toast = document.getElementById('toast-conquista');
        const descEl = document.getElementById('nome-conquista-toast');
        if (toast && descEl) {
            descEl.innerText = "RESET COMPLETO: Progresso e Conquistas apagados!";
            toast.classList.remove('hidden');
            setTimeout(() => toast.classList.add('hidden'), 3500);
        }
    });
}

// =========================================================
// MELHORIA QoL 1: REVANCHE RÁPIDA vs TROCAR GUARDIÃO NO FIM
// =========================================================
(function configurarBotoesFimDeJogoQoL() {
    const containerFim = document.getElementById('menu-botoes-fim');
    const btnNovamente = document.getElementById('btn-jogar-novamente');
    if (!containerFim || !btnNovamente) return;

    // Cria o botão extra "TROCAR GUARDIÃO" se ainda não existir
    let btnTrocar = document.getElementById('btn-trocar-guardiao-fim');
    if (!btnTrocar) {
        btnTrocar = document.createElement('button');
        btnTrocar.id = 'btn-trocar-guardiao-fim';
        btnTrocar.type = 'button';
        btnTrocar.className = 'btn-retro';
        btnTrocar.innerText = 'TROCAR GUARDIÃO';
        containerFim.insertBefore(btnTrocar, document.getElementById('btn-voltar-menu-fim'));

        btnTrocar.addEventListener('click', () => {
            audioManager.tocarClique();
            if (audioManager.pararDublagem) audioManager.pararDublagem();
            if (telaFimJogo) telaFimJogo.classList.add('hidden');
            renderizarSelecao();
            if (telaSelecao) telaSelecao.classList.remove('hidden');
            if (audioManager.musicaAtivada) audioManager.iniciarBGM();
        });
    }

    // Substitui o comportamento de "JOGAR NOVAMENTE" para fazer Revanche Imediata na Arena!
    const novoBtnRevanche = btnNovamente.cloneNode(true);
    novoBtnRevanche.innerText = 'REVANCHE RÁPIDA';
    btnNovamente.parentNode.replaceChild(novoBtnRevanche, btnNovamente);

    novoBtnRevanche.addEventListener('click', () => {
        audioManager.tocarClique();
        if (audioManager.pararDublagem) audioManager.pararDublagem();
        if (telaFimJogo) telaFimJogo.classList.add('hidden');

        if (jogadorAtual) {
            // Na campanha, se perdeu na fase > 1, garante pelo menos 60% do PV ou o PV persistente daquela fase
            if (modoCampanhaAtivo && pvPersistenteJogador <= 0) {
                pvPersistenteJogador = jogadorAtual.pv;
            }
            iniciarBatalha(jogadorAtual);
            if (audioManager.musicaAtivada) audioManager.iniciarBGM();
        } else {
            renderizarSelecao();
            if (telaSelecao) telaSelecao.classList.remove('hidden');
        }
    });
})();

// =========================================================
// MELHORIA QoL 2: CENTRAL DE ATALHOS DE TECLADO ARCADE
// =========================================================
document.addEventListener('keydown', (e) => {
    // Ignora se estiver digitando em algum campo de texto
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName) && e.key !== 'Enter') {
        return;
    }

    // 1. TELA DE TÍTULO: Enter ou Espaço inicia
    if (telaTitulo && !telaTitulo.classList.contains('hidden')) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            btnComecarTitulo?.click();
        }
        return;
    }

    // 2. CUTSCENE DE DIÁLOGO: Enter ou Espaço avança fala
    const modalCutscene = document.getElementById('modal-cutscene');
    if (modalCutscene && !modalCutscene.classList.contains('hidden')) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            document.getElementById('btn-avancar-dialogo')?.click();
        }
        return;
    }

    // 3. TELA DE BATALHA (Quando não está pausado e é a vez do jogador)
    if (telaJogo && !telaJogo.classList.contains('hidden') && !jogoPausado && turnoDoJogador) {
        // FASE 1: Menu de Comandos Pokémon (1 = Básico, 2 = ULT, 3 = Descansar)
        if (faseAtual === 1) {
            if (e.key === '1') {
                e.preventDefault();
                btnCmdBasico?.click();
            } else if (e.key === '2' && btnCmdUlt && !btnCmdUlt.disabled) {
                e.preventDefault();
                btnCmdUlt.click();
            } else if (e.key === '3') {
                e.preventDefault();
                btnCmdDescansar?.click();
            }
        }
        // FASE 3: Calibragem de Parâmetros (Enter = Confirmar, Backspace/Q = Voltar)
        else if (faseAtual === 3) {
            if (e.key === 'Enter' && btnConfirmar && !btnConfirmar.disabled) {
                e.preventDefault();
                btnConfirmar.click();
            } else if (e.key === 'Backspace' || e.key.toLowerCase() === 'q') {
                e.preventDefault();
                btnVoltarComandos?.click();
            } else if (jogadorAtual?.id === 'faraday' && !modoUltimatoSelecionado) {
                if (e.key === '1') escolherAcaoFaraday('atacar');
                if (e.key === '2') escolherAcaoFaraday('defender');
            }
        }
        // FASE 4: Pergunta de Previsão Física (1 = Opção 1, 2 = Opção 2)
        else if (faseAtual === 4) {
            const botoesPrev = document.querySelectorAll('#botoes-previsao .btn-previsao');
            if (e.key === '1' && botoesPrev[0]) {
                e.preventDefault();
                botoesPrev[0].click();
            } else if (e.key === '2' && botoesPrev[1]) {
                e.preventDefault();
                botoesPrev[1].click();
            }
        }
    }
});

// =========================================================
// CONTROLES DESLIZANTES DE VOLUME (SFX E BGM) + TEMA DO BOSS
// =========================================================
(function conectarSlidersDeVolumeUI() {
    if (typeof audioManager === 'undefined') return;

    function criarBlocoSliderHTML(tipo, idInput, idTextoPct) {
        const valorInicial = Math.round((tipo === 'sfx' ? audioManager.volumeSfx : audioManager.volumeBgm) * 100);
        const wrapper = document.createElement('div');
        wrapper.className = 'box-slider-volume';
        wrapper.innerHTML = `
            <div class="topo-slider-volume">
                <span>Volume ${tipo.toUpperCase()}:</span>
                <span id="${idTextoPct}" class="valor-pct-volume">${valorInicial}%</span>
            </div>
            <input type="range" id="${idInput}" class="input-slider-volume" min="0" max="100" step="5" value="${valorInicial}">
        `;
        return wrapper;
    }

    function sincronizarSlidersUI() {
        const pctSfx = Math.round((audioManager.somAtivado ? audioManager.volumeSfx : 0) * 100);
        const pctBgm = Math.round((audioManager.musicaAtivada ? audioManager.volumeBgm : 0) * 100);

        ['slider-sfx-config', 'slider-sfx-pausa'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = pctSfx;
        });
        ['txt-pct-sfx-config', 'txt-pct-sfx-pausa'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `${pctSfx}%`;
        });

        ['slider-bgm-config', 'slider-bgm-pausa'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = pctBgm;
        });
        ['txt-pct-bgm-config', 'txt-pct-bgm-pausa'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerText = `${pctBgm}%`;
        });

        audioManager.atualizarVolumeBGM();
    }

    const pares = [
        { btnId: 'btn-toggle-sfx', tipo: 'sfx', sliderId: 'slider-sfx-config', txtId: 'txt-pct-sfx-config' },
        { btnId: 'btn-toggle-bgm', tipo: 'bgm', sliderId: 'slider-bgm-config', txtId: 'txt-pct-bgm-config' },
        { btnId: 'btn-pausa-sfx',  tipo: 'sfx', sliderId: 'slider-sfx-pausa',  txtId: 'txt-pct-sfx-pausa' },
        { btnId: 'btn-pausa-bgm',  tipo: 'bgm', sliderId: 'slider-bgm-pausa',  txtId: 'txt-pct-bgm-pausa' }
    ];

    pares.forEach(({ btnId, tipo, sliderId, txtId }) => {
        const btn = document.getElementById(btnId);
        if (!btn || !btn.parentElement || document.getElementById(sliderId)) return;

        const sliderBox = criarBlocoSliderHTML(tipo, sliderId, txtId);
        btn.parentElement.appendChild(sliderBox);

        const inputEl = document.getElementById(sliderId);
        inputEl.addEventListener('input', (e) => {
            const novoPct = parseInt(e.target.value, 10) || 0;
            if (tipo === 'sfx') {
                audioManager.definirVolumeSfx(novoPct / 100);
            } else {
                audioManager.definirVolumeBgm(novoPct / 100);
            }
            atualizarBotoesAudioUI();
            sincronizarSlidersUI();
        });
    });

    [btnToggleSfx, btnPausaSfx, btnToggleBgm, btnPausaBgm].forEach(btn => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (audioManager.somAtivado && audioManager.volumeSfx <= 0.01) audioManager.volumeSfx = 0.80;
            if (audioManager.musicaAtivada && audioManager.volumeBgm <= 0.01) audioManager.volumeBgm = 0.70;
            audioManager.atualizarVolumeBGM();
            audioManager.salvarConfig();
            sincronizarSlidersUI();
        });
    });

    // Ativa o tema acelerado do Boss Final quando lutar no Mapa 5 (Núcleo) ou contra Ohm
    const iniciarBatalhaOrig = iniciarBatalha;
    iniciarBatalha = function(guardiaoEscolhido) {
        iniciarBatalhaOrig(guardiaoEscolhido);
        audioManager.inicializar();
        audioManager.modoBossAtivo = (estagioCenarioAtual === 5) || (inimigoAtual && inimigoAtual.id === 'ohm');
        if (audioManager.musicaAtivada) {
            audioManager.iniciarBGM();
        }
    };

    const sairParaMenuOrig = sairParaMenu;
    sairParaMenu = function() {
        audioManager.modoBossAtivo = false;
        sairParaMenuOrig();
    };

    atualizarBotoesAudioUI();
    sincronizarSlidersUI();
})();

// =========================================================
// MÓDULO FINAL: BOTÃO COMEÇAR, CONQUISTAS LATERAIS,
// ÁRVORE RPG NO CODEX, TELEMETRIA E MANUAL ATUALIZADO
// =========================================================
(function inicializarExpansaoRPGEManual() {
    const CHAVE_DOMINIO = 'guardioes_dominio_fisico';
    const CHAVE_UPGRADES = 'guardioes_upgrades_rpg';

    let dominioSalvo = JSON.parse(localStorage.getItem(CHAVE_DOMINIO) || '{}');
    let upgradesSalvos = JSON.parse(localStorage.getItem(CHAVE_UPGRADES) || '{}');

    // Catálogo dos 3 Módulos RPG disponíveis para cada Guardião
    const CATALOGO_MODULOS_RPG = [
        {
            id: 'capacitor_pv',
            nome: '1. CAPACITOR DE SAFIRA',
            desc: 'Aumenta a integridade do circuito em +15 PV Máximo.',
            custo: 1
        },
        {
            id: 'bobina_dano',
            nome: '2. BOBINA SUPERCONDUTORA',
            desc: 'Adiciona +3 de Dano Eletromagnético em todos os ataques acertados.',
            custo: 1
        },
        {
            id: 'reator_oersted',
            nome: '3. REATOR DE ŒRSTED',
            desc: 'Inicia a batalha com +1 Carga de ULT pronta e +10% em Escudos.',
            custo: 1
        }
    ];

    // Calcula os bônus ativos do Guardião escolhido pelo jogador
    window.obterBonusUpgradeGuardiao = function(idGuardiao) {
        const lista = upgradesSalvos[idGuardiao] || [];
        return {
            pvExtra: lista.includes('capacitor_pv') ? 15 : 0,
            danoExtra: lista.includes('bobina_dano') ? 3 : 0,
            focoInicial: lista.includes('reator_oersted') ? 1 : 0,
            escudoExtra: lista.includes('reator_oersted') ? 0.10 : 0
        };
    };

    function obterPontosCalibracaoTotais(idGuardiao) {
        const reg = dominioSalvo[idGuardiao] || { acertos: 0, tentativas: 0 };
        // Ganha 1 PC aos 3 acertos (30%), 2 PC aos 6 acertos (60%) e 3 PC aos 10 acertos (100%)
        if (reg.acertos >= 10) return 3;
        if (reg.acertos >= 6) return 2;
        if (reg.acertos >= 3) return 1;
        return 0;
    }

    // ---------------------------------------------------------
    // 1. BOTÃO "COMEÇAR COMBATE" NA SALA DE COMBATE
    // ---------------------------------------------------------
    function instalarBotaoComecarSelecao() {
        const btnVoltar = document.getElementById('btn-voltar-inicio');
        if (!btnVoltar || document.getElementById('btn-comecar-combate-selecao')) return;

        const rodape = document.createElement('div');
        rodape.className = 'rodape-botoes-selecao';
        btnVoltar.parentNode.insertBefore(rodape, btnVoltar);

        const btnComecar = document.createElement('button');
        btnComecar.id = 'btn-comecar-combate-selecao';
        btnComecar.type = 'button';
        btnComecar.className = 'btn-retro';
        btnComecar.innerText = 'COMEÇAR';
        btnComecar.disabled = true;

        rodape.appendChild(btnVoltar);
        rodape.appendChild(btnComecar);

        btnComecar.addEventListener('click', () => {
            const pronto = modoCampanhaAtivo
                ? !!guardiaoSelecionadoP1
                : !!(guardiaoSelecionadoP1 && guardiaoSelecionadoCPU && mapaSelecionadoLivre);
            if (!pronto) return;

            audioManager.tocarClique();
            if (modoCampanhaAtivo) {
                const bonus = window.obterBonusUpgradeGuardiao(guardiaoSelecionadoP1.id);
                if (faseAtualCampanha === 1) {
                    pvPersistenteJogador = guardiaoSelecionadoP1.pv + bonus.pvExtra;
                }
                const boss = obterInimigoCampanha(guardiaoSelecionadoP1.id);
                iniciarCutsceneCampanha(faseAtualCampanha, guardiaoSelecionadoP1, boss, () => {
                    iniciarBatalha(guardiaoSelecionadoP1);
                });
            } else {
                iniciarBatalha(guardiaoSelecionadoP1);
            }
        });
    }

    window.atualizarEstadoBotaoComecarSelecao = function() {
        const btnComecar = document.getElementById('btn-comecar-combate-selecao');
        if (!btnComecar) return;
        const pronto = modoCampanhaAtivo
            ? !!guardiaoSelecionadoP1
            : !!(guardiaoSelecionadoP1 && guardiaoSelecionadoCPU && mapaSelecionadoLivre);
        btnComecar.disabled = !pronto;
    };

    instalarBotaoComecarSelecao();

    // ---------------------------------------------------------
    // 2. DASHBOARD TÁTICO DA CAMPANHA (CONQUISTAS INTEGRADAS À ESQUERDA)
    // ---------------------------------------------------------
    function montarDashboardCampanhaIntegrado() {
        const containerCampanha = document.querySelector('#tela-campanha .mapa-campanha-arcade');
        const gridMapa = document.getElementById('grid-fases-campanha');
        const painelPreview = document.getElementById('painel-preview-fase');
        const btnConq = document.getElementById('btn-abrir-conquistas');
        const modalConq = document.getElementById('modal-conquistas');

        if (!containerCampanha || !gridMapa || !painelPreview) return;

        // Oculta o botão antigo de Conquistas e o modal flutuante, pois agora o painel faz parte da tela!
        if (btnConq) btnConq.classList.add('hidden');
        if (modalConq) modalConq.classList.add('hidden');

        if (!document.getElementById('painel-conquistas-integrado')) {
            containerCampanha.classList.add('dashboard-campanha-grid');

            // Cria a Coluna Esquerda: Painel Permanente de Conquistas
            const colEsquerda = document.createElement('div');
            colEsquerda.id = 'painel-conquistas-integrado';
            colEsquerda.className = 'painel-conquistas-campanha-integrado';
            colEsquerda.innerHTML = `
                <div class="topo-conquistas-integrado">
                    <span class="titulo-conquistas-integrado">
                        <img src="assets/icon_conquistas.png" alt="Troféu"> CONQUISTAS
                    </span>
                    <span id="contador-conq-campanha" class="contador-conquistas-integrado">0 / 6</span>
                </div>
                <div id="lista-conquistas-campanha-fixa" class="lista-conquistas-lateral"></div>
            `;

            // Cria a Coluna Direita: Mapa + Dossiê Unificado da Fase
            const colDireita = document.createElement('div');
            colDireita.className = 'coluna-direita-mapa-campanha';

            containerCampanha.insertBefore(colEsquerda, gridMapa);
            colDireita.appendChild(gridMapa);
            colDireita.appendChild(painelPreview);
            containerCampanha.appendChild(colDireita);
        }

        atualizarPainelConquistasIntegrado();
    }

    function atualizarPainelConquistasIntegrado() {
        const listaFixa = document.getElementById('lista-conquistas-campanha-fixa');
        const contadorEl = document.getElementById('contador-conq-campanha');
        if (!listaFixa || typeof listaConquistas === 'undefined') return;

        listaFixa.innerHTML = '';
        let qtdDesbloqueadas = 0;

        listaConquistas.forEach(c => {
            const foiDesbloqueada = !!conquistasSalvas[c.id];
            if (foiDesbloqueada) qtdDesbloqueadas++;
            const dadosBoss = guardioesData.find(g => g.id === c.boss) || { retrato: `assets/${c.boss}.png` };

            const card = document.createElement('div');
            card.className = `card-conquista-item ${foiDesbloqueada ? 'desbloqueada' : 'bloqueada'}`;
            card.innerHTML = `
                <img src="${dadosBoss.retrato}" class="avatar-conquista-boss" alt="${c.boss}">
                <div class="info-conquista-detalhes">
                    <span class="titulo-conquista-card">${c.titulo.toUpperCase()}</span>
                    <span class="desc-conquista-card">${c.desc}</span>
                </div>
                <img src="${foiDesbloqueada ? 'assets/trofeu.png' : 'assets/cadeado.png'}" class="badge-status-conquista" alt="Status">
            `;
            listaFixa.appendChild(card);
        });

        if (contadorEl) {
            contadorEl.innerText = `${qtdDesbloqueadas} / ${listaConquistas.length}`;
        }
    }

    // Atualiza o painel integrado sempre que abrir a tela de campanha ou desbloquear uma conquista
    const abrirModoCampanhaBase = abrirModoCampanha;
    window.abrirModoCampanha = function() {
        abrirModoCampanhaBase();
        montarDashboardCampanhaIntegrado();
    };

    const desbloquearConquistaBase = desbloquearConquista;
    window.desbloquearConquista = function(id, titulo, descricao) {
        desbloquearConquistaBase(id, titulo, descricao);
        atualizarPainelConquistasIntegrado();
    };

    montarDashboardCampanhaIntegrado();

    // ---------------------------------------------------------
    // 3. INTEGRAÇÃO DOS UPGRADES RPG E TELEMETRIA NA BATALHA
    // ---------------------------------------------------------
    let estatisticasPartida = {
        tentativas: 0,
        acertos: 0,
        danoTotalCausado: 0,
        ultsLancadas: 0
    };

    function salvarDominioGuardiao(idGuardiao, acertou) {
        if (!idGuardiao) return;
        if (!dominioSalvo[idGuardiao]) {
            dominioSalvo[idGuardiao] = { acertos: 0, tentativas: 0 };
        }
        dominioSalvo[idGuardiao].tentativas += 1;
        if (acertou) dominioSalvo[idGuardiao].acertos += 1;
        localStorage.setItem(CHAVE_DOMINIO, JSON.stringify(dominioSalvo));
    }

    const iniciarBatalhaBase = iniciarBatalha;
    iniciarBatalha = function(guardiaoEscolhido) {
        estatisticasPartida = { tentativas: 0, acertos: 0, danoTotalCausado: 0, ultsLancadas: 0 };
        const boxAntigo = document.getElementById('box-relatorio-cientifico-fim');
        if (boxAntigo) boxAntigo.remove();

        iniciarBatalhaBase(guardiaoEscolhido);

        // Aplica os Módulos RPG instalados para o Guardião do Jogador
        if (jogadorAtual) {
            const bonus = window.obterBonusUpgradeGuardiao(jogadorAtual.id);
            const listaAtivos = [];

            if (bonus.pvExtra > 0) {
                maxPvJogador = jogadorAtual.pv + bonus.pvExtra;
                let pvInicial = maxPvJogador;
                if (modoCampanhaAtivo && faseAtualCampanha > 1) {
                    pvInicial = Math.min(maxPvJogador, pvPersistenteJogador);
                }
                document.getElementById('pv-jogador').innerText = pvInicial;
                listaAtivos.push(`+${bonus.pvExtra} PV Máx`);
            }

            if (bonus.focoInicial > 0) {
                document.getElementById('foco-jogador').innerText = String(bonus.focoInicial);
                listaAtivos.push(`+${bonus.focoInicial} ULT Inicial & +10% Escudo`);
            }

            if (bonus.danoExtra > 0) {
                listaAtivos.push(`+${bonus.danoExtra} Dano Bobina`);
            }

            if (listaAtivos.length > 0) {
                adicionarLog(`[Módulos RPG de ${jogadorAtual.nome}]: ${listaAtivos.join(' | ')}`, 'jogador');
            }
            atualizarHUD();
        }
    };

    const executarAtaqueBase = window.executarAtaque || executarAtaque;
    window.executarAtaque = function(previsaoJogador) {
        const pvInimigoAntes = parseInt(document.getElementById('pv-inimigo')?.innerText || "0", 10);
        const protInimigoAntes = protecaoInimigo;
        const focoAntes = parseInt(document.getElementById('foco-jogador')?.innerText || "0", 10);
        const eraUlt = modoUltimatoSelecionado && focoAntes >= 3;

        let acertouPergunta = false;
        if (eraUlt) {
            acertouPergunta = perguntaDinamicaUltAtual ? (previsaoJogador === perguntaDinamicaUltAtual.correta) : true;
        } else {
            acertouPergunta = perguntaDinamicaAtual ? (previsaoJogador === perguntaDinamicaAtual.correta) : true;
        }

        executarAtaqueBase(previsaoJogador);

        // Aplica bônus RPG de Dano (+3) e Escudo (+10%) do Guardião se houve acerto
        if (jogadorAtual) {
            const bonus = window.obterBonusUpgradeGuardiao(jogadorAtual.id);
            const pvDepoisBase = parseInt(document.getElementById('pv-inimigo')?.innerText || "0", 10);
            const causouDano = pvDepoisBase < pvInimigoAntes;

            if (causouDano && bonus.danoExtra > 0) {
                const extraMitigado = protInimigoAntes > 0
                    ? Math.max(1, Math.round(bonus.danoExtra * (1 - protInimigoAntes)))
                    : bonus.danoExtra;
                const novoPvI = Math.max(0, pvDepoisBase - extraMitigado);
                document.getElementById('pv-inimigo').innerText = novoPvI;
                criarTextoFlutuante(`+${extraMitigado} RPG`, false, "dano");
            }

            if (protecaoJogador > 0 && bonus.escudoExtra > 0) {
                protecaoJogador = Math.min(0.85, Number((protecaoJogador + bonus.escudoExtra).toFixed(2)));
            }
            atualizarHUD();
        }

        const pvInimigoFinal = parseInt(document.getElementById('pv-inimigo')?.innerText || "0", 10);
        const danoCausado = Math.max(0, pvInimigoAntes - pvInimigoFinal);

        estatisticasPartida.tentativas += 1;
        if (acertouPergunta) estatisticasPartida.acertos += 1;
        if (eraUlt) estatisticasPartida.ultsLancadas += 1;
        estatisticasPartida.danoTotalCausado += danoCausado;

        if (jogadorAtual) {
            salvarDominioGuardiao(jogadorAtual.id, acertouPergunta);
        }
    };

    // Relatório Científico na Tela de Fim de Jogo
    function calcularRankCientifico(pctAcerto, tentativas, venceu) {
        if (tentativas === 0) return { letra: "B", titulo: "OBSERVADOR", cor: "#4da6ff" };
        if (pctAcerto >= 90 && venceu) return { letra: "S", titulo: "NOBEL DE FÍSICA", cor: "#f1c40f" };
        if (pctAcerto >= 75) return { letra: "A", titulo: "PESQUISADOR SÊNIOR", cor: "#2ecc71" };
        if (pctAcerto >= 50) return { letra: "B", titulo: "TÉCNICO DE CAMPO", cor: "#4da6ff" };
        return { letra: "C", titulo: "APRENDIZ DE LABORATÓRIO", cor: "#e67e22" };
    }

    function renderizarRelatorioNaTelaFim() {
        const telaFim = document.getElementById('tela-fim-jogo');
        const botoesFim = document.getElementById('menu-botoes-fim');
        if (!telaFim || !botoesFim) return;

        let painelRel = document.getElementById('box-relatorio-cientifico-fim');
        if (painelRel) painelRel.remove();

        const t = estatisticasPartida.tentativas;
        const a = estatisticasPartida.acertos;
        const pct = t > 0 ? Math.round((a / t) * 100) : 100;
        const pvJFinal = parseInt(document.getElementById('pv-jogador')?.innerText || "0", 10);
        const venceu = pvJFinal > 0;
        const rank = calcularRankCientifico(pct, t, venceu);

        painelRel = document.createElement('div');
        painelRel.id = 'box-relatorio-cientifico-fim';
        painelRel.className = 'painel-relatorio-cientifico';
        painelRel.innerHTML = `
            <div class="cabecalho-relatorio-cientifico">
                <span class="titulo-relatorio-cientifico">TELEMETRIA DA PARTIDA</span>
                <span class="badge-rank-cientifico" style="color: ${rank.cor};">RANK ${rank.letra} • ${rank.titulo}</span>
            </div>
            <div class="grade-metricas-relatorio">
                <div class="card-metrica-fim">
                    <span class="label-metrica-fim">PRECISÃO FÍSICA</span>
                    <span class="valor-metrica-fim" style="color: ${rank.cor};">${pct}%</span>
                </div>
                <div class="card-metrica-fim">
                    <span class="label-metrica-fim">PREVISÕES CORRETAS</span>
                    <span class="valor-metrica-fim">${a} / ${t}</span>
                </div>
                <div class="card-metrica-fim">
                    <span class="label-metrica-fim">DANO ELETROMAGNÉTICO</span>
                    <span class="valor-metrica-fim">${estatisticasPartida.danoTotalCausado} PV</span>
                </div>
                <div class="card-metrica-fim">
                    <span class="label-metrica-fim">TURNOS DE COMBATE</span>
                    <span class="valor-metrica-fim">${numeroTurno}</span>
                </div>
            </div>
        `;
        telaFim.insertBefore(painelRel, botoesFim);
    }

    const verificarFimBase = verificarFimDeJogo;
    verificarFimDeJogo = function() {
        const terminou = verificarFimBase();
        if (terminou) {
            agendarTimerBatalha(() => renderizarRelatorioNaTelaFim(), 2250);
        }
        return terminou;
    };

    // ---------------------------------------------------------
    // 4. ATUALIZAÇÃO DO MANUAL DE CAMPO (REGRAS, MAPAS E RPG)
    // ---------------------------------------------------------
    if (typeof codexDados !== 'undefined') {
        codexDados.regras.conteudo = `
            <div class="codex-secao">
                <h4><img src="assets/atk.png" class="icone-hud" alt="Modos"> 1. MODOS DE JOGO & CONFIRMAÇÃO DE COMBATE</h4>
                <p><strong>Jogo Livre (Duelo):</strong> Escolha seu Guardião (Azul), o Oponente (Vermelho) e uma das <strong>5 Arenas</strong>. Quando estiver pronto, clique em <strong>COMEÇAR COMBATE</strong>.</p>
                <p><strong>Modo Campanha (Jornada do Fluxo):</strong> Enfrente os 5 Guardiões em seus setores com diálogos de história, conquistas na gaveta lateral, até 3 estrelas (★) por fase e <strong>PV persistente</strong> (+20 PV recuperados ao avançar de estágio).</p>
            </div>
            <div class="codex-secao">
                <h4><img src="assets/ult.png" class="icone-hud" alt="RPG"> 2. DOMÍNIO TEÓRICO & MÓDULOS DE APRIMORAMENTO (RPG)</h4>
                <p>Cada previsão física correta durante as lutas aumenta o seu <strong>Domínio Teórico Acumulado</strong> com aquele Guardião. Ao atingir <strong>30% (3 acertos)</strong>, <strong>60% (6 acertos)</strong> e <strong>100% (10 acertos)</strong>, você ganha <strong>+1 Ponto de Calibração (PC)</strong> na aba do personagem aqui no Manual para instalar melhorias reais de PV, Dano ou Carga Inicial de ULT!</p>
            </div>
            <div class="codex-secao">
                <h4><img src="assets/en.png" class="icone-hud" alt="Teclas"> 3. ATALHOS DE TECLADO & TELEMETRIA</h4>
                <p><strong>Atalhos Rápidos:</strong> Use as teclas <strong>[1]</strong>, <strong>[2]</strong> e <strong>[3]</strong> para escolher comandos ou responder às previsões físicas; <strong>[ENTER]</strong> para confirmar parâmetros ou avançar diálogos; <strong>[BACKSPACE / Q]</strong> para voltar e <strong>[ESC]</strong> para pausar.</p>
                <p><strong>Relatório Pós-Luta:</strong> Ao final de cada duelo, confira sua Precisão Científica (%) e sua classificação de laboratório (Rank S, A, B ou C).</p>
            </div>
        `;

        codexDados.lore.conteudo = `
            <div class="codex-secao">
                <h4>O FENÔMENO E AS CONDIÇÕES FÍSICAS DE ARENA</h4>
                <p>O <strong>Pulso de Œrsted</strong> alterou as propriedades eletromagnéticas de 5 setores da cidade. Tanto no Modo Campanha quanto no Duelo Livre, cada mapa aplica um <strong>Bônus</strong> e uma <strong>Penalidade Física</strong> reais sobre os combatentes:</p>
            </div>
            <div class="codex-secao">
                <h4>OS 5 CENÁRIOS E SEUS MODIFICADORES</h4>
                <div class="codex-grid-cenarios">
                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #00e5ff;">
                            <img src="assets/bg_ciclotron.png" alt="Ciclotron de Partículas">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #00e5ff;">1. CICLOTRON DE PARTÍCULAS (LORENTZ)</h5>
                                <span class="codex-sub-cenario">Condição: VÁCUO DE ACELERAÇÃO</span>
                                <p>Feixes de íons viajam sem atrito atmosférico sob campo constante. <strong>Bônus:</strong> +15% de dano em todos os ataques básicos. <strong>Penalidade:</strong> Escudos gerados têm -15% de eficiência.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #00e5ff; color: #00e5ff;">Campo: B = 3 T (⊗ Entrando) • +15% Atk Básico | -15% Escudos</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #f1c40f;">
                            <img src="assets/bg_usina.png" alt="Usina de Indução">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #f1c40f;">2. USINA DE INDUÇÃO (FARADAY)</h5>
                                <span class="codex-sub-cenario">Condição: CORRENTES DE FOUCAULT</span>
                                <p>Turbinas geram força eletromotriz contínua, mas induzem correntes parasitas no solo. <strong>Bônus:</strong> +1 EN extra recuperado por turno. <strong>Penalidade:</strong> Descanso Tático cura apenas +6 PV.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #f1c40f; color: #f1c40f;">Campo: B = 4 T (⊙ Saindo) • +1 EN/turno | Descanso: 6 PV</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #ff5252;">
                            <img src="assets/bg_forja.png" alt="Forja Ferro-Magnética">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #ff5252;">3. FORJA FERRO-MAGNÉTICA (AMPÈRE)</h5>
                                <span class="codex-sub-cenario">Condição: CALOR DE CURIE & FERRO</span>
                                <p>Núcleos ferromagnéticos amplificam barreiras, mas a temperatura extrema desgasta sobrecargas. <strong>Bônus:</strong> +15% em qualquer Escudo ativado. <strong>Penalidade:</strong> Usar Ultimato drena -4 PV pelo calor.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #ff5252; color: #ff5252;">Campo: B = 5 T (⊗ Entrando) • +15% Escudos | -4 PV ao usar ULT</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #18ffff;">
                            <img src="assets/bg_boreal.png" alt="Observatório Boreal">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #18ffff;">4. OBSERVATÓRIO BOREAL (WILHELM)</h5>
                                <span class="codex-sub-cenario">Condição: FRIO SUPERCONDUTOR (0 Ω)</span>
                                <p>O frio criogênico zera a resistência das bobinas, mas congela circuitos instáveis. <strong>Bônus:</strong> Todas as ações custam -1 EN (mín. 1). <strong>Penalidade:</strong> -1 EN regenerado por turno e -4 PV ao errar previsão.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #18ffff; color: #18ffff;">Campo: B = 3 T (⊙ Saindo) • -1 EN Custo | -1 EN/turno e -4 PV erro</span>
                        </div>
                    </div>

                    <div class="codex-card-cenario">
                        <div class="codex-img-cenario-wrapper" style="border-color: #e040fb;">
                            <img src="assets/bg_nucleo.png" alt="Núcleo de Alta Tensão">
                        </div>
                        <div class="codex-info-cenario">
                            <div>
                                <h5 style="color: #e040fb;">5. NÚCLEO DE ALTA TENSÃO (OHM)</h5>
                                <span class="codex-sub-cenario">Condição: TEMPESTADE DE PLASMA</span>
                                <p>O reator central ioniza o ar com descargas extremas. <strong>Bônus:</strong> Todos os Ultimatos causam +20% de dano. <strong>Penalidade:</strong> Errar uma previsão física provoca arco voltaico de -6 PV.</p>
                            </div>
                            <span class="codex-tag-fisica-cenario" style="border-color: #e040fb; color: #e040fb;">Campo: B = 6 T (⊗ Entrando) • +20% Dano ULT | -6 PV ao errar</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Funções globais para instalar/resetar módulos RPG dentro do Manual de Campo
    window.instalarModuloRpgCodex = function(idGuardiao, idModulo) {
        const pcTotal = obterPontosCalibracaoTotais(idGuardiao);
        if (!upgradesSalvos[idGuardiao]) upgradesSalvos[idGuardiao] = [];
        const instalados = upgradesSalvos[idGuardiao];

        if (instalados.includes(idModulo) || instalados.length >= pcTotal) return;
        audioManager.tocarCura ? audioManager.tocarCura() : audioManager.tocarClique();
        instalados.push(idModulo);
        localStorage.setItem(CHAVE_UPGRADES, JSON.stringify(upgradesSalvos));
        window.mudarAbaCodex(idGuardiao);
        renderizarSelecao();
    };

    window.resetarModulosRpgCodex = function(idGuardiao) {
        audioManager.tocarClique();
        upgradesSalvos[idGuardiao] = [];
        localStorage.setItem(CHAVE_UPGRADES, JSON.stringify(upgradesSalvos));
        window.mudarAbaCodex(idGuardiao);
        renderizarSelecao();
    };

    // Sobrescreve mudarAbaCodex para injetar a Barra de Domínio + Árvore de Upgrades RPG
    const mudarAbaCodexBase = mudarAbaCodex;
    window.mudarAbaCodex = function(chaveAba) {
        mudarAbaCodexBase(chaveAba);

        let idLimpo = chaveAba;
        if (idLimpo === 'bobina') idLimpo = 'ampere';
        if (idLimpo === 'polaris') idLimpo = 'wilhelm';

        const dados = codexDados[idLimpo];
        if (!dados || !dados.isLore) return;

        const containerDetalhes = document.querySelector('#codex-conteudo .codex-detalhes');
        if (!containerDetalhes) return;

        const reg = dominioSalvo[idLimpo] || { acertos: 0, tentativas: 0 };
        const pctDominio = Math.min(100, Math.round((reg.acertos / 10) * 100));
        const precisaoHistorica = reg.tentativas > 0 ? Math.round((reg.acertos / reg.tentativas) * 100) : 0;

        const pcTotal = obterPontosCalibracaoTotais(idLimpo);
        const instalados = upgradesSalvos[idLimpo] || [];
        const pcRestantes = Math.max(0, pcTotal - instalados.length);

        // Atualiza o badge de PV da ficha no Codex caso o Capacitor (+15 PV) esteja instalado
        const bonusAtual = window.obterBonusUpgradeGuardiao(idLimpo);
        const badgePvEl = containerDetalhes.querySelector('.badge-ficha-codex.pv');
        if (badgePvEl && metaFichasCodex[idLimpo]) {
            const pvBaseNum = parseInt(metaFichasCodex[idLimpo].pv, 10) || 100;
            badgePvEl.innerHTML = `<img src="assets/pv.png" class="icone-hud" alt="PV"> ${pvBaseNum + bonusAtual.pvExtra} PV${bonusAtual.pvExtra > 0 ? ' (+15)' : ''}`;
        }

        let nivelTitulo = "INICIANTE (0/10)";
        if (pctDominio >= 100) nivelTitulo = "★ MESTRE DO FLUXO ★";
        else if (pctDominio >= 60) nivelTitulo = "PESQUISADOR AVANÇADO";
        else if (pctDominio >= 30) nivelTitulo = "TÉCNICO CALIBRADOR";

        const boxDominio = document.createElement('div');
        boxDominio.className = 'box-dominio-codex';
        boxDominio.innerHTML = `
            <div class="topo-dominio-codex">
                <span class="titulo-dominio-codex"><img src="assets/icon_dominio.png" class="icone-hud" alt="Domínio"> DOMÍNIO TEÓRICO ACUMULADO</span>
                <span class="status-dominio-codex">${pctDominio}% • ${nivelTitulo}</span>
            </div>
            <div class="barra-dominio-moldura">
                <div class="barra-dominio-fill" style="width: ${pctDominio}%;"></div>
            </div>
            <span class="sub-dominio-codex">
                Previsões corretas com ${dados.titulo}: ${reg.acertos} acerto(s) em ${reg.tentativas} tentativa(s) (Precisão: ${precisaoHistorica}%) • Desbloqueia 1 PC aos 3, 6 e 10 acertos!
            </span>
        `;

        // Seção de Upgrades RPG
        const boxUpgrades = document.createElement('div');
        boxUpgrades.className = 'secao-upgrades-rpg';
        const cardsHtml = CATALOGO_MODULOS_RPG.map(mod => {
            const jaInstalado = instalados.includes(mod.id);
            const podeInstalar = !jaInstalado && pcRestantes >= mod.custo;
            return `
                <div class="card-modulo-rpg ${jaInstalado ? 'instalado' : ''}">
                    <div>
                        <div class="nome-modulo-rpg">${mod.nome}</div>
                        <p class="desc-modulo-rpg">${mod.desc}</p>
                    </div>
                    <button type="button"
                        class="btn-instalar-modulo-rpg ${jaInstalado ? 'ativo' : ''}"
                        ${(!podeInstalar && !jaInstalado) ? 'disabled' : ''}
                        onclick="instalarModuloRpgCodex('${idLimpo}', '${mod.id}')">
                        ${jaInstalado ? '✓ INSTALADO' : (podeInstalar ? 'INSTALAR (1 PC)' : 'REQUER +PC')}
                    </button>
                </div>
            `;
        }).join('');

        boxUpgrades.innerHTML = `
            <div class="topo-upgrades-rpg">
                <span class="titulo-upgrades-rpg">MÓDULOS DE APRIMORAMENTO</span>
                <div class="painel-pc-rpg">
                    <span class="badge-pc-disponivel"><img src="assets/icon_pontos.png" class="icone-hud" alt="Pontos"> PONTOS (PC): ${pcRestantes} / ${pcTotal}</span>
                    ${instalados.length > 0 ? `<button type="button" class="btn-reset-upgrades-guardiao" onclick="resetarModulosRpgCodex('${idLimpo}')">RESETAR</button>` : ''}
                </div>
            </div>
            <div class="grade-cards-upgrade-rpg">
                ${cardsHtml}
            </div>
        `;

        const badgesEl = containerDetalhes.querySelector('.codex-ficha-badges');
        if (badgesEl && badgesEl.nextSibling) {
            containerDetalhes.insertBefore(boxUpgrades, badgesEl.nextSibling);
            containerDetalhes.insertBefore(boxDominio, boxUpgrades);
        } else {
            containerDetalhes.appendChild(boxDominio);
            containerDetalhes.appendChild(boxUpgrades);
        }
    };

    // 5. Limpa Domínio e Upgrades RPG quando o jogador reseta o progresso nas Configurações
    const btnResetSim = document.getElementById('btn-confirm-reset-sim');
    if (btnResetSim) {
        btnResetSim.addEventListener('click', () => {
            localStorage.removeItem(CHAVE_DOMINIO);
            localStorage.removeItem(CHAVE_UPGRADES);
            dominioSalvo = {};
            upgradesSalvos = {};
            renderizarSelecao();
            atualizarPainelConquistasIntegrado();
        });
    }
})();

// =========================================================
// OTIMIZAÇÃO MOBILE & WEB: ROTAÇÃO E ÁUDIO EM SEGUNDO PLANO
// =========================================================
(function inicializarOtimizacaoMobile() {
    // 1. Injeta o aviso de modo paisagem no body
    if (!document.getElementById('aviso-girar-celular')) {
        const aviso = document.createElement('div');
        aviso.id = 'aviso-girar-celular';
        aviso.innerHTML = `
            <div class="box-girar-celular">
                <div class="icone-celular-girar"></div>
                <h2>GIRE O CELULAR</h2>
                <p>Guardiões do Fluxo foi projetado em formato Arcade Widescreen. Vire o aparelho na horizontal para jogar!</p>
            </div>
        `;
        document.body.appendChild(aviso);
    }

    // 2. Recalcula o auto-scale ao girar o celular (com leve delay para a barra do navegador assentar)
    window.addEventListener('orientationchange', () => {
        setTimeout(atualizarEscalaGabineteArcade, 180);
    });

    // 3. Pausa a BGM ao minimizar o navegador/bloquear a tela e retoma ao voltar
    let bgmEstavaTocandoAntes = false;
    document.addEventListener('visibilitychange', () => {
        if (typeof audioManager === 'undefined') return;
        if (document.hidden) {
            bgmEstavaTocandoAntes = audioManager.musicaAtivada && audioManager.bgmAudio && !audioManager.bgmAudio.paused;
            if (bgmEstavaTocandoAntes) {
                audioManager.pararBossBGM?.();
                audioManager.bgmAudio.pause();
            }
        } else if (bgmEstavaTocandoAntes && audioManager.musicaAtivada) {
            audioManager.iniciarBGM();
            bgmEstavaTocandoAntes = false;
        }
    });
})();