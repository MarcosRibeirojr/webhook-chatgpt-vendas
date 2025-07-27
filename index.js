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
        {
          role: 'system',
          content:
            'Você é um atendente de vendas da Real Carnes, especialista em produtos suínos como tolcinho, linguiça e defumados. Responda de forma objetiva, simpática e sempre com foco em vender ou orientar bem o cliente.',
        },
        {
          role: 'user',
          content: queryText,
        },
      ],
      temperature: 0.6,
    });

    const responseText = completion.choices[0].message.content;
    console.log('Resposta da IA:', responseText);

    res.json({
      fulfillmentText: responseText,
    });
  } catch (error) {
    console.error('Erro na IA:', error);
    res.json({
      fulfillmentText: 'Desculpe, houve um problema técnico ao responder.',
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
