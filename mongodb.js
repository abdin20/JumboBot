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
         person.playingBlackjack=false;
         person.playerCards=[];
         person.dealerCards=[];
         person.blackjackBet=0;
        await this.createUser(person)

        result =  await mongodClient.db("userData").collection("money").findOne({id: author.id})
        return result;

        console.log("created account")
    } 

}


exports.updateUserById =async function updateBalanceById(id, propertyObject) {
    result = await mongodClient.db("userData").collection("money")
        .updateOne({ id: id }, { $set: propertyObject });
}



