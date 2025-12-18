from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(
    app,
    resources={r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE"],
        "allow_headers": "*"
    }}
)
# =====================================
# CONFIGURAÇÃO DO BANCO
# =====================================
db_config = {
    "user": "camarsan",
    "password": "N@t17590744Nat",  # Substitua pela sua senha do MySQL
    "host": "camarsan.mysql.pythonanywhere-services.com",
    "database": "camarsan$calculafacil"
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# =====================================
# MATERIAIS
# =====================================
@app.route("/materiais", methods=["GET"])
def listar_materiais():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM materiais")
    resultados = cursor.fetchall()
    cursor.close()
    conn.close()

    # Correção aplicada aqui!
    materiais = []
    for row in resultados:
        materiais.append({
            "id": row["id"],
            "nome": row["nome"],
            "cor": row["cor"],
            "valor_grama": row["valor_grama"] or 0,
            "estoque": row["estoque"] or 0
        })

    return jsonify(materiais)


@app.route("/materiais", methods=["POST"])
def adicionar_material():
    data = request.json

    nome = data.get("nome")
    cor = data.get("cor")

    # Correção importante!
    valor_grama = float(data.get("valor_grama") or 0)
    estoque = float(data.get("estoque") or 0)

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO materiais (nome, cor, valor_grama, estoque) VALUES (%s, %s, %s, %s)",
        (nome, cor, valor_grama, estoque)
    )
    conn.commit()
    novo_id = cursor.lastrowid
    cursor.close()
    conn.close()

    return jsonify({"message": "Material cadastrado!", "id": novo_id})


