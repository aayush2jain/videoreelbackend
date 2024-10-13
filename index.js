const express = require('express');
const ytdl = require('ytdl-core');
const cors = require('cors');
const {Downloader} = require("ytdl-mp3")
const app = express();
const port = 4000;
const cookieSession = require("cookie-session");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

// Configure cookie session
app.use(cookieSession({
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  keys: ['11hhahsjba']
}));
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true // Allow credentials (cookies, headers, etc.)
}));
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());



// Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: '41139617399-5j4u88lmjqaskkgj3nb0tf871gb9folo.apps.googleusercontent.com',
  clientSecret: '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',
  callbackURL: '/auth/google/callback',
}, (accessToken, refreshToken, profile, done) => {
    console.log("Google profile: ", profile);
     done(null, profile); 
      }
    )
);
// Serialize and deserialize user sessions
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

// Routes
// app.get('/auth/google', passport.authenticate('google', {
//   scope: ['profile', 'email'],
// }));
app.get('/auth/google', (req, res, next) => {
  const videoUrl = req.query.videoUrl;
  
  // Store the video URL in the session
  req.session.videoUrl = videoUrl;

  // Proceed with Google authentication
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })(req, res, next);
});

app.get('/auth/google/callback', passport.authenticate('google', {
  failureRedirect: '/'
}), (req, res) => {
  // Retrieve the videoUrl query parameter from the original request
  // const videoUrl = req.session.videoUrl;

  // Now you have the video URL, and you can redirect or use it as needed
  // console.log("Received video URL:", videoUrl);
  // console.log('hello',req.user.displayName);

  const name = req.user.displayName;
  const email = req.user.emails[0].value;
  res.json({name,email});
  // Example: Redirecting to a frontend page with the video URL
  // res.redirect(`${videoUrl}`);
});


// Route for downloading YouTube videos
app.get('/detail', async (req, res) => {
    console.log("check1complete");
 
   videoUrl = req.query.url;
    console.log(videoUrl);
    if (!ytdl.validateURL(videoUrl)) {
        return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    //aythor details  thumbnails keywords viewcount description title
    //related_videos
    try {
        const videoInfo = await ytdl.getInfo(videoUrl);
        const videodetails = videoInfo.videoDetails;
        const videoTitle = videoInfo.videoDetails.title;
        console.log(videodetails);
        res.json({videodetails});
        
    } catch (error) {
        res.status(500).json({ error: 'Failed to download video' });
    }
});
app.get('/download', async (req, res) => {
    const videoUrl = req.query.url;
    // Check if URL is valid
    if (!videoUrl) {
        return res.status(400).json({ error: 'YouTube URL is required' });
    }
    console.log("Downloading video from URL:", videoUrl);
    const downloader = new Downloader({
         getTags: false//metadata nahi aan chaiye
    });

    try {
        // Try downloading the song
        await downloader.downloadSong(videoUrl, './downloads'); // Specify the download path

        console.log("✅ Video download complete");
        res.status(200).json({ message: "Video has been downloaded successfully!" });

    } catch (error) {
        console.error('❌ Error downloading video:', error.message);
        res.status(500).json({ error: 'Failed to download video', details: error.message });
    }
});
app.get('/',async (req,res)=>{
  res.send("server is running");
})
app.listen(port || 4000, () => {
    console.log(`Server running on port ${port}`);
});
