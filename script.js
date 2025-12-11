// ================================
// CONFIG
// ================================
const API = "https://camarsan.pythonanywhere.com";

let materiais = [];
let produtos = [];

// ================================
// CARREGAMENTO INICIAL
// ================================
$(document).ready(function () {
    // Tabelas só carregam quando o usuário clicar nos botões
});

// ================================
// BOTÕES PARA MOSTRAR/OCULTAR
// ================================
$("#btnMostrarMateriais").click(function () {
    $("#tabelaMateriaisLista").toggle();
    if ($("#tabelaMateriaisLista").is(":visible")) {
        carregarMateriais();
    }
});

$("#btnMostrarProdutos").click(function () {
    $("#tabelaProdutosLista").toggle();

    if ($("#tabelaProdutosLista").is(":visible")) {

        // ⚠️ carregue os materiais antes de permitir qualquer ação em produtos
        carregarMateriais();

        // só depois carregue os produtos
        carregarProdutos();
    }
});


$("#btnMostrarProducoes").click(function () {
    $("#tabelaProducoesLista").toggle();
    if ($("#tabelaProducoesLista").is(":visible")) {
        carregarProducoes();
    }
});

$("#btnMostrarEmProducao").click(function () {
    $("#tabelaEmProducaoLista").toggle();
    if ($("#tabelaEmProducaoLista").is(":visible")) {
        carregarEmProducao();
    }
});


// ================================
// MATERIAIS
// ================================
function carregarMateriais() {
    $.get(`${API}/materiais`, function (data) {
        materiais = data;
        atualizarTabelaMateriais();
    });
}

function atualizarTabelaMateriais() {
    let tabela = $("#listaMateriais");
    tabela.html("");

    materiais.forEach(m => {
        tabela.append(`
            <tr>
                <td>${m.id}</td>
                <td>${m.nome}</td>
                <td>${m.cor}</td>
                <td>R$ ${parseFloat(m.valor_grama).toFixed(2)}</td>
                <td>${parseFloat(m.estoque).toFixed(2)}</td>
                <td>
                    <button class="btnEditarMaterial" data-id="${m.id}">Editar</button>
                    <button class="btnExcluirMaterial" data-id="${m.id}">Excluir</button>
                </td>
            </tr>
        `);
    });
}

