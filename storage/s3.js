const { R2 } =  require('node-cloudflare-r2');
const path = require("path");

const r2 = new R2({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY,
    secretAccessKey: process.env.R2_SECRET_KEY,
});

const bucket = r2.bucket(process.env.R2_BUCKET);

bucket.provideBucketPublicUrl(process.env.R2_PUBLIC_URL);

const uploadImage = async (file) => {
    if (file.mimetype.split("/")[0] != "image") {
        throw {
            "name": "MimeTypeNotAllowed",
            "message": `Mimetype ${file.mimetype} is not allowed`
        };
    }

    const imageExtension = path.extname(file.originalname);
    const allowedExtension = ['.png','.jpg','.jpeg'];

    if (!allowedExtension.includes(imageExtension)) {
        throw {
            "name": "ExtensionNotAllowed",
            "message": `Extension ${imageExtension} is not allowed`
        };
    }
    const upload = await bucket.uploadFile(file.path, encodeURIComponent(file.originalname));
    return upload.publicUrls[0];
};

module.exports = uploadImage;