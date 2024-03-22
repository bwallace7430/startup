import * as uuid from 'uuid';
import bcrypt from 'bcrypt';
import config from './dbConfig.json' with { type: "json" };
import { MongoClient } from 'mongodb';

const url = `mongodb+srv://${config.userName}:${config.password}@${config.hostname}`;
const client = new MongoClient(url);
const db = client.db('accountable');

(async function testConnection() {
    await client.connect();
    await db.command({ ping: 1 });
})().catch((ex) => {
    console.log(`Unable to connect to database with ${url} because ${ex.message}`);
    process.exit(1);
});

const userCollection = client.db('authTest').collection('user');
const entryCollection = client.db('authTest').collection('entry');

export async function getUser(username) {
    return userCollection.findOne({ username: username });
}

export async function getUserByAuthToken(authToken) {
    return await collection.findOne({ token: authToken });
}

export async function createUser(username, password) {
    const passwordHash = await bcrypt.hash(password, 10);

    if (!(await getUser(username))) {
        const user = {
            username: username,
            password: passwordHash,
            token: generateAuthToken(),
            friends: []
        };
        await userCollection.insertOne(user);
        return user;
    }
    else {
        throw new Error("Username already taken.");
    }
}

export async function createSession(username, password) {

    let user = await getUser(username);
    if (!user) {
        throw new Error("User not found");
    }
    let passwordHash = await bcrypt.hash(password, 10);
    if (!user.password === passwordHash) {
        throw new Error("Password is incorrect");
    }

    let authToken = generateAuthToken();
    userCollection.updateOne({ username: username }, { $set: { token: authToken } });

    return authToken;
}

function generateAuthToken() {
    return uuid.v4();
}

export async function createEntry(username, day, entry) {
    const newEntry = {
        username: username,
        date: day,
        entry: entry
    };
    return await entryCollection.insertOne(newEntry);
}

export async function getUserEntry(username, day) {
    return await entryCollection.findOne({ username: username, date: day });
}

export async function addFriend(username, friendUsername) {
    if (!await getUser(friendUsername)) {
        throw new Error("This user does not exist.");
    }
    return await userCollection.updateOne({ username: username }, { $push: { friends: friendUsername } });
}

export async function getFriends(username) {
    let user = await getUser(username);
    return user.friends;
}

export async function deleteSession(username) {
    return await userCollection.updateOne({ username: username }, { $set: { token: null } });
}