const express = require('express');
const bodyParser = require('body-parser');
const { OpenAI } = require('openai');

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
        { role: 'system', content: 'Você é um atendente de vendas da Real Carnes, especializado em produtos suínos. Responda de forma objetiva e simpática.' },
        { role: 'user', content: queryText },
      ],
      temperature: 0.6,
    });

    const responseText = completion.choices[0].message.content;
    console.log('Resposta da IA:', responseText);

    return res.json({
      fulfillmentText: responseText,
    });

  } catch (error) {
    console.error('Erro ao gerar resposta da IA:', error);
    return res.json({
      fulfillmentText: 'Desculpe, estou com dificuldades técnicas no momento.',
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
