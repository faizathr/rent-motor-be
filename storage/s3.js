import { R2 } from 'node-cloudflare-r2';

const r2 = new R2({
    accountId: process.env.ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
});

const bucket = r2.bucket('motoran');

bucket.provideBucketPublicUrl(process.env.R2_PUBLIC_URL);

module.exports = bucket;