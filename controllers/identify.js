const { db_query } = require("../config/mysql");

module.exports.identify = async (req, res) => {
    try {
        let { email, phone } = req.body;

        if(!email && !phone) {
            return res.status(400).json({status: false, message: "email or phone or both is required"});
        }

        // do the basic validations
        if(email) {
            if(typeof email != "string") return res.status(400).json({status: false, message: "email must be a string"});
        }
        else email = null;
        
        if(phone) {
            if(typeof phone != "string" && typeof phone != "number") return res.status(400).json({status: false, message: "phone must contain only numbers/digits"});
            phone = String(phone);
            if(!isDigitsOnly(phone)) return res.status(400).json({status: false, message: "phone must contain only numbers/digits"});
        }
        else phone = null;

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

        let sql = `SELECT id, email, phone, linked_id, precedence FROM contacts WHERE ${search_params.join(" OR ")}`;
        let results = await db_query(sql, search_query_args);

        // if no contacts found, then create a new primary contact and return
        if(results.length == 0) {
            let resp = await db_query("INSERT INTO contacts (email, phone, created_at) VALUES (?, ?, NOW())", [email, phone]);
            let emails = email ? [email] : [];
            let phones = phone ? [phone] : [];
            let contact = 
            {
                "primaryContactId": resp.insertId,
                "emails": emails,
                "phoneNumbers": phones,
                "secondaryContactIds": []
            }
            return res.status(200).json({contact});
        }

        // get various distinct primary_ids that matched
        let distinct_primary_ids = {};
        let email_found = false;
        let phone_found = false;
        for(let i = 0; i < results.length; i++) {
            let result = results[i];
            if(result.email == email) email_found = true;
            if(result.phone == phone) phone_found = true;

            if(result.precedence == "primary") distinct_primary_ids[result.id] = true;
            else distinct_primary_ids[result.linked_id] = true;
        }
        distinct_primary_ids = Object.keys(distinct_primary_ids);

        // get the primary_id which was created_at the earliest
        let primary_id = await db_query("SELECT id, email, phone FROM contacts WHERE id IN (?) ORDER BY created_at ASC LIMIT 1", [distinct_primary_ids]);
        let primary_email = primary_id[0].email;
        let primary_phone = primary_id[0].phone;
        primary_id = primary_id[0].id;

        // get all the primary_ids which are going to become secondary now
        distinct_primary_ids = distinct_primary_ids.filter(id => id != primary_id);

        if(distinct_primary_ids.length > 0) {
            // update linked_id of all secondary contacts to these primary_ids
            await db_query("UPDATE contacts SET linked_id = ?, precedence = 'secondary' WHERE linked_id IN (?)", [primary_id, distinct_primary_ids]);
    
            // update all these primary_ids to secondary
            await db_query("UPDATE contacts SET linked_id = ?, precedence = 'secondary' WHERE id IN (?)", [primary_id, distinct_primary_ids]);
        }

        // create a new secondary contact if the request body's email or phone was not found in DB
        if(!email_found || !phone_found) await db_query("INSERT INTO contacts (email, phone, linked_id, precedence, created_at) VALUES (?, ?, ?, 'secondary', NOW())", [email, phone, primary_id]);

        // now get details of all secondary contacts
        let secondary_contacts = await db_query("SELECT id, email, phone FROM contacts WHERE linked_id = ?", [primary_id]);

        // prepare the return object
        let contact = 
        {
            "primaryContactId": primary_id,
            "emails": primary_email ? [primary_email] : [],
            "phoneNumbers": primary_phone ? [primary_phone] : [],
            "secondaryContactIds": []
        }

        let secondary_emails = {};
        let secondary_phones = {};
        for(let i = 0; i < secondary_contacts.length; i++) {
            let secondary_contact = secondary_contacts[i];
            contact.secondaryContactIds.push(secondary_contact.id);
            if(secondary_contact.email && secondary_contact.email != primary_email) secondary_emails[secondary_contact.email] = true;
            if(secondary_contact.phone && secondary_contact.phone != primary_phone) secondary_phones[secondary_contact.phone] = true;
        }
        contact.emails = contact.emails.concat(Object.keys(secondary_emails));
        contact.phoneNumbers = contact.phoneNumbers.concat(Object.keys(secondary_phones));
        
        return res.status(200).json({contact});
    } catch (error) { 
        console.log("error => ", error);
        return res.status(500).json({status: false, message: "Internal server error"});
    }
}

function isDigitsOnly(str) {
    const regex = /^\d+$/;
    return regex.test(str);
}