// ================================
// EDITAR MATERIAL
// ================================
$(document).on("click", ".btnEditarMaterial", function () {
    let id = $(this).data("id");
    let mat = materiais.find(m => m.id == id);

    let nome = prompt("Nome:", mat.nome);
    let cor = prompt("Cor:", mat.cor);
    let valor = parseFloat(prompt("Valor por grama:", mat.valor_grama));
    let estoque = parseFloat(prompt("Estoque:", mat.estoque));

    $.ajax({
        url: `${API}/materiais/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
            nome,
            cor,
            valor_grama: valor,
            estoque
        }),
        success: function () {
            if ($("#tabelaMateriaisLista").is(":visible")) {
                carregarMateriais();
            }
            alert("Material atualizado!");
        }
    });
});

// ================================
// EXCLUIR MATERIAL
// ================================
$(document).on("click", ".btnExcluirMaterial", function () {
    let id = $(this).data("id");
    if (!confirm("Tem certeza que deseja excluir este material?")) return;

    $.ajax({
        url: `${API}/materiais/${id}`,
        method: "DELETE",
        success: function () {
            if ($("#tabelaMateriaisLista").is(":visible")) {
                carregarMateriais();
            }
            alert("Material removido!");
        }
    });
});

// ================================
// ADICIONAR MATERIAL
// ================================
$("#addMaterial").click(function () {
    let material = {
        nome: $("#matNome").val(),
        cor: $("#matCor").val(),
        valor_grama: parseFloat($("#matValor").val()),
        estoque: parseFloat($("#matQtd").val())
    };

    $.ajax({
        url: `${API}/materiais`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(material),
        success: function () {
            if ($("#tabelaMateriaisLista").is(":visible")) {
                carregarMateriais();
            }
            alert("Material cadastrado!");
        }
    });
});

// ================================
// PRODUTOS
// ================================
function carregarProdutos() {
    $.get(`${API}/produtos`, function (data) {
        produtos = data;
        produtos = produtos.map(p => ({ ...p }));
        atualizarTabelaProdutos();
    });
}

$("#addLinhaMat").click(function () {
    let linha = `
        <tr>
            <td>
                <select class="matSelect">
                    <option value="">Selecione</option>
                </select>
            </td>
            <td><input type="number" class="matQtd" step="0.01"></td>
            <td class="custoMat">R$ 0.00</td>
            <td><button class="removeBtn">X</button></td>
        </tr>`;

    $("#tabelaMateriaisProd").append(linha);

    // preencher select com materiais
    let ultima = $("#tabelaMateriaisProd tr").last().find(".matSelect");
    materiais.forEach(m => {
        ultima.append(`<option value="${m.id}">${m.nome} (${m.cor})</option>`);
    });
});

// remover linha
$(document).on("click", ".removeBtn", function () {
    $(this).closest("tr").remove();
    calcularTotal();
});

// recalcular custo
$(document).on("change", ".matSelect, .matQtd", function () {
    calcularTotal();
});

function calcularTotal() {
    let total = 0;

    $("#tabelaMateriaisProd tr").each(function () {
        let matId = parseInt($(this).find(".matSelect").val(), 10);
        let qtd = parseFloat($(this).find(".matQtd").val());

        if (!matId || !qtd) return;

        let mat = materiais.find(m => m.id == matId);
        let custo = mat.valor_grama * qtd;
        total += custo;

        $(this).find(".custoMat").text(`R$ ${custo.toFixed(2)}`);
    });

    $("#totalCusto").text(total.toFixed(2));
}

// ================================
// ADICIONAR PRODUTO
// ================================
$("#addProduto").click(function () {
    let produto = {
        nome: $("#prodNome").val(),
        tamanho: $("#prodTam").val(),
        materiais: []
    };

    $("#tabelaMateriaisProd tr").each(function () {
        let matId = parseInt($(this).find(".matSelect").val(), 10);
        let qtd = parseFloat($(this).find(".matQtd").val());

        if (matId && qtd) {
            produto.materiais.push({ id: matId, quantidade: qtd });
        }
    });

    $.ajax({
        url: `${API}/produtos`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify(produto),
        success: function () {
            if ($("#tabelaProdutosLista").is(":visible")) {
                carregarProdutos();
            }
            alert("Produto cadastrado!");
        }
    });
});

function atualizarTabelaProdutos() {
    let tabela = $("#listaProdutos");
    tabela.html("");

    produtos.forEach(p => {
        // Monta string detalhando os materiais
        let materiaisDetalhe = p.materiais.map(m => {
            let nome = m.nome; // nome do material
            let qtd = parseFloat(m.quantidade).toFixed(2);
            let valor = parseFloat(m.valor_grama).toFixed(2);
            let custo = (valor * m.quantidade).toFixed(2);
            return `${nome}: ${qtd}g (R$ ${custo})`;
        }).join("<br>");

        tabela.append(`
            <tr>
                <td>${p.id}</td>
                <td>${p.nome}</td>
                <td>${p.tamanho}</td>
                <td>${materiaisDetalhe}</td>
                <td>R$ ${parseFloat(p.custo_total).toFixed(2)}</td>
                <td>
                    <button class="btnProduzir" data-id="${p.id}">Produzir</button>
                    <button class="btnEditarProduto" data-id="${p.id}">Editar</button>
                    <button class="btnExcluirProduto" data-id="${p.id}">Excluir</button>
                </td>
            </tr>
        `);
    });
}


// ================================
// EDITAR PRODUTO
// ================================
$(document).on("click", ".btnEditarProduto", function () {
    let id = $(this).data("id");
    let prod = produtos.find(p => p.id == id);

    let nome = prompt("Nome:", prod.nome);
    let tamanho = prompt("Tamanho:", prod.tamanho);

    // === EDITAR MATERIAIS ===
    let novosMateriais = [];

    prod.materiais.forEach((m) => {
        let novaQtd = prompt(
            `Material: ${m.nome}\nQuantidade atual (g): ${m.quantidade}\nNova quantidade (g):`,
            m.quantidade
        );

        if (novaQtd !== null && !isNaN(parseFloat(novaQtd))) {
            novosMateriais.push({
                material_id: m.material_id || m.id,
                quantidade: parseFloat(novaQtd)
            });
        }
    });

    $.ajax({
        url: `${API}/produtos/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
            nome,
            tamanho,
            materiais: novosMateriais
        }),
        success: function () {
            if ($("#tabelaProdutosLista").is(":visible")) {
                carregarProdutos();
            }
            alert("Produto atualizado!");
        },
        error: function (xhr) {
            alert("Erro ao atualizar: " + xhr.responseText);
        }
    });
});


