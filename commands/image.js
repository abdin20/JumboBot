const imageSearch = require('image-search-google');
const imageClient = new imageSearch(process.env.CSI, process.env.GOOGLE.API);
 

module.exports = {
	name: 'image',
	description: '$image <search>',
	execute(message, args) {

        //if there is no arguements
        if(!args){
            message.reply("You need to enter a search string");
            return;
        }

        //search google
        imageClient.search(args[0], {})
    .then(images => {
        /*
        [{
            'url': item.link,
            'thumbnail':item.image.thumbnailLink,
            'snippet':item.title,
            'context': item.image.contextLink
        }]
         */
        //get a random image from the array
        image=(images[Math.floor(Math.random()*images.length)])

        //send the message to the channel
        message.channel.send(image.snippet,{files: [image.url]});
        
    })
    .catch(error => message.reply("Couldn't find any images"));     
	},
};