import weaviate from 'weaviate-ts-client';
import { readFileSync, writeFileSync } from 'fs';
import * as fs from 'fs';

/* client initialization */
const client = weaviate.client({
  scheme: 'http',
  host: 'localhost:8080',
});
console.log('Listening on localhost:8080');

/* schema defination */
const schemaConfig = {
  class: 'Meme',
  vectorizer: 'img2vec-neural',
  vectorIndexType: 'hnsw',
  moduleConfig: {
    'img2vec-neural': {
      imageFields: ['image'],
    },
  },
  properties: [
    {
      name: 'image',
      dataType: ['blob'],
    },
    {
      name: 'text',
      dataType: ['string'],
    },
  ],
};

await client.schema.classCreator().withClass(schemaConfig).do();

const schemaRes = await client.schema.getter().do();

console.log('Schema created!');
console.log(schemaRes);

/* vectorize & store images as base64 */

console.log('Vectorizing data...');
const imgFiles = fs.readdirSync('./data');

const promises = imgFiles.map(async imgFile => {
  const b64 = Buffer.from(readFileSync(`./data/${imgFile}`)).toString('base64');

  await client.data
    .creator()
    .withClassName('Meme')
    .withProperties({
      image: b64,
      text: imgFile.split('.')[0].split('_').join(' '),
    })
    .do();
});

await Promise.all(promises);

console.log('Storing data done!');

/* query */

console.log('Querying data...');

const test = Buffer.from(readFileSync('./query.jpg')).toString('base64');

const resImage = await client.graphql
  .get()
  .withClassName('Meme')
  .withFields(['image'])
  .withNearImage({ image: test })
  .withLimit(1)
  .do();

const result = resImage.data.Get.Meme[0].image;
writeFileSync('./result.jpg', result, 'base64');

console.log("Done! Result is save to 'result.jpg'");
