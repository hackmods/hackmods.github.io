/*
 * COMEDY.EXE — site content. This is the one file to edit when something changes.
 *
 *   New set uploaded?   Add it to the TOP of `clips`. The set counter, latest-set
 *                       player, marquee, boot screen and clip library all follow.
 *   New gig booked?     Add it to `shows` (see the example there). Past dates
 *                       drop off the calendar on their own.
 *   New short?          Add it to `shorts`.
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
    shorts: 'https://www.youtube.com/@RyanMorrisComedy/shorts',
    instagram: 'https://www.instagram.com/ryanmorriscomedy/',
    x: 'https://x.com/RyanMorrisComedy',
    github: 'https://github.com/hackmods',
    linkedin: 'https://www.linkedin.com/in/ryanjamesmorris'
  },

  // Tags the clip library can filter by.
  tags: {
    crowd: 'Crowd work',
    puppets: 'Puppets',
    props: 'Props',
    dad: 'Dad life',
    vr: 'VR shows'
  },

  /*
   * Newest first. `set` is the set number (or a label like 'VR-14' for the
   * VR series — those don't count toward the set counter).
   * Optional: length, venue, tags, notes.
   */
  clips: [
    { set: 139, id: 'Q7fhoz4e-TA', title: 'Set #139', length: '13:42' },
    { set: 133, id: 'zdaHZs4fyZk', title: 'Why Vintage Shirt Sizes Changed After 9/11', length: '8:12' },
    { set: 'VR-14', id: 'SEiQ6Gmhgs0', title: 'Why Mobile Users Ruin Virtual Reality Comedy Shows', length: '6:32', venue: 'VR comedy show', tags: ['vr'] },
    { set: 132, id: 'XvD7GW7vZWo', title: 'I Accidentally Crashed A Catholic School Meeting', length: '5:55', tags: ['dad'] },
    { set: 126, id: 'ntDTUaTYyA8', title: 'Why Divorced Dads Secretly Love Christmas In July', length: '10:57', tags: ['dad'] },
    { set: 131, id: 'YdDSdbrCmnQ', title: 'Fast-Talking Comedian Roasts French Immersion & Cat Cafes', length: '10:01', tags: ['dad'] },
    { set: 'VR-17', id: '9nP2y0S_Bqw', title: 'He Wore A High-Vis Vest To A PTA Meeting... It Worked', length: '5:55', venue: 'VR comedy show', tags: ['vr', 'dad'] },
    { set: 130, id: 'WCV0oTDywaQ', title: 'He Asked Why Nobody Uses Milk Crates Anymore...', length: '7:57' },
    { set: 129, id: 's4UynjjvCRE', title: 'What Happens When A Fast-Talker Hits Steel City', length: '5:30' },
    { set: 127, id: 'wr8w57q8g-w', title: 'Why He Brought A Ketchup Packet On Stage...', length: '8:37', tags: ['props'] },
    { set: 128, id: 'AXxxkOG7leI', title: 'He Asked Siri For Help (And It Got Incredibly Dark)', length: '6:40' },
    { set: 124, id: 'Fk7gRNqkeKs', title: 'The Real Reason Divorced Dads Love "Half Christmas"', length: '6:05', tags: ['dad'], notes: 'Divorced-dad observational bit.' },
    { set: 125, id: 'upYiwuCMF9M', title: 'His "Christmas In July" Bit Went Completely Off The Rails', length: '9:24', tags: ['crowd'], notes: 'Holiday bit goes off the rails. Crowd work. High risk, high reward.' },
    { set: 123, id: '2BsmOzu8JFA', title: 'Comedian Brings A Keyboard And Instant Chaos', length: '8:02', tags: ['props'], notes: 'Prop comedy. Instant chaos.' },
    { set: 122, id: '8a6c1inMrxQ', title: 'He Brought Puppets To A Comedy Show (It Got Weird)', length: '7:55', tags: ['puppets'], notes: 'Puppet set. It got weird.' },
    { set: 121, id: 'b3p9mBinPog', title: 'He Brought An Owl Puppet To A Comedy Club... The Host Lost It', length: '8:54', tags: ['puppets'], notes: 'Owl puppet. Host lost it.' },
    { set: 120, id: 'ftc4sssVTc4', title: 'He Brought A Paper Bag To A Comedy Club... And Roasted The Front Row', length: '6:04', tags: ['props', 'crowd'], notes: 'Paper bag prop. Front-row roast.' },
    { set: 119, id: 'UevZFqrmsFo', title: 'Why I Brought A Ghost Puppet To An Open Mic', length: '9:48', tags: ['puppets'], notes: 'Ghost puppet open mic.' },
    { set: 118, id: 'L-nSzHmYS5M', title: 'Unhinged Puppet Comedy & Bizarre Turtle Facts', length: '11:41', tags: ['puppets'], notes: 'Puppets + bizarre turtle facts.' },
    { set: 117, id: 'ZuJPG0gCcRA', title: 'I Handed Out Expired Condoms To The Front Row...', length: '9:01', tags: ['props', 'crowd'], notes: 'High-risk crowd interaction.' },
    { set: 116, id: '7nIkuRAhTSs', title: 'Treating A Comedy Open Mic Like An Unhinged Therapy Session', length: '9:41', notes: 'Therapy-session energy.' },
    { set: 115, id: 'As2tbjjNaDk', title: 'The Panel Roasted Me For Doing This Joke In Front Of My Kid', length: '7:16', tags: ['dad'] },
    { set: 114, id: 'TNUIY0RF4Zo', title: 'The Most Awkward Birthday Roast At A Comedy Club', length: '8:50', tags: ['crowd'] },
    { set: 113, id: '3URKnqZqOYY', title: 'Ryan forgets to tell a punchline', length: '13:12', venue: 'Local Laughs' },
    { set: 112, id: 'Cit-hien0v4', title: 'Ryan makes balloon artwork jokes and art', length: '7:09', venue: 'Bomb Comedy Tour', tags: ['props'] },
    { set: 111, id: 'C2qNHbPDIn8', title: 'Hans Solo appears for May 4th', length: '6:09', venue: 'Bomb Comedy Tour' },
    { set: 110, id: 'JMHZkgxQjwQ', title: 'Ryan goes bullet in the Garden City Grass Roots Comedy Contest', length: '6:21', venue: 'Garden City Grass Roots' },
    { set: 109, id: 'oKZFvGS9BDo', title: 'Ryan gives a shout out to Gen Z', length: '7:22', venue: 'Bomb Comedy Tour' },
    { set: 108, id: '_NTDyznk0O8', title: 'Ryan explains condom education', length: '5:42', venue: 'Local Laughs' },
    { set: 107, id: 'WA18AJ52f1U', title: 'Ryan talks about 4/20 on the holiday', length: '9:26', venue: 'Bomb Comedy Tour' },
    { set: 78, id: 'SXMp7WTexQ0', title: 'Comedy Christmas Party (family friendly)', venue: 'Taps Apps & Laughs', notes: 'Family-friendly Christmas party set.' },
    { set: 66, id: 'V-DcIs_8KWg', title: 'Ryan Reads Classic Literature', venue: 'Laugh Lab / Bomb Comedy Tour', notes: 'Reading classic monster jokes at Laugh Lab. Act outs. Crowd work.' }
  ],

  // The second player on the home page — a set worth showing off.
  featuredSet: 66,

  shorts: [
    { id: 'D7WzVRiDGLY', title: 'The ultimate loophole to get into Heaven' },
    { id: 'EMcXjCKcvkw', title: 'I can play any character EXCEPT...' },
    { id: 'z5UuAs72eCg', title: 'The most brutal tight jeans roast ever' },
    { id: 'IdTQsJlNrgc', title: 'The ultimate 2-second reaction test' },
    { id: '3xp0AsJNjxc', title: 'The most depressing comedy show affirmation' },
    { id: 'rhiqKxFvoBk', title: 'My political jokes went horribly wrong' },
    { id: 'W7DnvQ_2seE', title: 'Seducing the crowd with my puppet' },
    { id: 'XvUaf6bDneU', title: 'Replaced my ex with a puppet...' },
    { id: 'NPpO1jt1mq0', title: 'Hypnotic puppet eyes?' },
    { id: 'xBqvdhGUuig', title: 'The ultimate dry-mouth life hack' },
    { id: '7l8DlsbEA_o', title: 'Cookie Monster is woke now' },
    { id: '2oTugUuEPng', title: 'When your code bombs as hard as your standup' }
  ],

  /*
   * One-off dates:
   *   { date: '2026-11-14', time: '8:00 PM', title: 'Showcase night',
   *     venue: 'Spotlight Comedy Club', city: 'St. Catharines, ON',
   *     tickets: 'https://…' }
   *
   * Standing gigs use `weekday` (0 = Sunday … 6 = Saturday) instead of `date`;
   * the calendar works out the next one.
   */
  shows: [
    {
      weekday: 1,
      title: 'The Bomb Comedy Show',
      venue: 'Laugh Lab / Bomb Comedy Tour',
      city: 'Niagara Falls, ON',
      note: 'Regular spot, every Monday. Start time and lineup go up on Instagram.'
    }
  ],


  marquee: [
    'RYAN MORRIS COMEDY',
    'SET COUNT: {sets}',
    'NIAGARA FALLS',
    'EVERY MONDAY @ THE BOMB COMEDY SHOW',
    'NO CLICKBAIT',
    'JUST GROWTH',
    'ST. CATHARINES',
    'BUFFALO FAN BILL',
    'LAUGH LAB',
    'GITHUB.COM/HACKMODS',
    'SUPPORT LOCAL COMEDY'
  ]
};
