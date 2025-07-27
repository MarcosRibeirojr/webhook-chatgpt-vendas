const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

console.log("API KEY carregada:", process.env.OPENAI_API_KEY); // teste

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
    console.log('Resposta da IA:', resposta);

    res.json({
      fulfillmentText: resposta, // <- essa é a resposta que será exibida no Dialogflow
    });

  } catch (error) {
    console.error('Erro ao gerar resposta:', error);
    res.json({
      fulfillmentText: 'Desculpe, houve um erro ao processar sua solicitação.',
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor webhook rodando na porta ${port}`);
});

