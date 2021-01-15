//Import NPM Packages
const express = require('express');
const axios = require('axios');

//Import Config
const config = require('./config.js')

//Initialize Express
const app = express();
const port = config.port;

//Get auth info.
const myAuth = config.authorization;
const project = config.projectID;

//Main Request Handler
const discordWebhook = config.discordWebhook;
const handleRequest = async function(data) {
    if (data.event_data.priority === 1) data.event_data.priority = 4;
    else if (data.event_data.priority === 2) data.event_data.priority = 3;
    else if (data.event_data.priority === 3) data.event_data.priority = 2;
    else if (data.event_data.priority === 4) data.event_data.priority = 1;

    let reqBody = {
        "embeds": [
            {
                "fields": [

                ]
            }
        ],
    };

    if (data.event_name === "item:added") {
        reqBody.embeds[0].title = "New Task Added";
        reqBody.embeds[0].color = 38143;
        reqBody.embeds[0].fields.push({name: "Priority", value: "" + data.event_data.priority});
        if (data.event_data.due) {
            reqBody.embeds[0].fields.push({name: "Due At", value: "" + data.event_data.due.string});
        }
    }
    else if (data.event_name === "item:updated") {
        reqBody.embeds[0].title = "Task Updated";
        reqBody.embeds[0].color = 16775680;
        reqBody.embeds[0].fields.push({name: "Priority", value: "" + data.event_data.priority});
        if (data.event_data.due) {
            reqBody.embeds[0].fields.push({name: "Due At", value: "" + data.event_data.due.string});
        }
    }
    else if (data.event_name === "item:deleted") {
        reqBody.embeds[0].title = "Task Deleted";
        reqBody.embeds[0].color = 16711680;
    }
    else if (data.event_name === "item:completed") {
        reqBody.embeds[0].title = "Task Completed";
        reqBody.embeds[0].color = 4456192;
        reqBody.embeds[0].fields.push({name: "Priority", value: "" + data.event_data.priority});
        if (data.event_data.due) {
            reqBody.embeds[0].fields.push({name: "Due At", value: "" + data.event_data.due.string});
        }
    }

    reqBody.embeds[0].description = `[${data.event_data.content}](${data.event_data.url})`;
    reqBody.embeds[0].footer = {text: `Action Performed By ${data.initiator.full_name}`};

    axios.post(discordWebhook, reqBody).then((res) => {
        console.log('[INFO]\tEvent was sent to Discord successfully.');
    }).catch((e) => {
        console.error('[ERROR]\tThere was an error sending the event to Discord:');
        console.error(e.stack);
    });
}


//Express JSON parse
app.use(express.json());

app.post('/todoist/:auth', (req, res) => {
    let auth = req.params.auth;
    
    //If the request contains the auth key defined in config.js, allow the request.
    //Else, send 403 forbidden.

    if (auth && (auth === myAuth)) {
        if (req.body.event_data.project_id === project) {
            res.sendStatus(200);
            console.log("[INFO]\tRequest acknowledged.\tType: " + req.body.event_name);
            handleRequest(req.body)
        }

        else {
            res.sendStatus(202)
            console.log("[INFO]\tAn event was triggered, but it did not occur in the current project. The request was acknowledged, and then thrown away.")
        }
    }

    else {
        console.log("[INFO]\tA request was forbidden.")
        return res.sendStatus(403);
    }
})

app.listen(port);
console.log("[INFO]\tTodoist Integration is now listening on port " + port + ".");