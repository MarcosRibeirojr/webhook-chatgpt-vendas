const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config(); // Carrega as variáveis do .env

// Teste para verificar se a API Key foi carregada corretamente
console.log("API KEY carregada:", process.env.OPENAI_API_KEY);

const app = express();
const port = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const queryText = req.body.queryResult.queryText;
  console.log('Pergunta recebida do Dialogflow:', queryText);

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente de vendas do frigorífico Real Carnes. Responda de forma clara, objetiva e com simpatia.',
        },
        {
          role: 'user',
          content: queryText,
        },
      ],
    });

    const resposta = completion.choices[0].message.content;
    res.json({ fulfillmentText: resposta });

  } catch (error) {
    console.error('Erro no webhook:', error.response?.data || error.message);
    res.json({ fulfillmentText: "Desculpe, houve um erro ao processar sua solicitação." });
  }
});

app.listen(port, () => {
  console.log(`Servidor webhook rodando na porta ${port}`);
});
