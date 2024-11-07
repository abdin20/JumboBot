const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fakenews')
    .setDescription('Generate breaking news about a server member')
    .addUserOption(option =>
      option.setName('target')
        .setDescription('The user to generate news about')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('event')
        .setDescription('What happened? (optional)')
        .setRequired(false)),

  async execute(interaction) {
    const target = interaction.options.getUser('target');
    const customEvent = interaction.options.getString('event');

    // News template arrays
    const headlinesWithEvent = [
        "🚨 BREAKING: {user} Caught {event}",
        "😱 SHOCKING: {user} Spotted {event}",
        "👀 WITNESS REPORT: {user} Seen {event}",
        "📸 CAUGHT ON CAMERA: {user} {event}",
        "🔍 EXCLUSIVE: {user} Discovered {event}",
        "⚠️ ALERT: {user} Found {event}",
        "💥 SCANDAL: {user} Exposed for {event}",
        "🤯 UNBELIEVABLE: {user} Documented {event}",
        "🚔 CAUGHT RED-HANDED: {user} {event}",
        "🎥 LEAKED FOOTAGE: {user} Filmed {event}",
        "🕵️ CONSPIRACY CONFIRMED: {user} Actually {event}",
        "🎬 HIDDEN CAMERA REVEALS: {user} {event}",
        "🤫 ANONYMOUS SOURCE CONFIRMS: {user} {event}",
        "📹 SECURITY FOOTAGE SHOWS: {user} {event}",
        "📡 LIVE ON SCENE: {user} Currently {event}",
        "🔎 UNDERCOVER INVESTIGATION: {user} {event}"
    ];

    const headlinesWithoutEvent = [
        "⚡ URGENT UPDATE: {user} Makes Headlines Again",
        "🔍 INVESTIGATION ONGOING: {user}'s Mysterious Activities Revealed",
        "🌐 TRENDING NOW: {user} Breaks The Internet",
        "📰 SPECIAL REPORT: {user} Changes Everything",
        "🌟 WORLD EXCLUSIVE: The {user} Phenomenon",
        "⚠️ DEVELOPING SITUATION: What We Know About {user}",
        "🚀 VIRAL SENSATION: {user} Becomes Overnight Celebrity",
        "💫 UNPRECEDENTED: {user}'s Actions Stun Experts",
        "🔓 MYSTERY SOLVED: The Truth Behind {user}",
        "💣 BOMBSHELL REPORT: {user}'s Secret Finally Revealed",
        "🌈 BREAKING BOUNDARIES: {user} Defies All Expectations",
        "🧪 SCIENTISTS BAFFLED: {user}'s Latest Discovery",
        "🤐 TOP 10 SECRETS: {user} Doesn't Want You To Know",
        "🕵️‍♂️ CONSPIRACY THEORY: Is {user} Actually Three Kids in a Trenchcoat?",
        "📢 BREAKING NEWS: {user} Found Living in Society",
        "🎭 SHOCKING TRUTH: What {user} Has Been Hiding All Along",
        "📊 EXPERTS CONCERNED: {user}'s Impact on Global Economy",
        "🤫 ANONYMOUS WHISTLEBLOWER REVEALS: The Real {user} Story",
        "⏰ TIME TRAVELER WARNS: About {user}'s Future Impact",
        "🏛️ GOVERNMENT OFFICIALS INVESTIGATE: {user}'s True Identity"
    ];

    const defaultEvents = [
        "📸 selling screenshots of NFTs",
        "👵 trying to explain memes to their grandparents",
        "🍕 starting a petition to make pizza a breakfast food",
        "😂 claiming they can speak fluent emoji",
        "🤖 attempting to teach AI common sense",
        "💻 organizing a support group for misunderstood semicolons",
        "☁️ trying to prove that clouds are just sky cotton candy",
        "⏰ declaring themselves the CEO of procrastination",
        "🐱 writing a thesis on why cats rule the internet",
        "🤔 starting a conspiracy theory about vending machines",
        "😴 attempting to patent the concept of Monday blues",
        "⚡ creating a time machine using only paperclips and hope",
        "🦆 founding a secret society of rubber duck debuggers",
        "😴 trying to convince people that sleep is optional",
        "🐠 teaching quantum physics to goldfish",
        "🧀 starting an underground cheese trading network",
        "🔍 attempting to domesticate wild semicolons",
        "🌊 surfing the dark web for rare pepes",
        "🎓 establishing a university for professional meme studies",
        "🗣️ inventing a new language based entirely on emojis",
        "🍕 running an underground pizza arbitrage scheme",
        "📚 hosting seminars on professional procrastination",
        "🤖 developing AI-powered rubber ducks",
        "💨 selling premium air from 2019",
        "😢 starting a support group for misunderstood memes",
        "☁️ attempting to classify clouds by their personality types",
        "📝 writing documentation that people actually read",
        "💃 teaching interpretive dance to binary code",
        "😡 organizing a protest against Monday mornings",
        "🌱 trying to explain Bitcoin to house plants"
    ];

    // Choose whether to use event-based headline or not
    const useEventHeadline = customEvent || Math.random() < 0.7; // 70% chance to use event headline if no custom event

    // Select the headline based on whether we're using an event
    const headline = useEventHeadline 
      ? headlinesWithEvent[Math.floor(Math.random() * headlinesWithEvent.length)]
      : headlinesWithoutEvent[Math.floor(Math.random() * headlinesWithoutEvent.length)];

    // If using event headline, either use custom event or random default event
    const event = customEvent || defaultEvents[Math.floor(Math.random() * defaultEvents.length)];

    // Create description with appropriate replacements
    const description = headline.includes('{event}')
      ? headline
          .replace('{user}', `<@${target.id}>`)
          .replace('{event}', `**${event}**`)
      : headline.replace('{user}', `<@${target.id}>`);

    // Generate subheadlines
    const subheadlines = [
        "🤔 Experts say this could change the way we think about everything.",
        "💥 Social media erupts in chaos following the revelation.",
        "😮 Multiple witnesses still in disbelief.",
        "💻 The internet has officially broken.",
        "🎯 Nobody saw this coming, especially not the experts.",
        "📈 This story continues to develop in unexpected ways.",
        "🤐 Sources close to the situation remain speechless.",
        "🧪 The implications of this discovery are yet to be fully understood.",
        "✍️ Fact-checkers are working overtime to verify these claims.",
        "⚔️ The community remains divided on this unprecedented event.",
        "👻 Local residents report strange phenomena in the aftermath.",
        "🔍 Conspiracy theorists claim they 'knew it all along'.",
        "🤯 Scientists struggle to explain these recent developments.",
        "🏛️ Government officials decline to comment at this time.",
        "📱 Social media influencers scramble to create reaction content.",
        "📚 Historians mark this as a pivotal moment in human history.",
        "📊 Stock markets fluctuate wildly in response to the news.",
        "⏰ Time travelers from the future still refuse to spoil the ending.",
        "🧊 Experts suggest this might be just the tip of the iceberg.",
        "🍕 Local pizza delivery services report unusual spike in orders.",
        "👥 Thousands gather online to discuss these revelations.",
        "🤓 Reddit users already creating elaborate theories.",
        "🐦 Twitter's servers barely handling the trending hashtags.",
        "👎 Facebook fact-checkers take collective sick day.",
        "💃 TikTok users racing to create interpretive dances about this."
    ];

    const randomSubheadline = subheadlines[Math.floor(Math.random() * subheadlines.length)];

    const newsImages = [
      'https://lobfile.com/file/LWeWHcW3.jpg', // LeBron shocked
      'https://chhsnews.net/wp-content/uploads/2022/11/Screenshot-2022-11-03-3.48.53-PM.png', // lebron shocked 2
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRH2hhew94XIxmxXJnhGkDu3IbL_WXiyjYyhg&s' //lebron shocked 3

    ];

    const expertNames = [
        "Dr. News Person III, PhD in Breaking News",
        "Professor Factual McTruthington",
        "Senior Analyst Captain Obvious",
        "Chief Investigator Detective Sherlock Homie",
        "World-Renowned Expert Dr. Cap 🧢",
        "Distinguished Scholar Sir Spits Facts",
        "Lead Researcher Dr. Source: Trust Me Bro",
        "News Specialist Agent Definitely Real",
        "Celebrity Expert Dr. Touch Grass, MD",
        "Chief Correspondent Major Cap'n Crunch",
        "Professor Clickbait, Chair of Viral Studies",
        "Dr. Totally Legit, Expert in Everything",
        "Professor Meme Lord, PhD in Viral Dynamics",
        "Dr. No Cap, Head of Truth Department",
        "Distinguished Fellow of 'I Did My Own Research'",
        "Professor Internet Explorer, Always Late to Facts",
        "Dr. Wikipedia, Master of Surface-Level Knowledge",
        "Chief Expert of Making Things Up Institute",
        "Professor Social Media, PhD in Going Viral",
        "Dr. Definitely Not Three Kids in a Lab Coat",
        "Senior Fellow at Trust Me University",
        "Professor Chad Factington III, Esq.",
        "Dr. Viral Content, Expert in Internet Culture",
        "Professor Actually Read the Article",
        "Dr. Screenshot, Expert in Digital Evidence"
    ];

    const expertQuotes = [
        "📊 I've analyzed thousands of cases, but this one takes the cake.",
        "🔬 In all my years of research, I never thought I'd see something like this.",
        "🤔 My professional opinion? Absolutely wild.",
        "💫 This changes everything we thought we knew about everything.",
        "👓 I had to check my glasses multiple times to believe what I was seeing.",
        "💰 We're going to need a bigger research grant for this one.",
        "👴 I spent 69 years studying this field, and this is unprecedented.",
        "🧮 According to my calculations, this is certified hood classic material.",
        "🐕 My brother's friend's cousin's dog's previous owner can confirm this.",
        "👥 I've consulted with my colleagues, and we're all equally confused.",
        "🧪 This makes quantum physics look like kindergarten math.",
        "🐠 I showed this to my pet goldfish and even he was shocked.",
        "🎬 As someone who has watched every episode of CSI, this is legit.",
        "👽 I'm not saying it was aliens, but... it was probably aliens.",
        "😱 My research assistant fainted when they saw this data.",
        "🔢 I've run the numbers 420 times, and they don't lie.",
        "🧬 This is beyond science... we're in meme territory now.",
        "🎓 My PhD in Advanced Memology didn't prepare me for this.",
        "👀 I've seen things you people wouldn't believe, but this...",
        "📚 According to my extensive research on Wikipedia...",
        "😎 My professional opinion is: bruh.",
        "🤖 Even my AI assistant is questioning reality right now.",
        "🌈 This makes the double rainbow guy look underwhelmed.",
        "➗ I had to invent new mathematical equations to explain this.",
        "🎭 My degree in Professional Speculation is finally paying off."
    ];

    // Create the news embed
    const newsEmbed = new EmbedBuilder()
      .setColor('#FF0000')
      .setTitle('🚨 BREAKING NEWS 🚨')
      .setDescription(description)
      .addFields(
        { name: 'Developing Story', value: randomSubheadline },
        { 
          name: 'Expert Analysis', 
          value: `"${expertQuotes[Math.floor(Math.random() * expertQuotes.length)]}" - ${expertNames[Math.floor(Math.random() * expertNames.length)]}`
        }
      )
      .setImage(newsImages[Math.floor(Math.random() * newsImages.length)])
      .setTimestamp()
      .setFooter({ 
        text: 'Totally Real News Network™', 
        iconURL: interaction.client.user.displayAvatarURL() 
      });

    await interaction.reply({ embeds: [newsEmbed] });
  },
};