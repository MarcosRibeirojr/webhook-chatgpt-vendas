require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
const { twiml: { MessagingResponse } } = require('twilio');

const app = express();
const PORT = process.env.PORT || 10000; // Render usa porta dinâmica

// Configuração OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ====== Memória de conversas por usuário ======
const historicoConversas = {};

// ====== Função para gerar resposta do GPT com histórico ======
async function gerarResposta(numeroCliente, mensagemUsuario) {
  if (!historicoConversas[numeroCliente]) {
    historicoConversas[numeroCliente] = [
      {
        role: 'system',
        content:
          'Você é um atendente de vendas da Real Carnes. Especialista em produtos suínos (tolcinho, linguiça, defumados). \
Responda de forma simpática, objetiva e sempre buscando vender ou sugerir produtos complementares. \
Se possível, sugira promoções e combos. Lembre-se do histórico do cliente.'
      }
    ];
  }

  historicoConversas[numeroCliente].push({ role: 'user', content: mensagemUsuario });

  // Mantém só os últimos 20 diálogos
  if (historicoConversas[numeroCliente].length > 20) {
    historicoConversas[numeroCliente] = historicoConversas[numeroCliente].slice(-20);
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: historicoConversas[numeroCliente],
    temperature: 0.7,
  });

  const resposta = completion.choices[0].message.content;
  historicoConversas[numeroCliente].push({ role: 'assistant', content: resposta });

  return resposta;
}

// ====== ENDPOINT 1: Dialogflow Webhook ======
app.post('/webhook', async (req, res) => {
  console.log('Corpo recebido do Dialogflow:', req.body);

  const queryText = req.body.queryResult?.queryText || '';
  const sessionId = req.body.session || 'sessao_desconhecida';

  if (!queryText) {
    return res.json({ fulfillmentText: 'Não entendi sua pergunta. Pode repetir?' });
  }

  try {
    const resposta = await gerarResposta(sessionId, queryText);
    console.log('Resposta da IA (Dialogflow):', resposta);

    res.json({ fulfillmentText: resposta });
  } catch (error) {
    console.error('Erro na IA Dialogflow:', error);
    res.json({ fulfillmentText: 'Desculpe, houve um problema técnico ao responder.' });
  }
});

// ====== ENDPOINT 2: Twilio WhatsApp com GPT ======
app.post('/twilio', async (req, res) => {
  const twiml = new MessagingResponse();
  const mensagem = req.body.Body || '';
  const numeroCliente = req.body.From || 'numero_desconhecido';

  console.log('Mensagem recebida do WhatsApp:', mensagem);

  try {
    const resposta = await gerarResposta(numeroCliente, mensagem);
    console.log('Resposta enviada ao WhatsApp:', resposta);

    twiml.message(resposta);
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  } catch (error) {
    console.error('Erro no Twilio GPT:', error);
    twiml.message('Desculpe, houve um problema técnico ao responder sua mensagem.');
    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());
  }
});

// ====== INICIALIZAÇÃO DO SERVIDOR ======
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando na porta ${PORT}`);
});

