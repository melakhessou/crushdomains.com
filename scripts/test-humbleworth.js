const Replicate = require("replicate");
require('dotenv').config({ path: '.env.local' });

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function testHumbleworth() {
    console.log('Testing Humbleworth model...');
    try {
        const output = await replicate.run(
            "humbleworth/price-predict-v1:a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
            {
                input: {
                    domains: "startup.io"
                }
            }
        );
        console.log('Output:', JSON.stringify(output, null, 2));
    } catch (error) {
        console.error('Error:', error);
    }
}

testHumbleworth();