// ================================
// EXCLUIR PRODUTO
// ================================
$(document).on("click", ".btnExcluirProduto", function () {
    let id = $(this).data("id");

    if (!confirm("Excluir produto?")) return;

    $.ajax({
        url: `${API}/produtos/${id}`,
        method: "DELETE",
        success: function () {
            alert("Produto removido!");

            // limpa visualmente para evitar ID fantasma
            $("#listaProdutos").html("");

            // recarrega lista real do servidor
            carregarProdutos();
        },
        error: function (xhr) {
            alert("Erro ao remover: " + xhr.responseText);
        }
    });
});

// ================================
// PRODUZIR PRODUTO
// ================================
$(document).on("click", ".btnProduzir", function () {
    let id = $(this).data("id");
    let qtd = parseInt(prompt("Quantas unidades deseja produzir?"), 10);

    if (!qtd || qtd <= 0) {
        alert("Quantidade inválida.");
        return;
    }

    $.ajax({
        url: `${API}/em_producao`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({
            produto_id: id,
            quantidade: qtd
        }),
        success: function () {
            alert("Item enviado para a fila de produção!");

            if ($("#tabelaEmProducaoLista").is(":visible")) carregarEmProducao();
            if ($("#tabelaMateriaisLista").is(":visible")) carregarMateriais();
        },
        error: function (xhr) {
            alert("Erro: " + xhr.responseText);
        }
    });
}); 

// =======================================================================
// AÇÕES DE PRODUÇÃO
// =======================================================================

