require("dotenv").config();

const express = require("express");
const { identify } = require("./controllers/identify"); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/identify", identify);

app.post("/test", async (req, res) => {
    try {
        let resp = await db_query("insert into contacts (email, phone) values (?, ?)", [null, "234"]);
        console.log("resp => ", resp);
        console.log("id", resp.insertId);
        // if(!resp[0].email) console.log("no email");
        return res.status(200).json({status: true, data: resp});
    } catch (error) {
        console.log("error => ", error);
        return res.status(500).json({status: false, message: "Internal server error"});
    }
});


app.listen(PORT, () => console.log("Server started"));