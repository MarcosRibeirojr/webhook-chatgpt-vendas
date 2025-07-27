const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/webhook', (req, res) => {
  console.log("BODY RECEBIDO:", JSON.stringify(req.body, null, 2));

  const intentName = req.body?.queryResult?.intent?.displayName || 'Indefinido';

  if (intentName === "Teste ChatGPT") {
    return res.json({
      fulfillmentText: 'Sim, temos tolcinho gordo disponível! É ideal para dar sabor aos pratos e tem excelente rendimento.'
    });
  }

  return res.json({
    fulfillmentText: 'Desculpe, não entendi sua pergunta. Pode repetir?'
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
