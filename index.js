require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai'); // novo formato

const app = express();
app.use(bodyParser.json());

console.log("API KEY carregada:", process.env.OPENAI_API_KEY); // teste

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/webhook', async (req, res) => {
  const prompt = req.body.queryResult.queryText;
  console.log('Pergunta recebida do Dialogflow:', prompt);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
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

    const resposta = completion.choices[0].message.content;
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
