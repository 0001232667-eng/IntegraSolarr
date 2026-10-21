// BANCO DE DADOS LOCAL PERMANENTE (Persiste contas e leituras no navegador)
let usuariosCadastrados = JSON.parse(localStorage.getItem("solarneo_usuarios_db")) || [
    { nome: "Empresa Admin", email: "admin@solarneo.com", senha: "admin123", papel: "Admin" }
];

let historico = JSON.parse(localStorage.getItem("solarneo_historico")) || [
    { hora: "14:20:10", potencia: "1,85 kW", carga: "78%", tensao: "220 V" },
    { hora: "14:10:05", potencia: "1,92 kW", carga: "75%", tensao: "221 V" }
];

let usuarioAtual = JSON.parse(sessionStorage.getItem("solarneo_usuario")) || null;

// INICIALIZAÇÃO DA PÁGINA
document.addEventListener("DOMContentLoaded", () => {
    verificarAutenticacao();
    desenharGrafico();
    desenharHistorico();
    desenharAlertas();
});

// ALTERNAR ABAS DE AUTENTICAÇÃO (LOGIN / CADASTRO)
function alternarAbaAuth(aba) {
    const formL = document.getElementById("formLogin");
    const formC = document.getElementById("formCadastro");
    const btnL = document.getElementById("btnAbaLogin");
    const btnC = document.getElementById("btnAbaCadastro");

    document.getElementById("loginErro").style.display = "none";
    document.getElementById("cadErro").style.display = "none";
    document.getElementById("loginSucesso").style.display = "none";

    if (aba === 'login') {
        formL.classList.remove("escondida");
        formC.classList.add("escondida");
        btnL.classList.add("ativo");
        btnC.classList.remove("ativo");
    } else {
        formL.classList.add("escondida");
        formC.classList.remove("escondida");
        btnL.classList.remove("ativo");
        btnC.classList.add("ativo");
    }
}

// VERIFICAR SESSÃO DO USUÁRIO
function verificarAutenticacao() {
    const telaAuth = document.getElementById("telaAuth");
    const appPrincipal = document.getElementById("aplicacaoPrincipal");

    if (!usuarioAtual) {
        telaAuth.classList.remove("escondida");
        appPrincipal.classList.add("escondida");
    } else {
        telaAuth.classList.add("escondida");
        appPrincipal.classList.remove("escondida");
        
        document.getElementById("badgeUsuario").textContent = usuarioAtual.nome + " (" + usuarioAtual.papel + ")";
        
        const elementosAdmin = document.querySelectorAll(".restrino-admin");
        elementosAdmin.forEach(el => {
            el.style.display = (usuarioAtual.papel === "Admin") ? "inline-block" : "none";
        });
    }
}

// 1. CADASTRAR NOVA CONTA NO BANCO LOCAL
function realizarCadastro(e) {
    e.preventDefault();
    const nome = document.getElementById("cadNome").value.trim();
    const email = document.getElementById("cadEmail").value.toLowerCase().trim();
    const senha = document.getElementById("cadSenha").value;
    const erro = document.getElementById("cadErro");

    // Verifica se o e-mail já existe
    const usuarioExiste = usuariosCadastrados.find(u => u.email === email);
    if (usuarioExiste) {
        erro.textContent = "Este e-mail já está cadastrado!";
        erro.style.display = "block";
        return;
    }

    // Grava o novo usuário no Banco Local
    const novoUsuario = { nome, email, senha, papel: "Cliente" };
    usuariosCadastrados.push(novoUsuario);
    localStorage.setItem("solarneo_usuarios_db", JSON.stringify(usuariosCadastrados));

    // Limpa o formulário, oculta erros e volta para a tela de LOGIN
    document.getElementById("formCadastro").reset();
    erro.style.display = "none";
    alternarAbaAuth('login');

    const msgSucesso = document.getElementById("loginSucesso");
    msgSucesso.textContent = "Conta criada com sucesso! Digite seu e-mail e senha para entrar.";
    msgSucesso.style.display = "block";
}

