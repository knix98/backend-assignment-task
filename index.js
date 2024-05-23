require("dotenv").config();

const express = require("express");
const { db_query } = require("./config/mysql");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.post("/identify", async (req, res) => {
    try {
        let { email, phone } = req.body;

        if(!email && !phone) {
            return res.status(400).json({status: false, message: "email or phone or both is required"});
        }
        if(!email) email = null;
        if(!phone) phone = null;

        // do the basic validations

        let search_params = [];
        let search_query_args = [];
        if(email) {
            search_params.push("email = ?");
            search_query_args.push(email);
        }
        if(phone) {
            search_params.push("phone = ?");
            search_query_args.push(phone);
        }

        let sql = `SELECT id, linked_id, precedence FROM contacts WHERE ${search_params.join(" OR ")}`;
        let results = await db_query(sql, search_query_args);

        // if no contacts found, then create a new primary contact and return
        if(results.length == 0) {
            let resp = await db_query("INSERT INTO contacts (email, phone) VALUES (?, ?)", [email, phone]);
            let emails = email ? [email] : [];
            let phones = phone ? [phone] : [];
            let contact = 
            {
                "primaryContatctId": resp.insertId,
                "emails": emails,
                "phoneNumbers": phones,
                "secondaryContactIds": []
            }
            return res.status(200).json({status: true, contact});
        }
    } catch (error) { 
        console.log("error => ", error);
        return res.status(500).json({status: false, message: "Internal server error"});
    }
});

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