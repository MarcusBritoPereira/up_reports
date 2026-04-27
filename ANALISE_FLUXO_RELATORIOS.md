# Análise do sistema atual e melhorias no fluxo de geração de relatórios

## 1) O que o sistema já consegue fazer hoje

### Backend (FastAPI)
- Expor API com CORS liberado para o front local (`http://localhost:5173`).
- Integrar com Instagram Graph API para:
  - dados de perfil;
  - insights básicos (`reach`, `impressions`, `profile_views`, `follower_count`);
  - lista de mídias recentes.
- Integrar com Meta Ads para listar campanhas da conta de anúncios.
- Gerenciar múltiplos clientes em banco (CRUD simples): cadastro, listagem e exclusão.

### Frontend (React)
- Selecionar cliente e trocar contexto de dados.
- Exibir:
  - visão geral de perfil Instagram;
  - grade de publicações;
  - cards de indicadores básicos.
- Permitir cadastro de cliente com token e IDs.

## 2) Gaps principais para relatório orgânico e tráfego pago

### Orgânico
1. **Série histórica incompleta**
   - O gráfico de crescimento usa `mockGrowth` fixo, sem dados reais persistidos.
2. **Ausência de consolidação por período**
   - Não há camada para comparar períodos (ex.: últimos 30 dias vs 30 dias anteriores).
3. **Sem métricas por conteúdo/tipo**
   - Falta separar Reels, Carrossel, Stories, etc., com ranking de desempenho.
4. **Sem funil orgânico**
   - Não há encadeamento padrão: alcance → engajamento → cliques/DMs → conversões.

### Tráfego pago
1. **Endpoint de campanhas muito básico**
   - Só retorna metadados de campanha (nome, status, orçamento), sem KPIs de performance.
2. **Sem leitura de insights de Ads**
   - Faltam métricas essenciais: investimento, impressões, CTR, CPC, CPM, CPA, ROAS, conversões.
3. **Sem recortes analíticos**
   - Não há quebra por campanha/conjunto/anúncio, placement, dispositivo, idade, gênero, localização.
4. **Sem atribuição e padronização de naming**
   - Ausência de estrutura para relacionar mídia paga com objetivos de negócio.

## 3) Inclusão de novos canais (Google Meu Negócio e Google Ads)

## 3.1 Google Meu Negócio (Perfil da Empresa no Google)
### Oportunidades de métricas
- Visualizações do perfil e ações (ligações, solicitações de rota, cliques no site).
- Volume e tendência de avaliações (nota média e novos reviews por período).
- Interações com fotos e posts do perfil.

### Requisitos técnicos
- OAuth por cliente (não armazenar credenciais em texto puro).
- Novo conector backend com cache e tratamento de limites de API.
- Modelo de dados com tabelas/coleções por canal e data para histórico.

## 3.2 Google Ads
### Oportunidades de métricas
- Custo, impressões, cliques, CTR, CPC médio, conversões, custo por conversão, valor de conversão, ROAS.
- Recortes por campanha, grupo de anúncios, palavra-chave (se aplicável) e rede.

### Requisitos técnicos
- Conector dedicado de autenticação e extração incremental (janela diária).
- Mapeamento de objetivos por tipo de campanha (Search, Display, Performance Max etc.).
- Normalização para comparar Meta Ads x Google Ads no mesmo painel.

## 4) Melhorias recomendadas no fluxo de geração de relatórios

## Fase 1 — Fundamentos de dados
1. **Criar camada de ingestão por canal** (Instagram, Meta Ads, Google Ads, GBP).
2. **Persistir snapshots diários** (não depender só de consulta em tempo real).
3. **Padronizar esquema analítico**:
   - dimensão: cliente, canal, campanha, data, objetivo;
   - fatos: alcance, impressões, cliques, custo, conversões, receita.
4. **Versionar indicadores** para manter consistência histórica.

## Fase 2 — Motor de relatórios
1. **Definir catálogo de KPIs por objetivo** (branding, tráfego, geração de leads, vendas).
2. **Implementar comparativos automáticos** (MoM/WoW/período anterior).
3. **Gerar insights automáticos** (ex.: “CTR caiu 18% após troca de criativo”).
4. **Adicionar score de qualidade por canal** para priorização de ações.

## Fase 3 — Produto e operação
1. **Templates de relatório** (executivo, tático, performance por canal).
2. **Agendamento e exportação** (PDF + link web + envio por e-mail/WhatsApp).
3. **Alertas proativos** (picos de custo, queda de conversão, comentários/reviews críticos).
4. **Governança de acesso** (perfis por cliente/equipe).

## 5) Quick wins de curto prazo (baixo esforço, alto impacto)

1. Substituir o gráfico mockado por dados reais do endpoint de insights.
2. Enriquecer endpoint de Ads com métricas de performance (não só metadados).
3. Criar endpoint único `/api/reports/overview?client_id=&period=` para consolidado.
4. Adicionar comparativo “período atual vs anterior” na UI.
5. Definir convenção de UTM e naming de campanhas para leitura unificada.

## 6) Riscos atuais e como mitigar

- **Segurança**: `access_token` de cliente salvo em texto puro.
  - Mitigar com criptografia em repouso + rotação + mascaramento na UI.
- **Confiabilidade**: consultas apenas online podem falhar por limite de API.
  - Mitigar com jobs agendados e cache de leitura.
- **Escalabilidade**: ausência de processamento assíncrono por lote.
  - Mitigar com fila de jobs para extração e agregação.

## 7) Visão de resultado esperado

Com essas melhorias, o sistema evolui de um dashboard operacional para uma **plataforma de inteligência de marketing multicanal**, unificando orgânico e pago, com leitura comparável entre Meta, Google Ads e Google Meu Negócio, e relatórios consistentes para tomada de decisão.
