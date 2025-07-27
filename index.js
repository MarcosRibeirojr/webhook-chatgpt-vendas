const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.post('/webhook', async (req, res) => {
  console.log('BODY RECEBIDO:', req.body);

  const message = req.body.Body;
  const sender = req.body.From;

  if (!message || !sender) {
    return res.status(400).send('Dados inválidos');
  }

  try {
    const dialogflowResponse = await axios.post(
      'https://dialogflow.googleapis.com/v2/projects/SEU_PROJECT_ID/agent/sessions/123456789:detectIntent',
      {
        queryInput: {
          text: {
            text: message,
            languageCode: 'pt-BR',
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.DIALOGFLOW_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const fulfillmentText = dialogflowResponse.data.queryResult.fulfillmentText;

    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>${fulfillmentText}</Message>
      </Response>
    `);
  } catch (error) {
    console.error('Erro ao se comunicar com o Dialogflow:', error.response?.data || error.message);
    res.set('Content-Type', 'text/xml');
    res.send(`
      <Response>
        <Message>Erro ao responder. Tente novamente mais tarde.</Message>
      </Response>
    `);
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
