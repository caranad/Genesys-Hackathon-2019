const express = require('express');
const sendmail = require('sendmail')();
const app = express();

app.get('/', (req, res) => {
    sendmail({
        from: 'no-reply@yourdomain.com',
        to: 'baranadi@rogers.com',
        subject: 'test sendmail',
        html: 'Mail of test sendmail ',
      }, function(err, reply) {
        res.send(reply);
    });
});

app.listen(3001, () => {
    console.log("A");
})