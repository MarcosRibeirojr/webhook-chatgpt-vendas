const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

const { OpenAI } = require('openai');

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/webhook', async (req, res) => {
  const prompt = req.body.queryResult.queryText;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um assistente de vendas do frigorífico Real Carnes. Responda de forma clara, objetiva e comercial.",
        },
        {
          role: "user",
          content: prompt,
        }
      ],
    });

    const resposta = completion.choices[0].message.content;
    res.json({ fulfillmentText: resposta });
  } catch (error) {
    console.error("Erro ao consultar OpenAI:", error);
    res.json({ fulfillmentText: "Ocorreu um erro ao gerar a resposta. Tente novamente mais tarde." });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
