import nodemailer from "nodemailer";
import ejs from "ejs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();


const transporter = nodemailer.createTransport({

    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
    service: process.env.SMTP_SERVICE,
    auth:{
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    },
});

//Render an EJS mail template and send the email

const renderEmailTemplate = async (
    templateName: string, 
    data: Record<string,any>
    ): Promise<string> => {

    const templatePath = path.join(
        process.cwd(),
        'apps',
        'auth-service',
        'src',
        'utils',
        'email-templates',
        `${templateName}.ejs`
    );
    return ejs.renderFile(templatePath, data);
}

//Send an email using the transporter


export const sendEmail = async (
    to: string,
    subject: string,
    templateName: string,
    data: Record<string,any>
) => {

    try{

        const html = await renderEmailTemplate(templateName, data);

        await transporter.sendMail({
            from: `<${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
