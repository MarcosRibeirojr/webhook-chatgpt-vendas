// index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const { twiml: { MessagingResponse } } = require('twilio');

const app = express();

// ====== CONFIGURAÇÕES ======
const PORT = process.env.PORT || 10000; // Porta fixa
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ====== MIDDLEWARES ======
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====== MEMÓRIA DAS CONVERSAS POR CLIENTE ======
const historicoConversas = {};

// ====== FUNÇÃO: GERA RESPOSTA USANDO GPT ======
async function gerarResposta(numeroCliente, mensagemUsuario) {
  console.log(`📝 [IA] Gerando resposta para ${numeroCliente}: "${mensagemUsuario}"`);

  if (!historicoConversas[numeroCliente]) {
    historicoConversas[numeroCliente] = [
      {
        role: 'system',
        content:
          'Você é um atendente de vendas da Real Carnes. Especialista em produtos suínos (torresmo, linguiças, defumados). ' +
          'Responda de forma simpática, objetiva e sempre buscando vender ou sugerir produtos complementares. ' +
          'Se possível, sugira promoções e combos. Considere o histórico do cliente.'
      }
    ];
  }

  historicoConversas[numeroCliente].push({ role: 'user', content: mensagemUsuario });

  // Mantém só os últimos 20 diálogos
  if (historicoConversas[numeroCliente].length > 20) {
    historicoConversas[numeroCliente] = historicoConversas[numeroCliente].slice(-20);
  }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: historicoConversas[numeroCliente],
      temperature: 0.7,
    });

    const resposta = completion.choices?.[0]?.message?.content || 'Tudo certo por aqui! Como posso ajudar?';
    historicoConversas[numeroCliente].push({ role: 'assistant', content: resposta });

    console.log(`✅ [IA] Resposta gerada para ${numeroCliente}: "${resposta}"`);
    return resposta;
  } catch (err) {
    console.error('❌ [IA] Erro ao gerar resposta:', err?.message || err);
    return 'Desculpe, houve um problema com a IA no momento.';
  }
}

// ====== ROTA DE SAÚDE (opcional, para você testar no navegador) ======
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// ====== WEBHOOK DO DIALOGFLOW (se você usa) ======
app.post('/webhook', async (req, res) => {
  console.log('🌐 [Dialogflow] Corpo recebido:', req.body);

  const queryText = req.body?.queryResult?.queryText || '';
  const sessionId = req.body?.session || 'sessao_desconhecida';

  if (!queryText) {
    console.warn('⚠️ [Dialogflow] Mensagem vazia recebida');
    return res.json({ fulfillmentText: 'Não entendi sua pergunta. Pode repetir?' });
  }

  try {
    const resposta = await gerarResposta(sessionId, queryText);
    console.log('💬 [Dialogflow] Resposta enviada:', resposta);
    res.json({ fulfillmentText: resposta });
  } catch (error) {
    console.error('❌ [Dialogflow] Erro na IA:', error);
    res.json({ fulfillmentText: 'Desculpe, houve um problema técnico ao responder.' });
  }
});

// ====== WEBHOOK DO TWILIO/WHATSAPP ======
app.post('/twilio', async (req, res) => {
  console.log('🌐 [Twilio] Corpo recebido:', req.body);

  const twiml = new MessagingResponse();
  const mensagem = req.body?.Body || '';
  const numeroCliente = req.body?.From || 'numero_desconhecido';

  if (!mensagem) {
    console.warn('⚠️ [Twilio] Mensagem vazia recebida');
    twiml.message('Mensagem vazia recebida. Envie algo para começar.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    return res.end(twiml.toString());
  }

  console.log(`💬 [Twilio] Mensagem recebida de ${numeroCliente}: "${mensagem}"`);

  try {
    // Se faltar a chave de API, respondo algo fixo para não quebrar seu fluxo
    if (!process.env.OPENAI_API_KEY) {
      twiml.message('Webhook ok ✅ (faltou configurar OPENAI_API_KEY).');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    const resposta = await gerarResposta(numeroCliente, mensagem);
    console.log(`📤 [Twilio] Resposta enviada para ${numeroCliente}: "${resposta}"`);

    twiml.message(resposta);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } catch (error) {
    console.error('❌ [Twilio] Erro ao processar mensagem:', error);
    twiml.message('Desculpe, houve um problema técnico ao responder sua mensagem.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// ====== INICIALIZAÇÃO DO SERVIDOR ======
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
