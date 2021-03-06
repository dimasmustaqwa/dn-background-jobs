// load the config
require('dotenv').config();

const http = require('http');
const express = require('express');
const bodyParser = require ('body-parser');
const multer = require('multer');
const csvToJson = require('./libs/csvToJson');
const User = require('./models/User');
const _ = require('lodash');
const mailTransport = require('./adapters/nodemailer');

var upload = multer({
    dest: 'data/'
})

// initiate express
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

app.post('/users', upload.single('file'), async ({ file }, res, next) => {
    // req.file is the `avatar` file
    // req.body will hold the text fields, if there were any

    if (file) {
        try {
            //convert data csv to json;
            let collectionUsers = await csvToJson(file.path);

            await Promise.all(_.map(collectionUsers, async itemUser => {
                try {
                    //add user into database mongo.
                    const user = await User.create({
                        firstName: itemUser.first_name,
                        lastName: itemUser.last_name,
                        email: itemUser.email,
                        gender: itemUser.gender
                    });

                    let mailOptions = {
                        from: 'info@dn.id', // sender address
                        to: user.email, // list of receivers
                        subject: "Registration Successful", // Subject line
                        html: `<p></p><br>
                           Hi ${user.email}<br>
                           Thank you for registering for the event.<br><br>` // html body
                    };

                    console.log('mailOptions', mailOptions);
                    //send email user registered.
                    let info = await mailTransport.sendMail(mailOptions);
                    console.log("Message sent: %s", info.messageId);

                }
                catch (err) {
                    throw err;
                }
                // Preview only available when sending through an Ethereal account
            }))
            res.status(201).json({
                status: 'ok'
            });
        }
        catch (err) {
            throw err;
        }
    }

});

app.use((err, req, res, next) => {
    console.log(err)
    res.status(500).send(err);
    return next();
});

const server = http.createServer(app);

server.listen(process.env.PORT, () => console.log(`API listen on PORT ${process.env.PORT}`));
