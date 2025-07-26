const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // sua chave API no arquivo .env
});

const openai = new OpenAIApi(configuration);

app.post('/webhook', async (req, res) => {
  const prompt = req.body.queryResult.queryText;

  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4o", // <- modelo atualizado
      messages: [
        {
          role: "system",
          content: "Você é um assistente de vendas do frigorífico Real Carnes. Responda de forma clara, objetiva e com simpatia.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const resposta = completion.data.choices[0].message.content;
    res.json({ fulfillmentText: resposta });

  } catch (error) {
    console.error('Erro no webhook:', error.response?.data || error.message);
    res.json({ fulfillmentText: "Desculpe, houve um erro ao processar sua solicitação." });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor webhook rodando na porta ${PORT}`);
});
