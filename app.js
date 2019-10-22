const express = require('express');
const send = require('gmail-send')(
    {
        user: 'farmerbob595@gmail.com',
        pass: 'bobfarm123',
        to:   'christopher.aranadi@gmail.com',
    }
);
const app = express();

app.get('/', (req, res) => {
    send({
        subject: 'test subject',
        html: 'this value'
    }, (error, result, fullResult) => {
        if (error) {
            console.error(error);
        } 
        else {
            console.log(result);
        }
    })
});

app.listen(3001, () => {
    console.log("A");
})