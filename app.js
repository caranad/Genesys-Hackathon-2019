const express = require('express');
const sendmail = require('sendmail')();
const app = express();

app.get('/', (req, res) => {
    const send = require('gmail-send')({
        user: 'farmerbob595@gmail.com',
        pass: 'bobfarm123',
        to:   'christopher.aranadi@gmail.com',
        subject: 'test subject',
        html: 'this value'
    });

    send({
        text: 'gmail-send example 1',  
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