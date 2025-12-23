Tecido App – Sistema Web de Gestão de Materiais, Produção e Custos
1. Apresentação
O Tecido App é uma aplicação web desenvolvida para controle de materiais, cálculo de custos, gestão de produção e geração de relatórios gerenciais.
O sistema foi projetado seguindo princípios de separação de responsabilidades, persistência em banco de dados relacional e arquitetura cliente-servidor, conceitos amplamente utilizados em ambientes corporativos e institucionais.
O projeto demonstra competências práticas em desenvolvimento web, modelagem e consulta a banco de dados, integração frontend/backend e geração de relatórios, alinhando-se aos requisitos de sistemas desenvolvidos em plataformas como Oracle APEX.
________________________________________
2. Arquitetura do Sistema
A aplicação segue o modelo Frontend desacoplado + API REST:
•	Frontend
o	HTML5
o	CSS3
o	JavaScript (jQuery)
o	jsPDF + AutoTable (relatórios em PDF)
•	Backend
o	Python 3
o	Flask (API REST)
o	MySQL (banco de dados relacional)
o	Hospedagem: PythonAnywhere
O frontend consome exclusivamente a API REST, não realizando persistência local de dados, garantindo integridade e rastreabilidade das informações.
________________________________________
3. Funcionalidades Principais
3.1 Gestão de Materiais
•	Cadastro, edição e exclusão lógica (soft delete)
•	Controle de estoque em gramas
•	Cálculo automático do custo unitário
•	Registro de movimentações de entrada e ajuste
•	Histórico de alterações preservado em banco
3.2 Gestão de Produtos
•	Cadastro de produtos compostos por múltiplos materiais
•	Associação produto × materiais (ficha técnica)
•	Cálculo automático do custo total do produto
•	Atualização dinâmica de custos ao editar materiais
3.3 Controle de Produção
•	Envio de produtos para fila de produção
•	Validação automática de estoque
•	Reserva e baixa de materiais
•	Finalização e cancelamento de produção
•	Registro histórico com snapshot de custos
3.4 Relatórios Gerenciais
•	Histórico de produções com filtros por período
•	Consolidação por produto
•	Consolidação por material
•	Relatório geral de custos e quantidades
•	Exportação em PDF com layout A4
________________________________________
4. Banco de Dados
O sistema utiliza MySQL, com estrutura relacional normalizada, contemplando:
•	Materiais
•	Produtos
•	Relação produto × materiais
•	Produções
•	Detalhamento de materiais consumidos
•	Histórico de estoque
Boas práticas aplicadas:
•	Uso de chaves estrangeiras
•	Soft delete para preservação de histórico
•	Uso de Decimal para valores financeiros
•	Consultas com JOINs e filtros por período
•	Tratamento de valores nulos para evitar inconsistências no frontend
Esses conceitos são diretamente equivalentes aos utilizados em ambientes Oracle Database e Oracle APEX.
________________________________________
5. API REST (Backend)
A API foi desenvolvida em Flask, com endpoints RESTful bem definidos:
Principais endpoints:
•	GET /materiais
•	POST /materiais
•	PUT /materiais/{id}
•	DELETE /materiais/{id}
•	GET /produtos
•	POST /produtos
•	PUT /produtos/{id}
•	DELETE /produtos/{id}
•	POST /em_producao
•	GET /em_producao
•	POST /em_producao/{id}/finalizar
•	DELETE /em_producao/{id}
•	GET /producoes
•	GET /producoes_detalhes
•	GET /estoque
A API centraliza toda a lógica de negócio, garantindo:
•	Integridade de dados
•	Controle de estoque transacional
•	Histórico confiável de custos
•	Base sólida para relatórios
________________________________________
6. Frontend Web
O frontend foi desenvolvido como uma Single Page Application (SPA simples), organizada em seções lógicas:
•	Cadastro de materiais
•	Cadastro de produtos
•	Produção
•	Histórico de produções
•	Relatórios
Características técnicas:
•	Manipulação dinâmica do DOM com jQuery
•	Cálculos realizados com base nos dados retornados pela API
•	Nenhuma regra de negócio crítica no HTML
•	Layout responsivo para desktop e dispositivos móveis
________________________________________
7. Relatórios e Análise de Dados
O sistema oferece relatórios com filtros por:
•	Dia
•	Semana
•	Mês
•	Ano
•	Período específico
Os dados são consolidados no frontend a partir de endpoints analíticos, permitindo:
•	Análise de produção
•	Controle de custos
•	Auditoria de consumo de materiais
Os relatórios podem ser exportados em PDF, funcionalidade comum em sistemas administrativos e corporativos.
________________________________________
8. Relação com Oracle APEX
Embora o projeto utilize HTML, JavaScript e Flask, os conceitos aplicados são diretamente compatíveis com Oracle APEX, tais como:
•	CRUD baseado em banco de dados relacional
•	Relatórios com filtros por período
•	Consolidação de dados para análise gerencial
•	Separação entre camada de apresentação e persistência
•	Regras de negócio centralizadas no backend
O projeto demonstra domínio dos fundamentos exigidos para desenvolvimento em Oracle APEX, com facilidade de adaptação à plataforma.
________________________________________
9. Deploy
•	Frontend: hospedado via GitHub Pages (ou servidor estático)
•	Backend: PythonAnywhere
•	Banco de Dados: MySQL
A API está disponível publicamente para consumo pelo frontend.
________________________________________
10. Objetivo Acadêmico e Profissional
Este projeto foi desenvolvido com foco em:
•	Aprendizado prático em programação web
•	Integração com banco de dados
•	Desenvolvimento de sistemas administrativos
•	Geração de relatórios e análise de dados
O sistema atende aos requisitos técnicos esperados em ambientes institucionais como o Tribunal de Contas da União, especialmente para atividades relacionadas a desenvolvimento web, banco de dados e sistemas de apoio à decisão. 

11. Acesso à aplicação
O projeto encontra-se publicado para fins de demonstração técnica no seguinte endereço:
https://camarsanmoises-glitch.github.io/calcula-materiais/
