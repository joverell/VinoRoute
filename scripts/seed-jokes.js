const admin = require('firebase-admin');

const jokesText = `
Hello wine…I’m home
I cook with wine. Sometimes I even add it to the food.
This may be the wine talking but I love wine.
The fun part about wine is having lots to do and not doing it.
Wine is constant proof that God loves us and loves to see us happy.
Everything happens for a Riesling.
Wine is to women as duct tape is to men; it fixes everything.
I’m not having a glass of wine. I’m having six. It’s called a tasting and it’s classy.
What is the definition of a good wine? It should start and end with a smile.
If you walk a mile in my shoes, you’ll end up in a wine bar.
Woman: “I love you.” Man: “Is that you or the wine talking?” Woman: “It’s me talking to the wine.”
Wine is not the answer. Wine is the question. Yes is the answer.
Wine is not the answer. It just makes you forget the question.
When I’m irritable, I tend to wine a lot.
It doesn’t matter if the glass is half empty or half full. There is clearly room for more wine.
Wine…because no great story started with someone eating a salad
If you decide to give up wine, you won’t actually live longer. It will just feel like it.
I finally quit drinking wine for good. Now I drink for evil.
Wine may not solve your problems, but neither will water or milk.
I drink Wine because I Hate keeping things Bottled Up.
Reality is an illusion that occurs due to a lack of wine.
If I go missing, please put my face on wine bottles so my friends know.
This wine is making me awesome.
Every box of raisins is a tragic tale of grapes that could have been wine.
Wine is cheaper than therapy.
Everyone needs believe in something. I believe I’ll have another glass of wine.
Drink is the feast of reason and the flow of soul.
Well, woke up this morning with a wine glass in my hand Whose wine? What wine? Where the hell did I dine? Must have been a dream I don’t believe where I’ve been Come on, let’s do it again
If God forbade drinking, would He have made wine so good?.
I’m the reason all the wine’s gone.
I used to think that drinking wine was bad for me…so I gave up thinking.
Unlike milk, it’s OK to cry over spilled wine
Making good wine is a skill. Fine wine is an art.
A good man can make you feel sexy, strong and able to achieve anything. Oh, sorry, that’s wine. Wine does that.
Like human beings, a wine’s taste is going to depend a great deal on its origins and its upbringing.
One not only drinks the wine, one smells it, observes it, tastes it, sips it and–one talks about it.
Artists and poets still find life’s meaning in a glass of wine.
Home is where the wine is waiting.
Sancerre; it’s all the French you need to know.
Be outdoorsy. Drink wine on the porch.
Wine is the best cure for Mondays.
It is well to remember that there are five reasons for drinking: the arrival of a friend, one’s present or future thirst, the excellence of the wine, or any other reason.
You haven’t drunk too much wine if you can still lie on the floor without holding on.
Hukana Moscato
Sips happen
Rosē all day.
Wine is the answer. What’s the question?
Rosē the day away.
I’m Aging like Fine Wine … I’m getting Complex and Fruity!
Wine improves with age. The older I get, the better I like it.
Truth and folly dwell in the wine-cask.
Wine tasting is my favorite sport.
Compromises are for relationships, not wine.
You can’t buy happiness but you can buy wine, and that’s kind of the same thing.
Wine makes daily life easier, less hurried, with fewer tensions and more tolerance.
I pair well with a lot of wines.
Wine doesn’t make me slur my words. It helps me speak in cursive.
Stop and smell the rosē.
You had me at Merlot.
Wine is the most civilized thing in the world.
There are more old wine drinkers than old doctors.
There are two reasons for drinking wine…when you are thirsty, to cure it; the other, when you are not thirsty, to prevent it… prevention is better than cure.
What did the grape say when he got stepped on? He let out a little wine.
The First Duty of wine is to be Red…the second is to be a Burgundy.
A friend said a wine he tried recently was bitter and not properly fermented. Sounds like sour grapes to me.
Coffee keeps me going until it’s time for wine.
Penicillin may cure, but wine makes people happy.
In victory, you deserve Champagne. In defeat you need it.
Never understood a single word he said but I helped him drink his wine…and he always had some mighty fine wine.
A meal without wine is like a day without sunshine.
Drink wine, and you will sleep well. Sleep, and you will not sin. Avoid sin, and you will be saved. Therefore, drink wine and be saved.
An empty bottle of wine is better than a filled one. It shows achievement.
A glass of wine is good for your health… The leftover in the bottle is good for your morale.
I’m a wine enthusiast. The more wine I drink, the more enthusiastic I get!
When a man drinks wine at dinner, he begins to be better pleased with himself.
Sorrow can be alleviated by good sleep, a bath and a glass of good wine.
Wine in itself is an excellent thing.
When the kids whine, I wine.
Drunkenness is not the wine’s fault, but the man’s.
Wine to me is passion. It’s family and friends. It’s warmth of heart and generosity of spirit. Wine is art. It’s culture. It’s the essence of civilization and the art of living.
The best use of bad wine is to drive away poor relations.
Wine has been a part of civilized life for some seven thousand years. It is the only beverage that feeds the body, soul and spirit of man and at the same time stimulates the mind.
Jingle bells, zinfandels, pass the cabernet.
Money can’t buy you happiness, but it can buy you wine which is almost the same thing.
God gave me coffee to change the things I can and wine to accept the things I can’t.
Wine flies when you’re having fun.
Wine carries no rudder.
Compromises are for relationships, not wine.
It takes a lot of beer to make good wine.
Water for fish, wine for men.
If I did one of those wine and paint nights the instructor would be like wow look at you, you are really good at wine.
Wine is bottled poetry.
Wine wears no mask.
A meal without wine is called breakfast.
I’m dreaming of a White Christmas, but if the white runs out, I’ll drink red wine.
Classy bitches drink wine.
`;

