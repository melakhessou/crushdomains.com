require('dotenv').config({ path: '.env.local' });
const Replicate = require('replicate');

const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
});

async function test() {
    console.log("Token:", process.env.REPLICATE_API_TOKEN ? "Found" : "Missing");
    try {
        const input = {
            domains: "example.com"
        };
        console.log("Running model...");
        const output = await replicate.run(
            "humbleworth/price-predict-v1:a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
            { input }
        );
        console.log("Success:", output);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
