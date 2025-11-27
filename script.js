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
        carregarProdutos();
    }
});

$("#btnMostrarProducoes").click(function () {
    $("#tabelaProducoesLista").toggle();
    if ($("#tabelaProducoesLista").is(":visible")) {
        carregarProducoes();
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
        tabela.append(`
            <tr>
                <td>${p.id}</td>
                <td>${p.nome}</td>
                <td>${p.tamanho}</td>
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

    $.ajax({
        url: `${API}/produtos/${id}`,
        method: "PUT",
        contentType: "application/json",
        data: JSON.stringify({
            nome,
            tamanho,
            materiais: prod.materiais
        }),
        success: function () {
            if ($("#tabelaProdutosLista").is(":visible")) {
                carregarProdutos();
            }
            alert("Produto atualizado!");
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
            if ($("#tabelaProdutosLista").is(":visible")) {
                carregarProdutos();
            }
            alert("Produto removido!");
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
        url: `${API}/produzir/${id}`,
        method: "POST",
        contentType: "application/json",
        data: JSON.stringify({ quantidade: qtd }),
        success: function () {
            alert(`Produção registrada! (${qtd} unidades). Estoque atualizado.`);
            if ($("#tabelaMateriaisLista").is(":visible")) carregarMateriais();
            if ($("#tabelaProducoesLista").is(":visible")) carregarProducoes();
        },
        error: function (xhr) {
            alert("Erro: " + xhr.responseJSON.error);
        }
    });
});

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
                <td>${new Date(p.data + "Z").toLocaleString()}</td>
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
                let primeiroDia = hoje.getDate() - hoje.getDay();
                inicio = new Date(hoje.setDate(primeiroDia));
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
                fim = new Date(dataFinal);
                fim.setHours(23, 59, 59, 999);
                break;
        }

        const filtradas = lista.filter(p => {
            const dataProd = new Date(p.data + "Z");
            return dataProd >= inicio && dataProd <= fim;
        });

        let tabela = $("#relatorioProducoes");
        tabela.html("");
        filtradas.forEach(p => {
            tabela.append(`
                <tr>
                    <td>${p.id}</td>
                    <td>${p.nome_produto}</td>
                    <td>R$ ${parseFloat(p.custo_total).toFixed(2)}</td>
                    <td>${p.quantidade}</td>
                    <td>${new Date(p.data + "Z").toLocaleString()}</td>
                </tr>
            `);
        });
    });
});