// Concluir produção (versão com captura de erro do backend)
$(document).on("click", ".btnConcluirProducao", function () {
    let id = $(this).data("id");

    fetch(`${API}/em_producao/${id}/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
    })
    .then(async res => {
        if (!res.ok) {
            let erro = await res.json();
            alert(erro.error); // 🛑 Mostra exatamente: "Produção Interrompida: O material X está em falta!"
            return;
        }

        alert("Produção concluída!");
        carregarEmProducao();
        if ($("#tabelaProducoesLista").is(":visible")) carregarProducoes();
    })
    .catch(err => {
        console.error(err);
        alert("Erro inesperado ao finalizar produção.");
    });
});

// Excluir produção da fila (devolve materiais)
$(document).on("click", ".btnExcluirProducao", function () {
    let id = $(this).data("id");

    if (!confirm("Deseja remover este item da produção? Os materiais serão devolvidos ao estoque.")) return;

    $.ajax({
        url: `${API}/em_producao/${id}`,
        method: "DELETE",
        success: function () {
            alert("Item removido da produção. Materiais devolvidos ao estoque.");
            carregarEmProducao();
            if ($("#tabelaMateriaisLista").is(":visible")) carregarMateriais();
        }

    });
});

// ================================
// EM PRODUÇÃO
// ================================
function carregarEmProducao() {
    $.get(`${API}/em_producao`, function (data) {
        atualizarTabelaEmProducao(data);
    });
}

function atualizarTabelaEmProducao(lista) {
    let tabela = $("#listaEmProducao");
    tabela.html("");

    lista.forEach(p => {
        tabela.append(`
            <tr>
                <td>${p.id}</td>
                <td>${p.nome_produto}</td>
                <td>${p.tamanho}</td>
                <td>R$ ${parseFloat(p.custo_total).toFixed(2)}</td>
                <td>${p.quantidade}</td>
                <td>
                    <button class="btnConcluirProducao" data-id="${p.id}">Concluído</button>
                    <button class="btnExcluirProducao" data-id="${p.id}">Excluir</button>
                </td>
            </tr>
        `);
    });
}

// ================================
// PRODUÇÕES
// ================================
function carregarProducoes() {
    $.get(`${API}/producoes`, function (data) {
        atualizarTabelaProducoes(data);
    });
}

function atualizarTabelaProducoes(lista) {
    let tabela = $("#listaProducoes");
    tabela.html("");

    lista.forEach(p => {
        tabela.append(`
            <tr>
                <td>${p.id}</td>
                <td>${p.nome_produto}</td>
                <td>R$ ${parseFloat(p.custo_total).toFixed(2)}</td>
                <td>${p.quantidade}</td>
                <td>${new Date(p.data).toLocaleString()}</td>

            </tr>
        `);
    });
}

// ================================
// RELATÓRIO DE PRODUÇÕES
// ================================

$("#filtroRelatorio").change(function () {
    if ($(this).val() === "periodo") {
        $("#filtroPeriodo").show();
    } else {
        $("#filtroPeriodo").hide();
    }
});

$("#btnGerarRelatorio").click(function () {
    const filtro = $("#filtroRelatorio").val();
    let dataInicial = $("#dataInicial").val();
    let dataFinal = $("#dataFinal").val();

    $.get(`${API}/producoes`, function (lista) {
        let hoje = new Date();
        let inicio, fim;

        switch (filtro) {
            case "diario":
                inicio = new Date(hoje.setHours(0, 0, 0, 0));
                fim = new Date(hoje.setHours(23, 59, 59, 999));
                break;

            case "semanal":
                const diaSemana = hoje.getDay();
                inicio = new Date(hoje);
                inicio.setDate(hoje.getDate() - diaSemana);
                inicio.setHours(0, 0, 0, 0);
                fim = new Date();
                break;

            case "mensal":
                inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
                fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59, 999);
                break;

            case "anual":
                inicio = new Date(hoje.getFullYear(), 0, 1);
                fim = new Date(hoje.getFullYear(), 11, 31, 23, 59, 59, 999);
                break;

            case "periodo":
                if (!dataInicial || !dataFinal) {
                    alert("Selecione as datas inicial e final");
                    return;
                }
                inicio = new Date(dataInicial);
                fim = new Date(dataFinal + " 23:59:59");
                break;
        }

        // Filtra produções por data
        const filtradas = lista.filter(p => {
            const dataProd = new Date(p.data);
            return dataProd >= inicio && dataProd <= fim;
        });

        let tabela = $("#relatorioProducoes");
        tabela.html("");

        // Acumuladores
        let totalProdutos = {};
        let totalMateriais = {};
        let totalGeralMateriais = 0;

        // Processar cada produção
        let processadas = 0;

        filtradas.forEach(p => {
            // Acumula quantidade do produto
            if (!totalProdutos[p.nome_produto])
                totalProdutos[p.nome_produto] = 0;

            totalProdutos[p.nome_produto] += Number(p.quantidade);

            // Exibir linha da produção
            tabela.append(`
                <tr style="background:#eef;">
                    <td>${p.id}</td>
                    <td><b>${p.nome_produto}</b></td>
                    <td>R$ ${parseFloat(p.custo_total).toFixed(2)}</td>
                    <td>${p.quantidade}</td>
                    <td>${new Date(p.data).toLocaleString()}</td>
                </tr>
            `);

            // Buscar materiais usados
            $.get(`${API}/producoes_detalhes?producao_id=${p.id}`, function (materiais) {

                materiais.forEach(m => {
                    tabela.append(`
                        <tr class="detalheMaterial">
                            <td></td>
                            <td>→ ${m.material_nome}</td>
                            <td>R$ ${parseFloat(m.valor_total).toFixed(2)}</td>
                            <td>${m.quantidade_usada} g</td>
                            <td>R$ ${parseFloat(m.valor_unitario).toFixed(2)} /g</td>
                        </tr>
                    `);

                    // Acumular materiais
                    if (!totalMateriais[m.material_nome]) {
                        totalMateriais[m.material_nome] = {
                            quantidade: 0,
                            custo: 0
                        };
                    }

                    totalMateriais[m.material_nome].quantidade += Number(m.quantidade_usada);
                    totalMateriais[m.material_nome].custo += Number(m.valor_total);

                    totalGeralMateriais += Number(m.valor_total);
                });

                processadas++;
                if (processadas === filtradas.length) {
                    exibirTotais();
                }
            });
        });

        // Exibir totais finais
        function exibirTotais() {

            tabela.append(`
                <tr style="background:#ccc;">
                    <td colspan="5"><b>TOTAIS DE PRODUTOS</b></td>
                </tr>
            `);

            Object.keys(totalProdutos).forEach(prod => {
                tabela.append(`
                    <tr>
                        <td></td>
                        <td>${prod}</td>
                        <td></td>
                        <td><b>${totalProdutos[prod]}</b></td>
                        <td></td>
                    </tr>
                `);
            });

            tabela.append(`
                <tr style="background:#ccc;">
                    <td colspan="5"><b>TOTAIS DE MATERIAIS</b></td>
                </tr>
            `);

            Object.keys(totalMateriais).forEach(mat => {
                tabela.append(`
                    <tr>
                        <td></td>
                        <td>${mat}</td>
                        <td>R$ ${totalMateriais[mat].custo.toFixed(2)}</td>
                        <td>${totalMateriais[mat].quantidade} g</td>
                        <td></td>
                    </tr>
                `);
            });

            tabela.append(`
                <tr style="background:#bbb;">
                    <td colspan="5"><b>VALOR TOTAL DOS MATERIAIS: R$ ${totalGeralMateriais.toFixed(2)}</b></td>
                </tr>
            `);
        }
    });
});


// ============================================
// RELATÓRIO GERAL (PRODUTOS + MATERIAIS)
// ============================================

// Mostrar campos de período quando necessário
$("#filtroRelatorioEstoque").change(function () {
    $("#filtroPeriodoEstoque").toggle($(this).val() === "periodo");
});

// -------------------------------------------------
// Carregar materiais no filtro
// -------------------------------------------------
$.get(`${API}/materiais`, function (materiais) {
    materiais.forEach(m => {
        $("#filtroMaterialEstoque").append(`
            <option value="${m.id}">${m.nome}</option>
        `);
    });
});

// -------------------------------------------------
// GERAR RELATÓRIO GERAL
// -------------------------------------------------
$("#btnGerarRelatorioGeral").click(function () {

    const filtro = $("#filtroRelatorioGeral").val();

    let dataInicial = $("#dataInicialGeral").val();
    let dataFinal = $("#dataFinalGeral").val();

    // -------------- GERAR DATAS AUTOMÁTICAS ----------------
    let hoje = new Date();
    let inicio = null;
    let fim = null;

    switch (filtro) {
        case "diario":
            inicio = new Date();
            inicio.setHours(0, 0, 0, 0);
            fim = new Date();
            fim.setHours(23, 59, 59, 999);
            break;

        case "semanal":
            let diaSemana = hoje.getDay();
            inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - diaSemana);
            inicio.setHours(0, 0, 0, 0);
            fim = new Date();
            break;

        case "mensal":
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
            fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
            fim.setHours(23, 59, 59);
            break;

        case "anual":
            inicio = new Date(hoje.getFullYear(), 0, 1);
            fim = new Date(hoje.getFullYear(), 11, 31);
            fim.setHours(23, 59, 59);
            break;

        case "periodo":
            if (!dataInicial || !dataFinal) {
                alert("Selecione as datas!");
                return;
            }
            inicio = new Date(`${dataInicial} 00:00:00`);
            fim = new Date(`${dataFinal} 23:59:59`);
            break;
    }

    // --------------------------------------
    // MONTAR QUERY STRING COM FILTRO DE MATERIAL
    // --------------------------------------
    let params = [];
    let materialId = $("#filtroMaterialEstoque").val(); // pega material selecionado

    if (inicio) params.push(`data_inicio=${inicio.toISOString().slice(0, 10)}`);
    if (fim) params.push(`data_fim=${fim.toISOString().slice(0, 10)}`);
    if (materialId) params.push(`material_id=${materialId}`); // adiciona filtro por material

    const url = `${API}/estoque?${params.join("&")}`;

    // --------------------------------------
    // CHAMAR API
    // --------------------------------------
    $.get(url, function (lista) {

        // Limpando tabelas
        $("#tabelaResumoProdutosMateriais").html("");
        $("#tabelaResumoMateriais").html("");
        $("#tabelaTotalGeral").html("");

        // Acumuladores
        let produtos = {};
        let materiais = {};
        let totalGeral = 0;

        lista.forEach(item => {

            let nomeProd = item.nome_produto || "";
            let qtdProd = Number(item.qtd_produto || 0);
            let precoProd = Number(item.preco_produto || 0);

            let nomeMat = item.material_nome || "";
            let qtdMat = Number(item.qtd_material || 0);
            let precoMat = Number(item.preco_material || 0);

            // ----------- PRODUTOS -----------
            if (qtdProd > 0) {
                if (!produtos[nomeProd]) {
                    produtos[nomeProd] = {
                        qtd: 0,
                        preco: 0,
                        totalMateriais: 0,
                        custoMateriais: 0
                    };
                }
                produtos[nomeProd].qtd += qtdProd;
                produtos[nomeProd].preco += precoProd;
            }

            // ----------- MATERIAIS -----------
            if (qtdMat > 0) {
                if (!materiais[nomeMat]) {
                    materiais[nomeMat] = { qtd: 0, preco: 0 };
                }
                materiais[nomeMat].qtd += qtdMat;
                materiais[nomeMat].preco += precoMat;

                // adicionar custo do material ao produto correspondente, se existir
                if (nomeProd && produtos[nomeProd]) {
                    produtos[nomeProd].totalMateriais += qtdMat;
                    produtos[nomeProd].custoMateriais += precoMat;
                }
            }

            // ----------- TOTAL GERAL -----------
            totalGeral += precoProd + precoMat;
        });

        // --------------------------------------
        // TABELA PRINCIPAL: PRODUTOS + MATERIAIS
        // --------------------------------------
        Object.keys(produtos).forEach(nome => {
            let p = produtos[nome];
            $("#tabelaResumoProdutosMateriais").append(`
                <tr>
                    <td>${nome}</td>
                    <td>${p.qtd}</td>
                    <td>R$ ${p.preco.toFixed(2)}</td>
                    <td>${p.totalMateriais} g</td>
                    <td>R$ ${p.custoMateriais.toFixed(2)}</td>
                    <td>R$ ${(p.preco + p.custoMateriais).toFixed(2)}</td>
                </tr>
            `);
        });

        // --------------------------------------
        // RESUMO GERAL DE MATERIAIS
        // --------------------------------------
        Object.keys(materiais).forEach(nome => {
            let m = materiais[nome];
            $("#tabelaResumoMateriais").append(`
                <tr>
                    <td>${nome}</td>
                    <td>${m.qtd} g</td>
                    <td>R$ ${m.preco.toFixed(2)}</td>
                </tr>
            `);
        });

        // --------------------------------------
        // TOTAL GERAL
        // --------------------------------------
        $("#tabelaTotalGeral").html(`
            <tr>
                <td>Geral</td>
                <td>-</td>
                <td>R$ ${totalGeral.toFixed(2)}</td>
            </tr>
        `);

    });

});
