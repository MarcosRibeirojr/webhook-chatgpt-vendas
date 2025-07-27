const express = require('express');
const bodyParser = require('body-parser');
const { SessionsClient } = require('@google-cloud/dialogflow');
const app = express();

app.use(bodyParser.json());

const projectId = 'representante1';

const sessionClient = new SessionsClient();

app.post('/webhook', async (req, res) => {
  try {
    const sessionId = req.body.From || 'default-session';
    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: req.body.Body,
          languageCode: 'pt-BR',
        },
      },
    };

    const responses = await sessionClient.detectIntent(request);
    const result = responses[0].queryResult;

    const fulfillmentText = result.fulfillmentText || 'Desculpe, não entendi sua pergunta. Pode repetir?';

    res.set('Content-Type', 'application/json');
    return res.send({ fulfillmentText });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return res.send({ fulfillmentText: 'Houve um erro ao processar sua mensagem.' });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
