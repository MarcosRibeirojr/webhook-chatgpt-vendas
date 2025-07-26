const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  try {
    const userMessage = req.body.queryResult.queryText;

    console.log('Mensagem recebida do Dialogflow:', userMessage);

    const openaiResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Você é um atendente de vendas experiente. Responda de forma simpática, objetiva e voltada para conversão.'
          },
          {
            role: 'user',
            content: userMessage
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        }
      }
    );

    const reply = openaiResponse.data.choices[0].message.content.trim();

    return res.json({ fulfillmentText: reply });
  } catch (error) {
    console.error('Erro no webhook:', error.response?.data || error.message);
    return res.json({ fulfillmentText: 'Desculpe, houve um erro ao processar sua solicitação.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor webhook rodando na porta ${port}`);
});
