const express = require('express');
// const axios = require('axios');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');
var bodyParser = require('body-parser');
//var app = express();

router.use(bodyParser.json());

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
 router.get('/me',auth, async(req,res) => {
        try{
                const profile = await Profile.findOne({ user: req.user.id }).populate('user',
                ['name','avatar']);
                // console.log(profile);

                if(!profile) {
                    return res.status(400).json({ msg:'There is no profile for this user'});
                }
                res.json(profile);
        }catch(err) {
            console.error(err.message);
            res.status(500).send('server error');

        }
 });

 // @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
 router.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required').not().isEmpty(),
      check('skills', 'Skills is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const {
      company,
      location,
      website,
      bio,
      skills,
      status,
      githubusername,
      youtube,
      twitter,
      instagram,
      linkedin,
      facebook
    } = req.body;

    const profileFields = {}
        profileFields.user = req.user.id;
        if(company) profileFields.company = company;
        if(website) profileFields.website = website;
        if(location) profileFields.location = location;
        if(bio) profileFields.bio = bio;
        if(status) profileFields.status = status;
        if(githubusername) profileFields.githubusername = githubusername;
        if(skills) {
            profileFields.skills = skills.split(',').map(skill => skill.trim());
        }
    

    // Build social object and add to profileFields
    profileFields.social = {};
        if(youtube) profileFields.social.youtube = youtube;
        if(twitter) profileFields.social.twitter = twitter;
        if(facebook) profileFields.social.facebook = facebook;
        if(linkedin) profileFields.social.linkedin = linkedin;
        if(instagram) profileFields.social.instagram = instagram;

    try {
      // Using upsert option (creates new doc if no match is found):
      let profile = await Profile.findOne({ user: req.user.id });
      if(profile){
          profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true, upsert: true }
      );
      return res.json(profile);
     }
     profile = new Profile(profileFields);
     await profile.save();
      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
router.get('/', async (req,res) => {
    try {
        const profiles= await Profile.find().populate('user',['name','avatar']);
        res.json(profiles);
    } catch (err) {
        console.log(err.message);
        res.status(500).send('server error');
    }
});
// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get(
    '/user/:user_id',
    async (req, res) => {
      try {
        const profile = await Profile.findOne({
          user: req.params.user_id
        }).populate('user', ['name', 'avatar']);
  
        if (!profile) return res.status(400).json({ msg: 'Profile not found' });
  
        return res.json(profile);
      } catch (err) {
        console.error(err.message);
        if(err.kind == 'ObjectId'){
        return res.status(500).json({ msg: 'profile not found' });
      }
      res.status(500).send('server error');
    }
    }
  );
  // @route    DELETE api/profile
// @desc     Delete profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {
    try {
    //   // Remove user posts
    //   await Post.deleteMany({ user: req.user.id });
      // Remove profile
      await Profile.findOneAndRemove({ user: req.user.id });
      // Remove user
      await User.findOneAndRemove({ _id: req.user.id });
  
      res.json({ msg: 'User deleted' });
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  });
  // @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private
router.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required').not().isEmpty(),
      check('company', 'Company is required').not().isEmpty(),
      check('from', 'From date is required and needs to be from the past')
        .not()
        .isEmpty()
        //.custom((value, { req }) => (req.body.to ? value < req.body.to : true))
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
// @route    DELETE api/profile/experience/:exp_id
// @desc     Delete experience from profile
// @access   Private

router.delete('/experience/:exp_id', auth, async (req, res) => {
  try {
        const profile = await Profile.findOne({ user: req.user.id });
    
        //get remove index
        const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);
        profile.experience.splice(removeIndex ,1);
        await profile.save();
        return res.status(200).json(profile);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
      }
    });


    // @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private
router.put(
  '/education',
  [
    auth,
    [
      check('school', 'school is required').not().isEmpty(),
      check('degree', 'degree is required').not().isEmpty(),
      check('fieldofstudy', 'fieldofstudy is required').not().isEmpty(),

      check('from', 'From date is required and needs to be from the past')
        .not()
        .isEmpty()
        //.custom((value, { req }) => (req.body.to ? value < req.body.to : true))
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.education.unshift(newEdu);

      await profile.save();

      res.json(profile);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
  }
);
// @route    DELETE api/profile/education/:edu_id
// @desc     Delete education from profile
// @access   Private

router.delete('/education/:edu_id', auth, async (req, res) => {
  try {
        const profile = await Profile.findOne({ user: req.user.id });
    
        //get remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);
        profile.education.splice(removeIndex ,1);
        await profile.save();
        return res.status(200).json(profile);
      } catch (error) {
        console.error(error);
        return res.status(500).json({ msg: 'Server error' });
      }
    });





    
 module.exports = router;