/*
 * COMEDY.EXE — site content. This is the one file to edit when something changes.
 *
 *   New set uploaded?   Add it to the TOP of `clips`. The set counter, latest-set
 *                       player, marquee, boot screen and clip library all follow.
 *   New gig booked?     Add it to `shows` (see the example there). Past dates
 *                       drop off the calendar on their own.
 *   New short?          Add it to `shorts` (best ones first — the first plays on the home page).
 *   New podcast ep?     Add it to the top of `podcast.episodes`.
 *
 * Video ids are the part after `watch?v=` (or `/shorts/`) in the YouTube URL.
 */
window.SITE = {
  name: 'Ryan Morris',
  brand: 'COMEDY.EXE',
  tagline: 'I don’t repeat jokes, I repeat mistakes.',
  timezone: 'America/Toronto',

  socials: {
    youtube: 'https://www.youtube.com/@RyanMorrisComedy',
    subscribe: 'https://www.youtube.com/@RyanMorrisComedy?sub_confirmation=1',
    shorts: 'https://www.youtube.com/@RyanMorrisComedy/shorts',
    instagram: 'https://www.instagram.com/ryanmorriscomedy/',
    x: 'https://x.com/RyanMorrisComedy',
    github: 'https://github.com/hackmods',
    linkedin: 'https://www.linkedin.com/in/ryanjamesmorris'
  },

  /*
   * Shown in the "For bookers" window. Leave a line empty ('') and it stays hidden.
   *   lengths: e.g. '5, 10 or 20 minutes'
   *   hosting: e.g. 'Available to host or MC'
   *   tech:    e.g. 'One mic and a stand. Puppets travel with me.'
   *   travel:  e.g. 'Anywhere within two hours of Niagara Falls'
   *   credits: e.g. 'Finalist, Garden City Grass Roots Comedy Contest'
   */
  booking: {
    lengths: '5 to 15 minutes',
    hosting: 'Available to host / MC a show',
    tech: '',
    travel: 'Travels across the area as needed',
    credits: ''
  },

  // What the clip library can filter by.
  tags: {
    crowd: 'Crowd work',
    puppets: 'Puppets',
    props: 'Props',
    dad: 'Dad life',
    clean: 'Clean',
    roast: 'Roasts'
  },

  rooms: {
    bomb: 'Bomb Comedy Tour / Laugh Lab',
    taps: 'Taps Apps & Laughs',
    spotlight: 'Spotlight Comedy Club',
    local: 'Local Laughs',
    vr: 'Failed To Render VR'
  },

  /*
   * Newest first. `set` is the set number, or a label for things outside the
   * count ('VR-14', 'Roast 1', 'Swap 2') — those don't move the set counter.
   * Optional: length, room (a key from `rooms`), venue (overrides the room's
   * name), tags, notes.
   */
  clips: [
    { set: 139, id: 'Q7fhoz4e-TA', title: 'Set #139', length: '13:42' },
    { set: 133, id: 'zdaHZs4fyZk', title: 'Why Vintage Shirt Sizes Changed After 9/11', length: '8:12', room: 'bomb' },
    { set: 132, id: 'XvD7GW7vZWo', title: 'I Accidentally Crashed A Catholic School Meeting', length: '5:55', room: 'spotlight', tags: ['dad'] },
    { set: 131, id: 'YdDSdbrCmnQ', title: 'Fast-Talking Comedian Roasts French Immersion & Cat Cafes', length: '10:01', room: 'taps', tags: ['dad'] },
    { set: 130, id: 'WCV0oTDywaQ', title: 'He Asked Why Nobody Uses Milk Crates Anymore...', length: '7:57', room: 'bomb' },
    { set: 129, id: 's4UynjjvCRE', title: 'What Happens When A Fast-Talker Hits Steel City', length: '5:30', room: 'taps' },
    { set: 128, id: 'AXxxkOG7leI', title: 'He Asked Siri For Help (And It Got Incredibly Dark)', length: '6:40' },
    { set: 127, id: 'wr8w57q8g-w', title: 'Why He Brought A Ketchup Packet On Stage...', length: '8:37', room: 'local', tags: ['props'] },
    { set: 126, id: 'ntDTUaTYyA8', title: 'Why Divorced Dads Secretly Love Christmas In July', length: '10:57', tags: ['dad'] },
    { set: 125, id: 'upYiwuCMF9M', title: 'His "Christmas In July" Bit Went Completely Off The Rails', length: '9:24', room: 'bomb', tags: ['crowd'], notes: 'Holiday bit goes off the rails. Crowd work. High risk, high reward.' },
    { set: 124, id: 'Fk7gRNqkeKs', title: 'The Real Reason Divorced Dads Love "Half Christmas"', length: '6:05', tags: ['dad'], notes: 'Divorced-dad observational bit.' },
    { set: 123, id: '2BsmOzu8JFA', title: 'Comedian Brings A Keyboard And Instant Chaos', length: '8:02', room: 'bomb', tags: ['props'], notes: 'Prop comedy. Instant chaos.' },
    { set: 122, id: '8a6c1inMrxQ', title: 'He Brought Puppets To A Comedy Show (It Got Weird)', length: '7:55', room: 'bomb', tags: ['puppets'], notes: 'Puppet set. It got weird.' },
    { set: 121, id: 'b3p9mBinPog', title: 'He Brought An Owl Puppet To A Comedy Club... The Host Lost It', length: '8:54', room: 'bomb', tags: ['puppets'], notes: 'Owl puppet. Host lost it.' },
    { set: 120, id: 'ftc4sssVTc4', title: 'He Brought A Paper Bag To A Comedy Club... And Roasted The Front Row', length: '6:04', tags: ['props', 'crowd'], notes: 'Paper bag prop. Front-row roast.' },
    { set: 119, id: 'UevZFqrmsFo', title: 'Why I Brought A Ghost Puppet To An Open Mic', length: '9:48', room: 'bomb', tags: ['puppets', 'clean'], notes: 'Ghost puppet open mic.' },
    { set: 118, id: 'L-nSzHmYS5M', title: 'Unhinged Puppet Comedy & Bizarre Turtle Facts', length: '11:41', room: 'local', tags: ['puppets'], notes: 'Puppets + bizarre turtle facts.' },
    { set: 117, id: 'ZuJPG0gCcRA', title: 'I Handed Out Expired Condoms To The Front Row...', length: '9:01', room: 'bomb', tags: ['props', 'crowd'], notes: 'High-risk crowd interaction.' },
    { set: 116, id: '7nIkuRAhTSs', title: 'Treating A Comedy Open Mic Like An Unhinged Therapy Session', length: '9:41', room: 'local', notes: 'Therapy-session energy.' },
    { set: 115, id: 'As2tbjjNaDk', title: 'The Panel Roasted Me For Doing This Joke In Front Of My Kid', length: '7:16', room: 'bomb', tags: ['dad'] },
    { set: 114, id: 'TNUIY0RF4Zo', title: 'The Most Awkward Birthday Roast At A Comedy Club', length: '8:50', room: 'bomb', tags: ['crowd'] },
    { set: 113, id: '3URKnqZqOYY', title: 'Ryan forgets to tell a punchline', length: '13:12', room: 'local' },
    { set: 112, id: 'Cit-hien0v4', title: 'Ryan makes balloon artwork jokes and art', length: '7:09', room: 'bomb', tags: ['props'] },
    { set: 111, id: 'C2qNHbPDIn8', title: 'Hans Solo appears for May 4th', length: '6:09', room: 'bomb' },
    { set: 110, id: 'JMHZkgxQjwQ', title: 'Ryan goes bullet in the Garden City Grass Roots Comedy Contest', length: '6:21', venue: 'Garden City Grass Roots' },
    { set: 109, id: 'oKZFvGS9BDo', title: 'Ryan gives a shout out to Gen Z', length: '7:22', room: 'bomb' },
    { set: 108, id: '_NTDyznk0O8', title: 'Ryan explains condom education', length: '5:42', room: 'local' },
    { set: 107, id: 'WA18AJ52f1U', title: 'Ryan talks about 4/20 on the holiday', length: '9:26', room: 'bomb' },
    { set: 105, id: 'SNdY7oTdxa8', title: 'Ryan Gets His Funny Back', length: '7:52', room: 'taps' },
    { set: 104, id: 'vODzoID6u5A', title: 'Ryan explains how to be a hack comic', length: '9:17', room: 'bomb' },
    { set: 103, id: '2jGodB1yPY0', title: 'Ryan learns the art of cool', length: '9:22', room: 'bomb' },
    { set: 100, id: '_RuJmx2mGv8', title: 'Ryan headlines for his 100th set', length: '16:28', room: 'bomb', notes: 'The 100th set — a headline spot at Bomb Comedy Tour.' },
    { set: 99, id: 'e-C7lCNQ8zY', title: 'Ryan Morris does a set like Ryan Morris', length: '9:05', room: 'bomb' },
    { set: 97, id: 'uqnxHnU9r7A', title: 'Trump Visits Canada', length: '8:41', room: 'bomb' },
    { set: 96, id: 'k9wLLNoky-k', title: 'Comedy Carnival – Cat Pee Lasagna Twin Towers Oh My!', length: '5:48', room: 'spotlight' },
    { set: 95, id: 'GALdvMUOaKc', title: 'Ryan’s Monday Madness', length: '9:03', room: 'bomb' },
    { set: 94, id: 'x81jApzxG2U', title: 'Trader Jokes featuring 9/11 jokes', length: '7:16', room: 'spotlight' },
    { set: 93, id: 'm0yggswbygE', title: 'Ryan does "comedy"', length: '10:36', room: 'taps' },
    { set: 91, id: 'W1Z_uX6P-W0', title: 'Ben Affleck advocates for fellow comics', length: '7:31', room: 'bomb' },
    { set: 87, id: 'LNWensoYRig', title: 'A set about nothing', length: '11:39', room: 'bomb' },
    { set: 86, id: '138SZsTlz6o', title: 'It’s Raining Ryan', length: '6:16', room: 'bomb' },
    { set: 83, id: 'maE6nEsSeHM', title: 'Confidence', length: '5:43', room: 'bomb' },
    { set: 82, id: 'xnnXWmTXG9Y', title: 'Cat Like Confidence', length: '10:08', room: 'bomb' },
    { set: 81, id: '15hlW-ZKoDY', title: 'The Laugh Lab Winning Set Of The Night!', length: '8:35', room: 'bomb' },
    { set: 79, id: 'mTthdsmQJDk', title: 'Niagara legend Poopie makes an appearance un français', length: '10:39', room: 'bomb' },
    { set: 78, id: 'SXMp7WTexQ0', title: 'Comedy Christmas Party (family friendly)', length: '6:21', room: 'taps', tags: ['clean'], notes: 'Family-friendly Christmas party set.' },
    { set: 74, id: 'DFztFHYkESA', title: 'Fresh Baked Comedy – Cats (family friendly)', length: '5:41', venue: 'Fresh Baked Comedy', tags: ['clean'] },
    { set: 73, id: '2qdeVWAi2iI', title: 'The Laugh Lab', length: '9:52', room: 'bomb' },
    { set: 66, id: 'V-DcIs_8KWg', title: 'Ryan Reads Classic Literature', room: 'bomb', notes: 'Reading classic monster jokes at Laugh Lab. Act outs. Crowd work.' },
    { set: 64, id: '7a8UEhIugc8', title: 'Taps Apps & Laughs set', length: '8:07', room: 'taps' },
    { set: 44, id: 'UjQXhNzxLqU', title: 'Taps Apps & Laughs set', length: '8:14', room: 'taps' },
    { set: 42, id: 'PzRJnJpQcuc', title: 'Comedy Bomb Tour – Laugh Lab', length: '6:55', room: 'bomb' },
    { set: 40, id: 'vUj-0RemEn0', title: 'Taps Apps & Laughs set', length: '8:51', room: 'taps' },
    { set: 32, id: 'Pb1dlCfgMEE', title: 'Unhinged Crowd Work: Making The Front Row Extremely Uncomfortable', length: '7:36', room: 'bomb', tags: ['crowd'] },
    { set: 30, id: '1BqcyLdpNyM', title: 'Ryan Morris goes bullet', length: '8:41', room: 'taps' },
    { set: 15, id: 'XPZb2Ahuquo', title: 'The Local – Marc Birthday Roast', length: '4:56', room: 'local', tags: ['roast'] },
    { set: 7, id: 'PU-xvICSm8Y', title: 'Taps Apps & Laughs set', length: '7:41', room: 'taps' },
    { set: 1, id: 'w4so4iddUoM', title: 'Ryan Morris performs his first comedy set', length: '6:36', room: 'taps', notes: 'Set #1. Everybody starts somewhere.' },

    { set: 'Roast 2', id: 'YToZ2n1Lipg', title: 'Roast Battle: Ryan Morris vs Diane Hamilton', length: '9:46', venue: 'Rose City Comedy Collective', tags: ['roast'] },
    { set: 'Roast 1', id: 'dwxXFkquxFU', title: 'Roast Battle: Ryan Morris vs Anthony Van Dyke', length: '10:00', room: 'spotlight', tags: ['roast'] },
    { set: 'Swap 3', id: 'LYTE6BoJhq4', title: 'Trader Jokes #3 – Ryan Morris and Dickie Lakeshore', length: '7:01', room: 'spotlight' },
    { set: 'Swap 2', id: 'ZIM8QmYCdlY', title: 'Trader Jokes #2 – Ryan Morris / Gary McCormick / Robby Learn', length: '22:04', room: 'spotlight' },
    { set: 'Swap 1', id: 'Kg65mWFqyXk', title: 'Trader Jokes #1 – Ryan Morris and Amanda Bobbitt', length: '9:53', room: 'spotlight' },

    { set: 'VR-17', id: '9nP2y0S_Bqw', title: 'He Wore A High-Vis Vest To A PTA Meeting... It Worked', length: '5:55', room: 'vr', tags: ['dad'] },
    { set: 'VR-16', id: 'SJIc6WuVdpk', title: 'Gary Does A Set – Monday Night Open Mic', length: '4:52', room: 'vr', tags: ['puppets'] },
    { set: 'VR-15', id: 'DVAQcGpmGqs', title: 'Garry goes bullet and bombs trying to win over America', length: '8:46', room: 'vr', tags: ['puppets'] },
    { set: 'VR-14', id: 'SEiQ6Gmhgs0', title: 'Why Mobile Users Ruin Virtual Reality Comedy Shows', length: '6:32', room: 'vr' },
    { set: 'VR-14', id: 'BqQSTg4WFRQ', title: 'Thomas and Friends Lore', length: '2:17', room: 'vr' },
    { set: 'VR-14', id: 'HoO8SGCV7S0', title: 'Gary advocates for safe lubricate use', length: '1:37', room: 'vr', venue: 'Bomb Voyage (VR)', tags: ['puppets'] },
    { set: 'VR-13', id: 'hNcVNdeFHBs', title: 'Gary Does A Repeat', length: '4:41', room: 'vr', tags: ['puppets'] },
    { set: 'VR-12', id: 'v_qscF35JRs', title: 'Gary Does Gay Voice', length: '4:40', room: 'vr', tags: ['puppets'] },
    { set: 'VR-11', id: '3IrDYdAgXzs', title: 'Ventriloquist Puppet! Monday Night Open Mic', length: '4:38', room: 'vr', tags: ['puppets'] },
    { set: 'VR-11', id: 'bdgf5qV6b3I', title: 'Gary talks about his ventriloquist father', length: '2:23', room: 'vr', venue: 'Bomb Voyage (VR)', tags: ['puppets'] },
    { set: 'VR-10', id: '20f4R9GRU3s', title: 'Gary The Puppet – Anchor Show', length: '7:16', room: 'vr', tags: ['puppets'] },
    { set: 'VR-9', id: 'A6ZwGbZiCMY', title: 'Gary the puppet shares some thoughts – winning set of the night', length: '6:36', room: 'vr', venue: 'Bomb Voyage (VR)', tags: ['puppets'] },
    { set: 'VR-8', id: 'SXeC8PqPQEA', title: 'Ventriloquist Puppet! Friday Night Open Mic', length: '4:45', room: 'vr', tags: ['puppets'] },
    { set: 'VR-7', id: 'pu1H9NV7PRg', title: 'Lasagna, ricotta cheese, and maple syrup oh my EH – Anchor Show', length: '9:30', room: 'vr' },
    { set: 'VR-6', id: 'd5jOA4y7ExM', title: 'Why Canada Is The Move!', length: '4:51', room: 'vr' },
    { set: 'VR-5', id: '6go0CwkTa6M', title: 'Cats, Chaos, & Comedy!', length: '3:59', room: 'vr' },
    { set: 'VR-4', id: 'ihs07OG7_Q4', title: 'Garden City Comedy Festival Takeover', length: '1:08:59', room: 'vr' },
    { set: 'VR-3', id: 'ZDDPnTV1VQE', title: 'Gare Bear the Puppet', length: '4:56', room: 'vr', tags: ['puppets'] },
    { set: 'VR-2', id: 'dQSJ1HblxhQ', title: 'Evil Gary Puppet', length: '7:02', room: 'vr', tags: ['puppets'] },
    { set: 'VR-1', id: 'A8qybLQThxo', title: 'Friday Night Open Mic', length: '4:39', room: 'vr' }
  ],

  // Video ids for the home-page players.
  featured: 'YdDSdbrCmnQ',
  featuredVr: '9nP2y0S_Bqw',

  // Most-watched first.
  shorts: [
    { id: 'EMcXjCKcvkw', title: 'I can play any character EXCEPT...' },
    { id: 'z5UuAs72eCg', title: 'The most brutal tight jeans roast ever' },
    { id: 'IdTQsJlNrgc', title: 'The ultimate 2-second reaction test' },
    { id: '3xp0AsJNjxc', title: 'The most depressing comedy show affirmation' },
    { id: 'rhiqKxFvoBk', title: 'My political jokes went horribly wrong' },
    { id: 'jxOBS25RpaU', title: 'Essential life skills: cleaning up your mess' },
    { id: 'xBqvdhGUuig', title: 'The ultimate dry-mouth life hack' },
    { id: 'BEyHhtyitNs', title: 'How to get your homie a green card' },
    { id: 'KBTIWEPOGLo', title: 'My secret to eco-friendly gardening' },
    { id: 'NPpO1jt1mq0', title: 'Hypnotic puppet eyes?' },
    { id: 'D7WzVRiDGLY', title: 'The ultimate loophole to get into Heaven' },
    { id: 'XvUaf6bDneU', title: 'Replaced my ex with a puppet...' },
    { id: '7l8DlsbEA_o', title: 'Cookie Monster is woke now' },
    { id: 'W7DnvQ_2seE', title: 'Seducing the crowd with my puppet' },
    { id: '2oTugUuEPng', title: 'When your code bombs as hard as your standup' }
  ],

  podcast: {
    name: 'The Green Room',
    playlist: 'https://www.youtube.com/playlist?list=PLY2zp5JNUtbT4aR6XqgmBgNhrljPZGn2L',
    // Newest first; the home page lists the first six.
    episodes: [
      { id: 'Had9Z_dneMo', title: 'Ep 18', length: '1:44:35' },
      { id: 'rUkHPgsq9iw', title: 'Ep 17 – K’s Gay Restaurant', length: '1:41:50' },
      { id: 'sZlJdOKskfo', title: 'Ep 16 – Geneviève Helps Robby Find Love', length: '2:10:51' },
      { id: 'kxHFJwUJgT8', title: 'Ep 15 – Jesse Returns, Robby Dies', length: '1:56:01' },
      { id: 'eItObFpeZdw', title: 'Ep 14 – Nut Sales, Rub & Tugs', length: '2:02:45' },
      { id: 'eEsoAq0Hhl4', title: 'Ep 13 – Gay Stuff, Tier List Pt 2', length: '1:56:57' },
      { id: '8usfNu4FHRw', title: 'Ep 12 – The Tier List Pt 1', length: '1:46:17' },
      { id: 'ozDHXNMEom0', title: 'Ep 11 – Ryan Stole Your Girl', length: '1:29:15' },
      { id: '8cLCKh1qqG8', title: 'Episode 10!', length: '1:35:40' },
      { id: 'ke1aOjZgxAE', title: 'Ep 9 – O Ryan, Where Art Thou?', length: '1:43:06' },
      { id: 'B8C2TJhmZak', title: 'Ep 8 – The Plank Competition', length: '1:17:58' },
      { id: 'L8PSdxuVxlA', title: 'Ep 7 – Ryan Starts an Onlyfans', length: '1:11:39' },
      { id: '4hhNHyBZZKo', title: 'Ep 6 – The Dr Pepper Incident', length: '1:03:52' },
      { id: 'BDD1ofJnS3k', title: 'Ep 5 – Ryan Pops a Zyn', length: '1:17:15' },
      { id: 'zh2ysHoHpm8', title: 'Ep 4 – PLAY THEOTOWN NOW', length: '1:10:39' }
    ]
  },

  /*
   * One-off dates:
   *   { date: '2026-11-14', time: '8:00 PM', title: 'Showcase night',
   *     venue: 'Spotlight Comedy Club', city: 'St. Catharines, ON',
   *     tickets: 'https://…' }
   * `link` + `linkLabel` add a second button (the show's own site, say);
   * `map` adds a Map button.
   *
   * Standing gigs use `weekday` (0 = Sunday … 6 = Saturday) instead of `date`;
   * the calendar works out the next one.
   */
  shows: [
    {
      weekday: 1,
      time: '8:30 PM',
      title: 'The Bomb Comedy Show',
      venue: 'Taps Brewhouse, 4680 Queen St',
      city: 'Niagara Falls, ON',
      note: 'Hosted by Robby Learn, put on by Andrew Burns. Ryan is a regular, every Monday — lineups go up on Instagram.',
      map: 'https://www.google.com/maps/search/?api=1&query=Taps+Brewhouse+4680+Queen+St+Niagara+Falls+ON',
      link: 'https://linktr.ee/bombcomedytour?utm_source=RyanMorris',
      linkLabel: 'Bomb Comedy Tour'
    }
  ],

  marquee: [
    'RYAN MORRIS COMEDY',
    'SET COUNT: {sets}',
    'NIAGARA FALLS',
    'EVERY MONDAY @ THE BOMB COMEDY SHOW',
    'CROWD WORK DISASTERS',
    'DAD LIFE RANTS',
    'BAD ADVICE',
    'THE GREEN ROOM PODCAST',
    'STAND-UP IN VR',
    'GITHUB.COM/HACKMODS',
    'SUPPORT LOCAL COMEDY'
  ]
};
