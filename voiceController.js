const queueMap= new Map();

module.exports = {
        name: 'voiceController',
        

        //adding stuff to queue
        async add(message, link) {
            //if queue doesnt exist make one

            if (!queueMap.get(message.guild.id)) {
                console.log("Made queue")
                queueMap.set(message.guild.id, [`${link}`]); 
                console.log(queueMap.get(message.guild.id).length)
            }else{
                queueMap.set(message.guild.id, queueMap.get(message.guild.id).push(link));
            }
                
            
                
                console.log("current queue" + `${queueMap.get(message.guild.id)}`)
                
            
            if(queueMap.get(message.guild.id).length==1){
                this.playQueue(message);
            }
    
        },

        async playQueue(message) {
                while (queueMap.get(message.guild.id).length > 0) {
                    console.log("in while loop")
                    song = queueMap.get(message.guild.id)[queueMap.get(message.guild.id).length-1];
                    console.log("song : " + song)
                    await this.play(message,song).then( () => {
                    console.log('finished')
                    queueMap.get(message.guild.id).pop();

                    });

                     
                }

              
       
            
        },

        async play(message,song){
            const connection = await message.member.voice.channel.join();
            const dispatcher = await connection.play(song);
        },

    };