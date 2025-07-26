const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

const app = express();
const port = process.env.PORT || 10000;

// Substitua pela sua chave da OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'SUA_CHAVE_API_AQUI',
});

app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  const userMessage = req.body.queryResult.queryText;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'Você é um assistente especializado em vendas da empresa Real Carnes.',
        },
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    const botReply = completion.choices[0].message.content;

    return res.json({
      fulfillmentText: botReply,
    });
  } catch (error) {
    console.error('Erro ao acessar a API da OpenAI:', error.response?.data || error.message);
    return res.json({
      fulfillmentText: 'Desculpe, houve um erro ao processar sua solicitação.',
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor webhook rodando na porta ${port}`);
});
