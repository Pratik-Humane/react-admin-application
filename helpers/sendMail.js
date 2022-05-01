const nodemailer = require("nodemailer");

// step 1
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false,
  requireTLS: true,
  auth: {
    user: process.env.MAIL_USERNAME,
    pass: process.env.MAIL_PASSWORD,
  },
});

// step2
const sendMail = async (to,subject,body) => {
    let config = { from: process.env.MAIL_FROM, to, subject };
    if(body){
        config = {...config, html: body };
    }
    
    transporter.sendMail(config, async function (error, info) {
        if (error) {
          console.log("error", error);
          return false;
        } else {
          if (await info){
            console.log("Mail send", info.response);
            return true;
          } else{
            return false;
          }
        }
      }
    );
}


module.exports = { sendMail };