// 2. REALIZAR LOGIN COM O E-MAIL E SENHA CADASTRADOS
function realizarLogin(e) {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value.toLowerCase().trim();
    const senha = document.getElementById("loginSenha").value;
    const erroMsg = document.getElementById("loginErro");
    const msgSucesso = document.getElementById("loginSucesso");

    msgSucesso.style.display = "none";

    // Procura no banco local de usuários
    const usuarioValido = usuariosCadastrados.find(u => u.email === email && u.senha === senha);

    if (usuarioValido) {
        usuarioAtual = { nome: usuarioValido.nome, papel: usuarioValido.papel };
        sessionStorage.setItem("solarneo_usuario", JSON.stringify(usuarioAtual));
        erroMsg.style.display = "none";
        verificarAutenticacao();
        mostrarNotificacao("Bem-vindo(a), " + usuarioAtual.nome + "!");
    } else {
        erroMsg.textContent = "E-mail ou senha incorretos!";
        erroMsg.style.display = "block";
    }
}

function fazerLogout() {
    sessionStorage.removeItem("solarneo_usuario");
    usuarioAtual = null;
    verificarAutenticacao();
}

// ATUALIZAR E SALVAR TELEMETRIA
function atualizarDados() {
    const potenciaNumero = 1.2 + Math.random() * 1.5;
    const cargaNumero = Math.floor(25 + Math.random() * 76);
    const tensaoNumero = Math.floor(215 + Math.random() * 11);

    salvarLeitura(potenciaNumero, cargaNumero, tensaoNumero);
}

function simularEnvioESP32() {
    const pot = parseFloat(document.getElementById("simPotencia").value) || 1.85;
    const car = parseInt(document.getElementById("simCarga").value) || 80;
    const ten = parseInt(document.getElementById("simTensao").value) || 220;

    salvarLeitura(pot, car, ten);
}

function salvarLeitura(potenciaNum, cargaNum, tensaoNum) {
    const potencia = potenciaNum.toFixed(2).replace(".", ",") + " kW";
    const carga = cargaNum + "%";
    const tensao = tensaoNum + " V";
    const hora = new Date().toLocaleTimeString("pt-BR");

    document.getElementById("potencia").textContent = potencia;
    document.getElementById("carga").textContent = carga;
    document.getElementById("tensao").textContent = tensao;
    document.getElementById("barraBateria").style.width = carga;
    document.getElementById("resumoBateria").textContent = "Carga em " + carga;

    historico.unshift({ hora, potencia, carga, tensao });
    localStorage.setItem("solarneo_historico", JSON.stringify(historico));

    document.getElementById("tabelaRecentes").innerHTML = `
        <tr><td>Potência solar</td><td>${potencia}</td><td>Inversor</td><td>${hora}</td></tr>
        <tr><td>Carga da bateria</td><td>${carga}</td><td>Bateria</td><td>${hora}</td></tr>
        <tr><td>Tensão</td><td>${tensao}</td><td>Inversor</td><td>${hora}</td></tr>
    `;

    desenharGrafico();
    desenharHistorico();
    mostrarNotificacao("Leitura armazenada no banco com sucesso!");
}

// NAVEGAÇÃO E GRÁFICOS
function abrirPagina(nome, botao) {
    document.querySelectorAll(".pagina").forEach(p => p.classList.add("escondida"));
    
    const paginaAlvo = document.getElementById("pagina-" + nome);
    if (paginaAlvo) paginaAlvo.classList.remove("escondida");

    document.querySelectorAll(".menu-item").forEach(item => item.classList.remove("ativo"));

    if (botao) {
        botao.classList.add("ativo");
    }

    if (nome === "historico") desenharHistorico();
    if (nome === "alertas") desenharAlertas();
}

