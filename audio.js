class RetroAudio {
    constructor() {
        this.ctx = null;

        // Carrega preferências salvas no LocalStorage logo ao criar a instância
        const salvo = JSON.parse(localStorage.getItem('guardioes_audio_config') || '{}');
        this.somAtivado = typeof salvo.somAtivado === 'boolean' ? salvo.somAtivado : true;
        this.musicaAtivada = typeof salvo.musicaAtivada === 'boolean' ? salvo.musicaAtivada : true;
        this.volumeSfx = typeof salvo.volumeSfx === 'number' ? salvo.volumeSfx : 0.85;
        this.volumeBgm = typeof salvo.volumeBgm === 'number' ? salvo.volumeBgm : 0.70;

        this.modoBossAtivo = false;
        this._intervaloBoss = null;
        this.audioDublagemAtual = null;

        this.bgmAudio = new Audio('musica_arcade.mp3');
        this.bgmAudio.loop = true;
        this.atualizarVolumeBGM();
    }

    salvarConfig() {
        localStorage.setItem('guardioes_audio_config', JSON.stringify({
            somAtivado: this.somAtivado,
            musicaAtivada: this.musicaAtivada,
            volumeSfx: this.volumeSfx,
            volumeBgm: this.volumeBgm
        }));
    }

    inicializar() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) this.ctx = new AudioContext();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
        return this.ctx;
    }

    obterGanhoSfx(valorBase) {
        if (!this.somAtivado || this.volumeSfx <= 0.01) return 0;
        return Math.max(0.001, valorBase * this.volumeSfx);
    }

    atualizarVolumeBGM() {
        const volReal = (this.musicaAtivada && this.volumeBgm > 0.01)
            ? Math.max(0, Math.min(1, this.volumeBgm))
            : 0;
        if (this.bgmAudio) {
            this.bgmAudio.volume = volReal;
        }
    }

    definirVolumeSfx(novoVolume0a1) {
        this.volumeSfx = Math.max(0, Math.min(1, novoVolume0a1));
        this.somAtivado = this.volumeSfx > 0.01;
        if (this.audioDublagemAtual) {
            this.audioDublagemAtual.volume = this.somAtivado ? this.volumeSfx : 0;
        }
        this.salvarConfig();
    }

    definirVolumeBgm(novoVolume0a1) {
        const estavaAtiva = this.musicaAtivada;
        this.volumeBgm = Math.max(0, Math.min(1, novoVolume0a1));
        this.musicaAtivada = this.volumeBgm > 0.01;
        this.atualizarVolumeBGM();

        if (!this.musicaAtivada) {
            this.pararBGM();
        } else if (!estavaAtiva || (this.bgmAudio.paused && !this._intervaloBoss)) {
            this.iniciarBGM();
        }
        this.salvarConfig();
    }

    // --- EFEITOS SONOROS SINTETIZADOS (COM VOLUME SFX REAL) ---

    tocarClique() {
        const vol = this.obterGanhoSfx(0.12);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const agora = ctx.currentTime;
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, agora);
        osc.frequency.setValueAtTime(1320, agora + 0.025);

        ganho.gain.setValueAtTime(vol, agora);
        ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.06);

        osc.connect(ganho);
        ganho.connect(ctx.destination);

        osc.start(agora);
        osc.stop(agora + 0.065);
    }

    tocarAtaque() {
        const vol = this.obterGanhoSfx(0.15);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const agora = ctx.currentTime;
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(780, agora);
        osc.frequency.exponentialRampToValueAtTime(190, agora + 0.19);

        ganho.gain.setValueAtTime(vol, agora);
        ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.20);

        osc.connect(ganho);
        ganho.connect(ctx.destination);

        osc.start(agora);
        osc.stop(agora + 0.21);
    }

    tocarDano() {
        const vol = this.obterGanhoSfx(0.22);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const agora = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gainOsc = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, agora);
        osc.frequency.exponentialRampToValueAtTime(38, agora + 0.22);

        gainOsc.gain.setValueAtTime(vol, agora);
        gainOsc.gain.exponentialRampToValueAtTime(0.001, agora + 0.24);

        osc.connect(gainOsc);
        gainOsc.connect(ctx.destination);
        osc.start(agora);
        osc.stop(agora + 0.25);

        const bufferSize = ctx.sampleRate * 0.14;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filtro = ctx.createBiquadFilter();
        filtro.type = 'bandpass';
        filtro.frequency.setValueAtTime(900, agora);

        const gainNoise = ctx.createGain();
        gainNoise.gain.setValueAtTime(vol * 0.8, agora);
        gainNoise.gain.exponentialRampToValueAtTime(0.001, agora + 0.14);

        noise.connect(filtro);
        filtro.connect(gainNoise);
        gainNoise.connect(ctx.destination);

        noise.start(agora);
        noise.stop(agora + 0.14);
    }

    tocarUltimato() {
        const vol = this.obterGanhoSfx(0.25);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const tempoAtual = ctx.currentTime;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const ganho = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'square';

        osc1.frequency.setValueAtTime(100, tempoAtual);
        osc1.frequency.exponentialRampToValueAtTime(880, tempoAtual + 0.3);
        osc1.frequency.exponentialRampToValueAtTime(120, tempoAtual + 0.7);

        osc2.frequency.setValueAtTime(80, tempoAtual);
        osc2.frequency.exponentialRampToValueAtTime(440, tempoAtual + 0.3);
        osc2.frequency.exponentialRampToValueAtTime(60, tempoAtual + 0.7);

        ganho.gain.setValueAtTime(vol, tempoAtual);
        ganho.gain.exponentialRampToValueAtTime(0.001, tempoAtual + 0.7);

        osc1.connect(ganho);
        osc2.connect(ganho);
        ganho.connect(ctx.destination);

        osc1.start(tempoAtual);
        osc2.start(tempoAtual);
        osc1.stop(tempoAtual + 0.7);
        osc2.stop(tempoAtual + 0.7);
    }

    tocarVitoria() {
        const vol = this.obterGanhoSfx(0.16);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const notas = [261.63, 329.63, 392.00, 523.25];
        notas.forEach((freq, index) => {
            setTimeout(() => {
                if (!this.somAtivado) return;
                const osc = ctx.createOscillator();
                const ganho = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                ganho.gain.setValueAtTime(vol, ctx.currentTime);
                ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
                osc.connect(ganho);
                ganho.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.25);
            }, index * 120);
        });
    }

    tocarDerrota() {
        const vol = this.obterGanhoSfx(0.16);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const notas = [300, 260, 220, 180];
        notas.forEach((freq, index) => {
            setTimeout(() => {
                if (!this.somAtivado) return;
                const osc = ctx.createOscillator();
                const ganho = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, ctx.currentTime);
                ganho.gain.setValueAtTime(vol, ctx.currentTime);
                ganho.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                osc.connect(ganho);
                ganho.connect(ctx.destination);
                osc.start();
                osc.stop(ctx.currentTime + 0.3);
            }, index * 180);
        });
    }

    tocarBlipTexto(tipo = 'player') {
        if (this.audioDublagemAtual && !this.audioDublagemAtual.paused && !this.audioDublagemAtual.ended) {
            return;
        }
        const vol = this.obterGanhoSfx(0.045);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const agora = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        let freqBase = 520;
        if (tipo === 'boss') freqBase = 330;
        else if (tipo === 'dica') freqBase = 660;
        else if (tipo === 'fim') freqBase = 460;

        osc.frequency.setValueAtTime(freqBase + (Math.random() * 30 - 15), agora);
        gain.gain.setValueAtTime(vol, agora);
        gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.032);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(agora);
        osc.stop(agora + 0.035);
    }

    tocarCura() {
        const vol = this.obterGanhoSfx(0.13);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const notas = [523.25, 659.25, 783.99, 1046.50];
        notas.forEach((freq, idx) => {
            const agora = ctx.currentTime + (idx * 0.065);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, agora);
            gain.gain.setValueAtTime(vol, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.22);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(agora);
            osc.stop(agora + 0.24);
        });
    }

    tocarEscudo() {
        const vol = this.obterGanhoSfx(0.09);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const agora = ctx.currentTime;
        [220, 330, 440].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = i === 0 ? 'sawtooth' : 'sine';
            osc.frequency.setValueAtTime(freq, agora);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.25, agora + 0.26);

            gain.gain.setValueAtTime(vol, agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.28);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start(agora);
            osc.stop(agora + 0.30);
        });
    }

    tocarErroFisica() {
        const vol = this.obterGanhoSfx(0.15);
        if (!vol) return;
        const ctx = this.inicializar();
        if (!ctx) return;

        const agora = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(185, agora);
        osc.frequency.linearRampToValueAtTime(110, agora + 0.14);
        osc.frequency.linearRampToValueAtTime(72, agora + 0.30);

        gain.gain.setValueAtTime(vol, agora);
        gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.32);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(agora);
        osc.stop(agora + 0.34);
    }

    // --- DUBLAGEM (.WAV) ---
    pararDublagem() {
        if (this.audioDublagemAtual) {
            this.audioDublagemAtual.pause();
            this.audioDublagemAtual.currentTime = 0;
            this.audioDublagemAtual = null;
        }
    }

    tocarDublagem(nomeArquivo) {
        this.pararDublagem();
        const vol = this.obterGanhoSfx(1.0);
        if (!vol) return;

        const somVoz = new Audio(`dublagem/${nomeArquivo}.wav`);
        somVoz.volume = Math.max(0, Math.min(1, this.volumeSfx));
        this.audioDublagemAtual = somVoz;

        somVoz.play().catch(err => {
            console.warn(`Não foi possível reproduzir dublagem/${nomeArquivo}.wav:`, err);
        });
    }

    // --- MÚSICA DE FUNDO (WAV + MODO BOSS FINAL) ---
    pararBossBGM() {
        if (this._intervaloBoss) {
            clearInterval(this._intervaloBoss);
            this._intervaloBoss = null;
        }
    }

    iniciarBossBGM() {
        this.pararBossBGM();
        if (!this.musicaAtivada || this.volumeBgm <= 0.01) return;

        // 1. Mantém o musica_arcade.wav acelerado em 1.18x (ritmo frenético de Boss Final!)
        this.atualizarVolumeBGM();
        this.bgmAudio.playbackRate = 1.18;
        if (this.bgmAudio.paused) {
            this.bgmAudio.play().catch(() => {});
        }

        // 2. Adiciona pulso de baixo de alta tensão sincronizado ao volume da BGM
        const ctx = this.inicializar();
        if (!ctx) return;

        const baixoBoss = [110, 110, 130.81, 110, 146.83, 130.81, 123.47, 103.83];
        let passo = 0;

        this._intervaloBoss = setInterval(() => {
            if (!this.musicaAtivada || this.volumeBgm <= 0.01) return;
            if (ctx.state === 'suspended') ctx.resume();

            const agora = ctx.currentTime;
            const freq = baixoBoss[passo % baixoBoss.length];
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, agora);
            gain.gain.setValueAtTime(Math.max(0.001, 0.045 * this.volumeBgm), agora);
            gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(agora);
            osc.stop(agora + 0.16);
            passo++;
        }, 175);
    }

    iniciarBGM() {
        this.pararBossBGM();
        this.atualizarVolumeBGM();

        if (!this.musicaAtivada || this.volumeBgm <= 0.01) {
            this.bgmAudio.pause();
            return;
        }

        if (this.modoBossAtivo) {
            this.iniciarBossBGM();
        } else {
            this.bgmAudio.playbackRate = 1.0;
            this.bgmAudio.play().catch(() => {
                console.log("Aguardando interação para reproduzir áudio...");
            });
        }
    }

    pararBGM() {
        this.pararBossBGM();
        this.bgmAudio.pause();
        this.bgmAudio.currentTime = 0;
        this.bgmAudio.playbackRate = 1.0;
    }
}

// Instância global de áudio
const audioManager = new RetroAudio();