let urls=['youtu.be/0EWbonj7f18','youtube.com/user/sandervandoorntv/watch?v=WijF8aivOo8','youtube.com/watch?v=0EWbonj7f18&t=3','youtube.com/embed/watch/?feature=related&v=0EWbonj7f18']
var myURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&nohtml5=False';
// const embedjs =require('embedjs');

// const text = 'youtube.com/user/sandervandoorntv/watch?v=WijF8aivOo8';
// const embeds = embedjs.getAll(text.substring(0,text.indexOf("?")));

// console.log(embeds[0]);

// var youtubeID = require('youtube-id');


// console.log( youtubeID(myURL) ); // 'dQw4w9WgXcQ'

const urlParser = require("js-video-url-parser");
console.log( urlParser.parse(myURL) )

for(let url of urls){

} 