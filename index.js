require("dotenv").config();

const express = require("express");
const { identify } = require("./controllers/identify");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/identify", identify);


app.listen(PORT, () => console.log("Server started"));