const initializeFirebaseAdmin = () => {
    if (admin.apps.length === 0) {
      const projectId = "vinoroute-e8d8d";
      const clientEmail = "firebase-adminsdk-fbsvc@vinoroute-e8d8d.iam.gserviceaccount.com";
      const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCi16Cu97Pvt7Q2\naFaSzlPrgfoG6vfTigX9f7e7w9WZY40zFIe0tdwfqneDl8fXxj3LcBThoqFtMi9i\nu/59g1XINr/HJMuwsf4QVFQ4/bhNi5bzNSBQal5ZOi2foniNXAR8/ZMT7I7iREE4\n6ovevnG884rz6vJ012+hV6cwaC1IiQ5vQ63zlEQYZPHU9ijQWK8ZypFnerNYU+EP\n2iOw4hYL3LVTjxRQ2SIuiTPHw9GcgtdUKwbwtg3zcdm9GgYn222QdN/Fgco1ODpy\nqpf5BExNOzStIgqPV58TvHosoWbwtQs8XW6qlGXLEMSbcaC+e1nOusc9N3IPR0vc\n3CoK3Mt3AgMBAAECggEACBZ7lZUZ68MNAVLHUf1Lb7wB5gwPiQMm7wND5eCBIGAw\naCQR5WjO6Qe3beLA+zeOZCdJ8jb4m4rNjbLWnfdC8HG/rq1mLH16p+b4U+hOGhPf\nyG6QD05pJzdbgr04DZVPZ8HUZz3tjtFjB+emUMbWsVLLSPgXWLRGiBXpaN8TuLF5\nrO3CjI04tghNblt/mGTABdU3R7ByQiSjKriTEa0zT0haz2cQbeTxhubIqQ3CVWtE\ndB7fJVlPAwHes3dkrG8szTXjoLxvysSF/qEPWKPHieJ4IQUbgMn/cSy6Yd7pEGfM\nA4h4lS1HTWisoN+qE0Syey3cDE9lZTyIgCv/2jloiQKBgQDMmeOw17bB8EW6heGO\n+HbOjFeOxFaoAK5QMKBd0bqe3ty++Agozxv4/YxtxaxWkDeReDWeGLrwjeDomToE\n3Ir1KWluvYoeJIU8WrzhMmFNwzFbA/3uHXTUTqrEUfVT4cY6VP/2ZjDx0kOTEePa\nxJr71fZrJtVCAE6q4xlc60StHQKBgQDLwC8wcQ8xhbZXbJRAMVtbHolWZ7RKDqtc\niu9jYmWZRWg+GpLPHjg2Vnpovn/5Q7GasK0wg6JfCw0mhA3ss7FEiwLhr1Npv6qs\nrjiWyip9vWUo5k+P/L1COQ/bjukwcqt1zZvoSjgopsX0dpOY6nqx0guY3oIkXmla\nNyVYeHI6owKBgCwjPqVVw81Owhwc6a3oF+kzCWh5HqCblP8jnlTe+71uInzoEQqM\ns2IhgHvl2unJrtMo9ZgniZx/XveOpp+J3EhLKL2FEhiylDOS95A1SBx4cVtLHyqR\nHDT4y4oSjDQOTq8iyx0iqohgbcd6Yoc9RpnxbHltJTBZ1J604zHSZzxZAoGAHkcp\n/A3hDx/qr+UvxrZO+CR6jj+M+DBj4LW4y1EU/gjla80xIdxAyDpjqGsew2D+5Jj6\ns6nsGCmhQ6b+Fr3BSwlJXVZbk+xqpYyiVi4m0Faz0Lcg/am2SkAGjj8Xgh6YQkJS\nt9tHqyrVYfW5C1FU+FXZaVcvic4J4+EsCJClkPcCgYBpEsZ7Bsfyql7nAPeX5Iw8\nbpsIp/d4cOBqG26u35gOK/+MJLEJw6z0lebDNZJVlSxLtLYKIVeAUddDdOi81eAZ\n8ov5FmoSBG2Dd7NbPxmhxltQMgYh9kN6e7Scko5a5TQ7WfHgOWVUsrOllq2IhSro\nXdftFqV0kMNA8JDNbR1uFA==\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n');
      const storageBucket = "vinoroute-e8d8d.appspot.com";

      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
          databaseURL: `https://vinoroute-e8d8d.firebaseio.com`,
          storageBucket: storageBucket,
        });
      } catch (error) {
          throw new Error(`Firebase admin initialization error: ${error.message}`);
      }
    }
    return {
      adminDb: admin.firestore(),
      adminAuth: admin.auth(),
      adminStorage: admin.storage(),
    };
  };

async function seedJokes() {
  const { adminDb } = initializeFirebaseAdmin();

  if (!adminDb) {
    console.error('Firebase admin initialization failed.');
    process.exit(1);
  }

  const jokesCollection = adminDb.collection('jokes');

  // Clear existing jokes to avoid duplicates
  const existingJokes = await jokesCollection.get();
  const deletePromises = [];
  existingJokes.forEach(doc => {
    deletePromises.push(doc.ref.delete());
  });
  await Promise.all(deletePromises);
  console.log('Cleared existing jokes.');

  const lines = jokesText.trim().split('\n');
  const jokes = [];
  for (const line of lines) {
    const jokeText = line.trim();
    if (jokeText) {
      jokes.push(jokeText);
    }
  }

  const addPromises = [];
  for (const jokeText of jokes) {
    addPromises.push(
      jokesCollection.add({
        text: jokeText,
        createdAt: new Date().toISOString(),
      })
    );
  }

  try {
    await Promise.all(addPromises);
    console.log(`Successfully seeded ${jokes.length} jokes.`);
  } catch (error) {
    console.error('Error seeding jokes:', error);
    process.exit(1);
  }
}

seedJokes();
