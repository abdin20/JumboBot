/////////////////////////////////mongo
const {MongoClient} = require('mongodb');
const uri = process.env.MONGO_URI;
const mongodClient = new MongoClient(uri, {useNewUrlParser: true, useUnifiedTopology: true});


async function main() {

    async function listDatabases(client) {
        databasesList = await client.db().admin().listDatabases();

        console.log("Databases:");
        databasesList.databases.forEach(db => console.log(` - ${db.name}`));
    };

//connect to db
    try {
        await mongodClient.connect();

        await listDatabases(mongodClient);

    } catch (e) {
        console.error(e);
    }

}

main().catch(console.error);

//add user to db
async function createListing(mongodClient, newUser) {
    const result = await mongodClient.db("userData").collection("money").insertOne(newUser);
    console.log(`New user created with the following id: ${result}`);
}

//find discord id
 async function findBalanceById(mongodClient, user) {
    console.log(user.username);
    result =  await mongodClient.db("userData").collection("money").findOne({id: user.id}
    );

     if(result){
         return result.balance
     }else{
         console.log("cant find")
         let person = new Object();
         person.id = user.id;
         person.name = user.username;
         person.balance = 0;
         createListing(mongodClient, person)
         return 0;
     }



}

async function updateBalanceByName(mongodClient, id, propertyObject) {
    result = await mongodClient.db("userData").collection("money")
        .updateOne({ id: id }, { $set: propertyObject });


}
async function playHighLow(words){
    let profit=0;
    let outcome=""
    bet = parseInt(words[1],10)

    let number = Math.floor(Math.random() * 10)
    if (number >= 5) {
        result = "high"
    } else {
        result = "low"
    }


    if (words[0] == result) {
        outcome="win"
        profit=bet
    } else {
        outcome="lose"
        profit=-1*bet;
    }
    console.log("rofit is " +profit)
    return [outcome,profit,number];
}

//discord stuff
///////////////////////////////discord stuff
const fs = require('fs');
const Discord = require('discord.js');
prefix="$";

const commands = ["coinflip", "highlow <low/high> <bet>", "help","scam","balance"]
const client = new Discord.Client();

const queue = new Map();

client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
}


client.once('ready', () => {
    console.log('Ready!');
    client.user.setActivity("Type $help for commands");


});

client.once('reconnecting', () => {
    console.log('Reconnecting!');
});

client.once('disconnect', () => {
    console.log('Disconnect!');
});

client.on('message', foo = async(msg) => {
    if (msg.author.bot) return;

    //riley sends a command
    //his id is  682032221347250200
    //my id is 163368896844267521
    if (msg.member.id == "682032221347250200") {

        if (msg.content.startsWith(`${prefix}`)) {
            msg.channel.send("<@" + msg.member.id + "> is from israel");
        }
    }

    //coinflip
    if (msg.content.startsWith(`${prefix}` + "coinflip")) {

        if (Math.random() * 10 >= 5) {
            result = "heads"
        } else {
            result = "tails"
        }

        msg.channel.send(result);
    }


    //highlow
    if (msg.content.startsWith(`${prefix}` + "highlow")) {


        //get the rest of teh word
        word = msg.content.substring(9);
        var words = word.split(" ");
        console.log(words);

        //check errors
        if (words.length<2 || !isNaN(words[0]) || isNaN(words[1])){
            msg.channel.send("Error, please follow the syntax $highlow <low/high> <bet>")
            return;
        }
        //get balance
        balance = await findBalanceById(mongodClient,msg.author)
        console.log( await findBalanceById(mongodClient,msg.author));
        //check if enough coins
        if (balance<parseInt(words[1],10)){
            msg.channel.send("not enough shekels")
            return;
        }

        results= await playHighLow(words);
        balance=balance+results[1];
        await updateBalanceByName(mongodClient,msg.author.id, {balance:balance})

        if(results[0]=="win"){
            msg.reply("Rolled "+`${results[2]}`+ "\nYou Won "+ `${results[1]}` +"\n Balance: " + `${balance}`)
        }else{
            msg.reply("Rolled "+`${results[2]}`+ "\nYou lose" +"\n Balance: " + `${balance}`);
        }

    }

    if (msg.content.startsWith(`${prefix}` + "help")) {
        message = "";
        for (let h = 0; h < commands.length; h++) {
            message += "$" + commands[h] + "\n"
        }

        msg.channel.send(message);
    }

    if (msg.content.startsWith(`${prefix}` + "scam")) {
        balance = await findBalanceById(mongodClient,msg.author);

        if(balance<200){
            balance+=200;
            await updateBalanceByName(mongodClient,msg.author.id, {balance:balance})
            msg.reply("You scammed someone out of 200 \n Balance: " +balance);
        }else{
            msg.reply("You already have alot of shekels rich");
        }
    }

    if (msg.content.startsWith(`${prefix}` + "balance")) {
        balance = await findBalanceById(mongodClient,msg.author);
        msg.reply("you have " + `${balance}` + " shekels")
    }

});



client.login(process.env.BOT_TOKEN);