function desenharGrafico() {
    const seletor = document.getElementById("periodoGrafico");
    if (!seletor) return;

    const semana = seletor.value === "semana";
    const valores = semana ? [35, 52, 44, 76, 61, 88, 70] : [18, 35, 55, 78, 92, 72, 48, 25];
    const rotulos = semana ? ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"] : ["7h", "9h", "11h", "13h", "15h", "17h", "19h", "21h"];

    document.getElementById("grafico").innerHTML = valores.map((valor, i) => `
        <div class="coluna-grafico" title="${valor} kWh" style="height:${valor}%">
            <span>${rotulos[i]}</span>
        </div>
    `).join("");
}

function desenharHistorico() {
    const tabela = document.getElementById("tabelaHistorico");
    if (!tabela) return;

    tabela.innerHTML = historico.length
        ? historico.map(item => `
            <tr>
                <td>${item.hora}</td>
                <td>${item.potencia}</td>
                <td>${item.carga}</td>
                <td>${item.tensao}</td>
            </tr>
        `).join("")
        : '<tr><td colspan="4">Nenhum registro armazenado no banco.</td></tr>';

    document.getElementById("contagemHistorico").textContent = historico.length + " registro(s) armazenado(s)";
}

function filtrarTabelaHistorico() {
    const termo = document.getElementById("filtroBusca").value.toLowerCase();
    const linhas = document.querySelectorAll("#tabelaHistorico tr");

    linhas.forEach(linha => {
        const texto = linha.textContent.toLowerCase();
        linha.style.display = texto.includes(termo) ? "" : "none";
    });
}

function exportarCSV() {
    if (!historico.length) {
        mostrarNotificacao("Nenhum dado para exportar.");
        return;
    }

    let csv = "Horario;Potencia;Bateria;Tensao\n";
    historico.forEach(item => {
        csv += `${item.hora};${item.potencia};${item.carga};${item.tensao}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute("download", `Solarneo_Relatorio_${new Date().toLocaleDateString("pt-BR")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    mostrarNotificacao("Relatório CSV baixado com sucesso!");
}

function limparHistorico() {
    if (confirm("Deseja realmente apagar todo o histórico mantido no banco?")) {
        historico = [];
        localStorage.removeItem("solarneo_historico");
        desenharHistorico();
        mostrarNotificacao("Banco de dados limpo.");
    }
}

function desenharAlertas() {
    const lista = document.getElementById("listaAlertas");
    if (!lista) return;

    const ultimo = historico[0];
    let mensagem = "";

    if (!ultimo) {
        mensagem = `<div class="alerta-item"><strong>Sem registros no banco</strong><p>Nenhuma leitura cadastrada até o momento.</p></div>`;
    } else if (parseInt(ultimo.carga) < 30) {
        mensagem = `<div class="alerta-item"><strong style="color:var(--vermelho)">Atenção: Bateria Baixa</strong><p>Carga atual de ${ultimo.carga}. Necessário atenção no consumo off-grid.</p></div>`;
    } else {
        mensagem = `<div class="alerta-item"><strong style="color:var(--verde)">Operação Normal</strong><p>Bateria e tensão dentro das faixas normais de operação.</p></div>`;
    }

    lista.innerHTML = mensagem;
}

function recalcularEconomia() {
    const tarifa = parseFloat(document.getElementById("valorKwh").value) || 0.85;
    const kwhMes = 450;

    const ecoMesVal = kwhMes * tarifa;
    const ecoAnoVal = ecoMesVal * 12;

    document.getElementById("ecoMes").textContent = "R$ " + ecoMesVal.toFixed(2).replace(".", ",");
    document.getElementById("ecoAno").textContent = "R$ " + ecoAnoVal.toFixed(2).replace(".", ",");

    mostrarNotificacao("Valores de economia recalculados!");
}

function mostrarNotificacao(texto) {
    const caixa = document.getElementById("notificacao");
    if (!caixa) return;

    caixa.textContent = texto;
    caixa.classList.add("visivel");
    clearTimeout(window.timerNotificacao);
    window.timerNotificacao = setTimeout(() => caixa.classList.remove("visivel"), 2500);
}