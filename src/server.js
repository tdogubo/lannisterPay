const { createServer } = require("http");
const mongoose = require("mongoose");
const { app } = require("./app");

const server = createServer(app);
const PORT = process.env.PORT || 4000;
const MONGO_URL = `mongodb+srv://${process.env.MONGO_DB_USERNAME}:
${process.env.MONGO_DB_PASSWORD}
@lannister-pay.18y7m.mongodb.net/lannisterdb?retryWrites=true&w=majority`;

async function startServer() {
  try {
    await mongoose.connect(MONGO_URL);
  } catch (err) {
    console.log(err.message);
  }
  server.listen(PORT, () => {
    console.log(`Server is jiggy on port ${PORT}`);
  });
}
startServer();
