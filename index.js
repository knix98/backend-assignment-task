const express = require("express");
const { db_query } = require("./config/mysql");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.listen(PORT, () => console.log("Server started"));
