// index.js
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const { twiml: { MessagingResponse } } = require('twilio');

const app = express();

// ====== CONFIGURAÇÕES ======
const PORT = process.env.PORT || 10000; // Na nuvem usa PORT; local 10000
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Boa prática atrás de proxy (Render/Heroku)
app.set('trust proxy', true);

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

// ====== ROTAS DE VERIFICAÇÃO ======
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// (Opcional) raiz para conferência rápida
app.get('/', (req, res) => {
  res.status(200).send('alive');
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
  const mensagem = (req.body?.Body || '').trim();
  const numeroCliente = req.body?.From || 'numero_desconhecido';
  const numMedia = parseInt(req.body?.NumMedia || '0', 10);

  // Pequeno atraso para parecer humano (sem estourar timeout do Twilio)
  const delay = (ms) => new Promise(r => setTimeout(r, ms));

  try {
    // Se veio mídia (foto, áudio, pdf, etc.)
    if (numMedia > 0) {
      const tipo = req.body?.MediaContentType0 || 'mídia';
      const url = req.body?.MediaUrl0 || '';

      console.log(`📎 [Twilio] Recebida mídia (${tipo}): ${url}`);

      await delay(1200); // ~1.2s de “atraso humano”
      twiml.message('Recebi sua mídia 👍 Quer me contar o que você precisa sobre ela?');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    // Sem mídia e sem texto
    if (!mensagem) {
      console.warn('⚠️ [Twilio] Mensagem vazia recebida (sem texto e sem mídia)');
      await delay(800);
      twiml.message('Não veio texto por aqui. Pode me mandar sua mensagem?');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    console.log(`💬 [Twilio] Mensagem recebida de ${numeroCliente}: "${mensagem}"`);

    // Se faltar a chave de API, responde algo fixo
    if (!process.env.OPENAI_API_KEY) {
      await delay(900);
      twiml.message('Webhook ok ✅ (faltou configurar OPENAI_API_KEY).');
      res.writeHead(200, { 'Content-Type': 'text/xml' });
      return res.end(twiml.toString());
    }

    // Atraso humano curto antes de responder
    await delay(1200);

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

