const fs = require('fs');
const Discord = require('discord.js');

const ImageSearchAPIClient = require('@azure/cognitiveservices-imagesearch');
const CognitiveServicesCredentials = require('ms-rest-azure').CognitiveServicesCredentials;
const Search = require('azure-cognitiveservices-search');

//replace this value with your valid subscription key.
let serviceKey = process.env.AZURE_KEY;


//instantiate the image search client
let credentials = new CognitiveServicesCredentials(serviceKey);
let imageSearchApiClient = new Search.ImageSearchAPIClient(credentials);

module.exports = {
    name: 'image',
    description: '$image <serach>',


    async execute(message, args) {
        //if no arguments
        if (!args) {
            message.reply("you need to enter a search term")
            return;
        }

        //dont need quote for searching anymore
        search=args.join(" ")
        //query method
        const sendQuery = async () => {
            return await imageSearchApiClient.imagesOperations.search(search);
        };

        //call it and once it returns, we go through the data
        sendQuery().then(imageResults => {
            if (imageResults == null) {
            console.log("No image results were found.");
            }
            else {
                console.log(`Total number of images returned: ${imageResults.value.length}`);
                let randomImageResult = imageResults.value[ Math.floor(  Math.random()*imageResults.value.length)];
                let url=randomImageResult.contentUrl
                 //SET THE TEXT TO SEND
                 msg = randomImageResult.name;
        
                 message.channel.send(msg, { files: [url] });

            }
          })
          .catch(err => console.error(err))
        


           
    },
};