const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());

app.post('/webhook', (req, res) => {
  const intentName = req.body.queryResult.intent.displayName;

  if (intentName === 'Teste ChatGPT') {
    return res.json({
      fulfillmentText: 'Sim, temos tolcinho gordo disponível! É ideal para dar sabor aos pratos e tem excelente rendimento.'
    });
  }

  // Resposta padrão caso não reconheça a intenção
  return res.json({
    fulfillmentText: 'Desculpe, não entendi sua pergunta. Pode repetir?'
  });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
