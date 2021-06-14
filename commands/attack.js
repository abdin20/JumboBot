
const fs = require('fs');
const Discord = require('discord.js');

require('dotenv').config()
const ImageSearchAPIClient = require('@azure/cognitiveservices-imagesearch');
const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
const Search = require('azure-cognitiveservices-search');

//replace this value with your valid subscription key.
let serviceKey = process.env.AZURE_KEY;


//instantiate the image search client
let credentials = new CognitiveServicesCredentials(serviceKey);
let imageSearchApiClient = new Search.ImageSearchAPIClient(credentials);

module.exports = {
    name: 'attack',
    description: '$attack <user>',


    async execute(message, args) {
        //if no arguments
        if (!args) {
            message.reply("you need to mention a user!")
            return;
        }

        const sendQuery = async () => {
            return await imageSearchApiClient.imagesOperations.search("anime fight gif");
        };
        
        sendQuery().then(imageResults => {
            if (imageResults == null) {
            console.log("No image results were found.");
            }
            else {
                console.log(`Total number of images returned: ${imageResults.value.length}`);
                let randomImageResult = imageResults.value[ Math.floor(  Math.random()*imageResults.value.length)];
                let url=randomImageResult.contentUrl
                console.log(randomImageResult)
                 //SET THE TEXT TO SEND
                 msg = `<@${message.author.id}> approaches ${message.mentions.users.first()}`
        
                 message.channel.send(msg, { files: [url] });

            }
          })
          .catch(err => console.error(err))
        


           
    },
};