@app.route("/materiais/<int:material_id>", methods=["PUT"])
def editar_material(material_id):
    data = request.json

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscar material atual
    cursor.execute("SELECT * FROM materiais WHERE id=%s", (material_id,))
    material = cursor.fetchone()

    if not material:
        cursor.close()
        conn.close()
        return jsonify({"error": "Material não encontrado"}), 404

    # Mantém valores antigos se não vierem no JSON
    nome = data.get("nome", material["nome"])
    cor = data.get("cor", material["cor"])
    valor_grama = float(data.get("valor_grama", material["valor_grama"]))
    novo_estoque = float(data.get("estoque", material["estoque"]))

    estoque_antes = float(material["estoque"])

    cursor.execute("""
        UPDATE materiais
        SET nome=%s, cor=%s, valor_grama=%s, estoque=%s
        WHERE id=%s
    """, (nome, cor, valor_grama, novo_estoque, material_id))

    # Histórico de estoque
    if novo_estoque != estoque_antes:
        tipo = "ENTRADA" if novo_estoque > estoque_antes else "SAIDA"
        quantidade = abs(novo_estoque - estoque_antes)

        cursor.execute("""
            INSERT INTO historico_estoque
            (material_id, nome_material, tipo, quantidade, estoque_antes, estoque_depois, origem, data_movimentacao)
            VALUES (%s, %s, %s, %s, %s, %s, %s, NOW())
        """, (
            material_id,
            nome,
            tipo,
            quantidade,
            estoque_antes,
            novo_estoque,
            "REPOSIÇÃO"
        ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Material atualizado com sucesso!"})


@app.route("/materiais/<int:material_id>", methods=["DELETE"])
def excluir_material(material_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM materiais WHERE id=%s", (material_id,))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Material removido!"})

# =====================================
# PRODUTOS
# =====================================
@app.route("/produtos", methods=["GET"])
def listar_produtos():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT * FROM produtos")
    produtos = cursor.fetchall()

    for prod in produtos:
        cursor.execute("""
            SELECT m.id, m.nome, m.cor, m.valor_grama, pm.quantidade
            FROM produto_materiais pm
            JOIN materiais m ON pm.material_id = m.id
            WHERE pm.produto_id = %s
        """, (prod["id"],))
        
        prod["materiais"] = cursor.fetchall()

    cursor.close()
    conn.close()
    return jsonify(produtos)


@app.route("/produtos", methods=["POST"])
def adicionar_produto():
    data = request.json
    conn = get_db_connection()
    cursor = conn.cursor()
    custo_total = 0
    for item in data["materiais"]:
        cursor.execute("SELECT valor_grama FROM materiais WHERE id=%s", (int(item["id"]),))
        valor = cursor.fetchone()[0]
        custo_total += float(item["quantidade"]) * float(valor)
    cursor.execute(
        "INSERT INTO produtos (nome, tamanho, custo_total) VALUES (%s, %s, %s)",
        (data["nome"], data["tamanho"], custo_total)
    )
    produto_id = cursor.lastrowid
    for item in data["materiais"]:
        cursor.execute(
            "INSERT INTO produto_materiais (produto_id, material_id, quantidade) VALUES (%s, %s, %s)",
            (produto_id, int(item["id"]), float(item["quantidade"]))
        )
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({"message": "Produto cadastrado!", "id": produto_id})

@app.route("/produtos/<int:produto_id>", methods=["PUT"])
def editar_produto(produto_id):
    data = request.json

    nome = data.get("nome")
    tamanho = data.get("tamanho")
    materiais = data.get("materiais", [])

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Atualiza nome e tamanho
    cursor.execute("""
        UPDATE produtos
        SET nome=%s, tamanho=%s
        WHERE id=%s
    """, (nome, tamanho, produto_id))

    # Remove materiais antigos
    cursor.execute("DELETE FROM produto_materiais WHERE produto_id=%s", (produto_id,))

    # Recalcular custo_total
    custo_total = 0

    for item in materiais:
        material_id = int(item["material_id"])
        quantidade = float(item["quantidade"])

        # Buscar valor da grama
        cursor.execute("SELECT valor_grama FROM materiais WHERE id=%s", (material_id,))
        valor = cursor.fetchone()["valor_grama"]

        # Somar ao custo total
        custo_total += quantidade * float(valor)

        # Inserir material atualizado
        cursor.execute("""
            INSERT INTO produto_materiais (produto_id, material_id, quantidade)
            VALUES (%s, %s, %s)
        """, (produto_id, material_id, quantidade))

    # Atualiza custo total no produto
    cursor.execute("""
        UPDATE produtos
        SET custo_total=%s
        WHERE id=%s
    """, (custo_total, produto_id))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Produto atualizado!"})


@app.route("/produtos/<int:produto_id>", methods=["DELETE"])
def excluir_produto(produto_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Primeiro remove materiais vinculados ao produto
    cursor.execute("DELETE FROM produto_materiais WHERE produto_id=%s", (produto_id,))

    # Agora sim pode remover o produto
    cursor.execute("DELETE FROM produtos WHERE id=%s", (produto_id,))

    conn.commit()
    cursor.close()
    conn.close()
    
    return jsonify({"message": "Produto removido!"})

# =====================================
# PRODUÇÃO
# =====================================
@app.route("/produzir/<int:id_produto>", methods=["POST"])
def produzir_produto(id_produto):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Buscar produto
    cursor.execute("SELECT * FROM produtos WHERE id = %s", (id_produto,))
    produto = cursor.fetchone()
    if not produto:
        cursor.close()
        conn.close()
        return jsonify({"error": "Produto não encontrado"}), 404

    # Buscar materiais do produto
    cursor.execute("""
        SELECT 
            m.id AS id_material,
            m.nome,
            pm.quantidade AS qtd,
            m.valor_grama AS valor_unitario
        FROM produto_materiais pm
        JOIN materiais m ON pm.material_id = m.id
        WHERE pm.produto_id = %s
    """, (id_produto,))
    materiais = cursor.fetchall()

    # Calcular custo total
    custo_total = sum(m["qtd"] * m["valor_unitario"] for m in materiais)

    # 1) Criar registro na tabela producoes
    cursor.execute("""
        INSERT INTO producoes 
        (produto_id, nome_produto, quantidade, custo_total, data)
        VALUES (%s, %s, %s, %s, NOW())
    """, (id_produto, produto["nome"], 1, custo_total))

    producao_id = cursor.lastrowid

    # 2) Salvar snapshot dos materiais usados
    for m in materiais:
        cursor.execute("""
            INSERT INTO producoes_detalhes
            (producao_id, material_id, material_nome, quantidade_usada, valor_unitario, valor_total)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            producao_id,
            m["id_material"],  # salva o ID corretamente
            m["nome"],
            m["qtd"],
            m["valor_unitario"],
            m["qtd"] * m["valor_unitario"]
        ))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"status": "Produção registrada com sucesso"})


# =====================================
# EM PRODUÇÃO (FILA)
# =====================================

@app.route("/em_producao", methods=["GET"])
def listar_em_producao():
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT e.id, p.nome AS nome_produto, p.tamanho, e.quantidade, e.custo_total
        FROM em_producao e
        JOIN produtos p ON e.produto_id = p.id
    """)
    dados = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(dados)


@app.route("/em_producao", methods=["POST"])
def adicionar_em_producao():
    data = request.json
    produto_id = data["produto_id"]

    from decimal import Decimal
    quantidade = Decimal(str(data["quantidade"]))  # <-- Correto

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Busca custo do produto
    cursor.execute("SELECT custo_total FROM produtos WHERE id=%s", (produto_id,))
    prod = cursor.fetchone()
    from decimal import Decimal
    custo_unit = Decimal(str(prod["custo_total"]))


    # Agora sim podemos calcular o custo final
    custo_total = custo_unit * quantidade

    # Insere na fila
    cursor.execute("""
        INSERT INTO em_producao (produto_id, quantidade, custo_total, data_inicio)
        VALUES (%s, %s, %s, NOW())
    """, (produto_id, quantidade, custo_total))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Adicionado à fila de produção!"})


@app.route("/em_producao/<int:item_id>", methods=["DELETE"])
def remover_em_producao(item_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Recupera dados
    cursor.execute("SELECT * FROM em_producao WHERE id=%s", (item_id,))
    item = cursor.fetchone()
    if not item:
        return jsonify({"error": "Item não encontrado"}), 404

    # Devolve materiais ao estoque
    cursor.execute("SELECT * FROM produto_materiais WHERE produto_id=%s", (item["produto_id"],))
    materiais = cursor.fetchall()

    from decimal import Decimal

    for mat in materiais:
        qtd_mat = Decimal(str(mat["quantidade"]))
        qtd_item = Decimal(str(item["quantidade"]))
        qtd_devolver = qtd_mat * qtd_item

        cursor.execute("""
            UPDATE materiais SET estoque = estoque + %s
            WHERE id = %s
        """, (qtd_devolver, mat["material_id"]))

    # Apaga da fila DEPOIS do loop
    cursor.execute("DELETE FROM em_producao WHERE id=%s", (item_id,))
    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({"message": "Removido da fila e materiais devolvidos!"})


@app.route("/em_producao/<int:item_id>/finalizar", methods=["POST"])
def finalizar_producao(item_id):
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    # Recupera item da fila
    cursor.execute("SELECT * FROM em_producao WHERE id=%s", (item_id,))
    item = cursor.fetchone()
    if not item:
        return jsonify({"error": "Item não encontrado"}), 404

    # Buscar nome do produto
    cursor.execute("SELECT nome FROM produtos WHERE id=%s", (item["produto_id"],))
    prod = cursor.fetchone()

    # Buscar materiais necessários
    cursor.execute("""
        SELECT pm.material_id, pm.quantidade AS qtd_por_unidade,
               m.nome AS nome_material, m.estoque, m.valor_grama AS valor_unitario
        FROM produto_materiais pm
        JOIN materiais m ON m.id = pm.material_id
        WHERE pm.produto_id = %s
    """, (item["produto_id"],))
    materiais = cursor.fetchall()

    from decimal import Decimal
    qtd_item = Decimal(str(item["quantidade"]))

    # 🔒 VERIFICAÇÃO DE ESTOQUE (antes de descontar)
    for mat in materiais:
        qtd_necessaria = Decimal(str(mat["qtd_por_unidade"])) * qtd_item
        if mat["estoque"] < qtd_necessaria:
            cursor.close()
            conn.close()
            return jsonify({
                "error": f"Produção Interrompida: O material '{mat['nome_material']}' está em falta!"
            }), 400

    # 🔥 DESCONTAR ESTOQUE (só se tudo estiver OK)
    for mat in materiais:
        qtd_necessaria = Decimal(str(mat["qtd_por_unidade"])) * qtd_item
        cursor.execute("""
            UPDATE materiais
            SET estoque = estoque - %s
            WHERE id = %s
        """, (qtd_necessaria, mat["material_id"]))

    # Registrar na tabela producoes
    cursor.execute("""
        INSERT INTO producoes (produto_id, nome_produto, quantidade, custo_total, data)
        VALUES (%s, %s, %s, %s, NOW())
    """, (
        item["produto_id"],
        prod["nome"],
        item["quantidade"],
        item["custo_total"]
    ))
    producao_id = cursor.lastrowid  # pegar id da produção recém-criada

    # Registrar detalhes na tabela producoes_detalhes
    for mat in materiais:
        qtd_necessaria = Decimal(str(mat["qtd_por_unidade"])) * qtd_item
        valor_unitario = Decimal(str(mat["valor_unitario"] or 0))
        cursor.execute("""
            INSERT INTO producoes_detalhes
            (producao_id, material_id, material_nome, quantidade_usada, valor_unitario, valor_total)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            producao_id,
            mat["material_id"],
            mat["nome_material"],
            qtd_necessaria,
            valor_unitario,
            qtd_necessaria * valor_unitario
        ))

    # Remover da fila
    cursor.execute("DELETE FROM em_producao WHERE id=%s", (item_id,))

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({"message": "Produção concluída e detalhes registrados!"})

@app.route("/producoes", methods=["GET"])
def listar_producoes():
    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT
            p.id,
            p.nome_produto,
            p.quantidade,
            p.custo_total,
            p.data
        FROM producoes p
        WHERE 1=1
    """

    params = []

    if data_inicio:
        query += " AND p.data >= %s"
        params.append(data_inicio + " 00:00:00")

    if data_fim:
        query += " AND p.data <= %s"
        params.append(data_fim + " 23:59:59")

    query += " ORDER BY p.data DESC, p.id DESC"

    cursor.execute(query, params)
    dados = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(dados)

@app.route("/producoes_detalhes", methods=["GET"])
def listar_producoes_detalhes():
    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT 
            pd.id,
            pd.material_id,
            pd.material_nome,
            pd.quantidade_usada,
            pd.valor_unitario,
            pd.valor_total,
            p.data AS data_producao
        FROM producoes_detalhes pd
        JOIN producoes p ON p.id = pd.producao_id
        WHERE 1=1
    """

    params = []

    if data_inicio:
        query += " AND p.data >= %s"
        params.append(data_inicio + " 00:00:00")

    if data_fim:
        query += " AND p.data <= %s"
        params.append(data_fim + " 23:59:59")

    query += " ORDER BY p.data DESC"

    cursor.execute(query, params)
    dados = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(dados)

@app.route("/estoque", methods=["GET"])
def relatorio_geral():
    material_id = request.args.get("material_id")
    data_inicio = request.args.get("data_inicio")
    data_fim = request.args.get("data_fim")

    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)

    query = """
        SELECT
            p.id AS id_producao,
            p.nome_produto AS nome_produto,
            p.quantidade AS qtd_produto,
            p.custo_total AS preco_produto,
            p.data AS data_producao,

            pd.material_id,
            pd.material_nome AS nome_material,
            pd.quantidade_usada AS qtd_material,
            pd.valor_total AS preco_material

        FROM producoes p
        LEFT JOIN producoes_detalhes pd
            ON pd.producao_id = p.id
        WHERE 1=1
    """

    params = []

    # filtro por material_id (opcional)
    if material_id:
        query += " AND pd.material_id = %s"
        params.append(material_id)

    # filtro por data de produção
    if data_inicio:
        query += " AND p.data >= %s"
        params.append(data_inicio + " 00:00:00")
    if data_fim:
        query += " AND p.data <= %s"
        params.append(data_fim + " 23:59:59")

    query += " ORDER BY p.data DESC, p.id DESC"

    cursor.execute(query, params)
    dados = cursor.fetchall()

    cursor.close()
    conn.close()

    # Garantir campos numéricos corretos
    for row in dados:
        if row.get("qtd_produto") is None:
            row["qtd_produto"] = 0
        if row.get("preco_produto") is None:
            row["preco_produto"] = 0.0
        if row.get("qtd_material") is None:
            row["qtd_material"] = 0
        if row.get("preco_material") is None:
            row["preco_material"] = 0.0

    return jsonify(dados)

# =====================================
# RODAR API
# =====================================
if __name__ == "__main__":
    app.run(debug=True)
