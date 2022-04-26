const express = require('express');
const axios = require('axios');
const responseTime = require('response-time');
const redis = require('redis');
const { promisify } = require('util');

const clientRedis = redis.createClient({
    host: "127.0.0.1",
    port: 6379,
});

const GET_ASYNC = promisify(clientRedis.get).bind(clientRedis);
const SET_ASYNC = promisify(clientRedis.set).bind(clientRedis);

const app = express();

app.use(responseTime());

app.get("/character", async (req, res) => {
    try {
        //  Response from cache redis
        const reply = await GET_ASYNC('characters');
        if (reply) {
            return res.json(JSON.parse(reply));
        } else {
            const response = await axios.get("https://rickandmortyapi.com/api/character");
            await SET_ASYNC('characters', JSON.stringify(response.data));
            res.json(response.data);
        }
    } catch (error) {
        return res.status(error.response.status).json({ message: error.message });
        console.log(error.code);
        console.log(error.message);
    }
});

app.get('/character/:id', async (req, res) => {
    try {
        //  Response from cache redis
        const reply = await GET_ASYNC(req.originalUrl);
        if (reply) {
            return res.json(JSON.parse(reply));
        } else {
            const response = await axios.get(`https://rickandmortyapi.com/api/character/${req.params.id}`);
            await SET_ASYNC(req.originalUrl, JSON.stringify(response.data));
            return res.json(response.data);
        }
    } catch (error) {
        return res.status(error.response.status).json({ message: error.message });
        console.log(error.code);
        console.log(error.message);
    }
});


app.listen(3000, () => {
    console.log('Server is running on port 3000');
});