const express = require('express');
const multer = require('multer');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
const upload = multer();

app.use(cors());
app.use(express.json());

const openaiApiKey = process.env.OPENAI_API_KEY;
const facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
const facebookPageId = process.env.FACEBOOK_PAGE_ID;

app.post('/api/generate-captions', upload.array('images'), async (req, res) => {
  const captions = {};

  for (const file of req.files) {
    const fileName = file.originalname.split('.')[0];
    const prompt = `Generate a Facebook caption for an image named '${fileName}'`;

    try {
      const response = await axios.post('https://api.openai.com/v1/engines/text-davinci-003/completions', {
        prompt,
        max_tokens: 50,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`,
        },
      });

      captions[file.originalname] = response.data.choices[0].text.trim();
    } catch (error) {
      console.error(`Error generating caption for ${file.originalname}:`, error);
      captions[file.originalname] = 'Error generating caption';
    }
  }

  res.json(captions);
});

app.post('/api/post-to-facebook', async (req, res) => {
  const { images, captions } = req.body;

  for (const image of images) {
    try {
      await axios.post(`https://graph.facebook.com/${facebookPageId}/photos`, {
        url: image,
        caption: captions[image],
        access_token: facebookAccessToken,
      });
    } catch (error) {
      console.error(`Error posting image to Facebook:`, error);
    }
  }

  res.json({ message: 'Images posted to Facebook' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
