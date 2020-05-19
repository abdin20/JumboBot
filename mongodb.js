const {MongoClient} = require('mongodb');
const Discord = require('discord.js');
const uri=process.env.MONGO_URI;
mongodClient = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

//automatically connect to the db
(async function start(){
    await mongodClient.connect();

})();



//add user to db
//parameter of user is object form
exports.createUser= async function createUser(newUser) {
    const result = await mongodClient.db("userData").collection("money").insertOne(newUser);
    console.log(`New user created with the following id: ${result}`);
}

//find balance by discord id
 exports.findBalanceById =async function findBalanceById(userId) {

    result =  await mongodClient.db("userData").collection("money").findOne({id: userId}
    );

     if(result){
         return result.balance
     }else{
         return null;
     }

}

//find user by their ID
exports.findUserByAuthor =async function findUserByAuthor(author) {

    //check to see if in db
    result =  await mongodClient.db("userData").collection("money").findOne({id: author.id}
    );
    
    //if in return user object
    if(result){
        return result;
    }else{

        //otherwise make a new one and return it
        //else make a new person
        let person = new Object();
         person.id = author.id;
         person.name = author.username;
         person.balance = 0;
        await this.createUser(person)

        result =  await mongodClient.db("userData").collection("money").findOne({id: author.id})
        return result;

        console.log("created account")
    } 

}

///gambling stuff///////////////////////////////////////////////
exports.updateUserById =async function updateUserById(id, propertyObject) {
    result = await mongodClient.db("userData").collection("money")
        .updateOne({ id: id }, { $set: propertyObject });
}

//find game from database based on type and discord id
exports.findGameByType= async function findGameByType(id,channelId,type){
        result = await mongodClient.db("userData").collection("games").findOne({id:id,channelId:channelId,type:type});
        return result;
}

//create a new gambling game 
exports.createGameByObject= async function createGameByType(gameObject){
    const newGame = await mongodClient.db("userData").collection("games").insertOne(gameObject);
    console.log("created " +gameObject.type + " game")
}

//update gambling game
exports.updateGameByMessageId= async function updateGameByMessageId(messageId,propertyObject){
    result = await mongodClient.db("userData").collection("games")
        .updateOne({ messageId: messageId }, { $set: propertyObject });

        console.log("updated game");
}


//delete game object 
exports.deleteGamebyObject= async function deleteGamebyObject(propertyObject){
    
    result = await mongodClient.db("userData").collection("games")
        .deleteOne(propertyObject);

}
////////////////////////////////////////////////



///music database stuff///
//create a new gambling game 
exports.createQueueByObject= async function createQueueByObject(propertyObject){
    const newGame = await mongodClient.db("userData").collection("music").insertOne(propertyObject);
    console.log("created song queue for : " +propertyObject.guildId);
}

//update queue
exports.updateQueueByGuildId= async function updateQueueByGuildId(guildId,propertyObject){
    result = await mongodClient.db("userData").collection("music")
        .updateOne({ guildId: guildId }, { $set: propertyObject });

        console.log("updated queue for "+guildId);
}

//find queue
//find game from database based on type and discord id
exports.findQueueByGuildId= async function findQueueByGuildId(guildId){
    result = await mongodClient.db("userData").collection("music").findOne({guildId:guildId});
    return result;
}

//delete queue 
exports.deleteQueueByObject= async function deleteQueueByObject(propertyObject){
    
    result = await mongodClient.db("userData").collection("music")
        .deleteOne(propertyObject);
    
    console.log(`Deleting queue for: ${propertyObject.guildId}`)

}


///playlist database stuff//////////
exports.createPlaylistByObject= async function createPlaylistByObject(propertyObject){
    const newGame = await mongodClient.db("userData").collection("playlists").insertOne(propertyObject);
    console.log("created playlist for : " +propertyObject.id);
}

//update playlist
exports.updatePlaylistById= async function updatePlaylistById(id,propertyObject){
    result = await mongodClient.db("userData").collection("playlists")
        .updateOne({ id: id }, { $set: propertyObject });

        console.log("updated playlist for "+id);
}

//find playlist 
exports.findPlaylistById= async function findPlaylistById(id){
    result = await mongodClient.db("userData").collection("playlists").findOne({id:id});
    return result;
}

//delete playlists 
exports.deletePlaylistByObject= async function deletePlaylistByObject(propertyObject){
    
    result = await mongodClient.db("userData").collection("playlists")
        .deleteOne(propertyObject);
    
    console.log(`Deleting playlist for: ${propertyObject.id}`)

}