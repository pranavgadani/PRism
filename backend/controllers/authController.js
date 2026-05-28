const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// GET /auth/github — redirect to GitHub OAuth
const redirectToGitHub = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: process.env.GITHUB_CALLBACK_URL,
    scope: 'read:user repo',
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

// GET /auth/github/callback — exchange code, upsert user, return JWT
const handleGitHubCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.redirect(`${process.env.CLIENT_URL}?error=no_code`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: process.env.GITHUB_CALLBACK_URL,
      },
      { headers: { Accept: 'application/json' } }
    );

    const { access_token, error } = tokenResponse.data;
    if (error || !access_token) {
      return res.redirect(`${process.env.CLIENT_URL}?error=token_exchange_failed`);
    }

    // Fetch GitHub user profile
    const profileResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${access_token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const { id, login, avatar_url } = profileResponse.data;

    // Upsert user in MongoDB
    const user = await User.findOneAndUpdate(
      { githubId: String(id) },
      { githubId: String(id), username: login, avatarUrl: avatar_url, accessToken: access_token },
      { upsert: true, new: true, runValidators: true }
    );

    // Sign JWT
    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    // Redirect to client with token
    res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${jwtToken}`);
  } catch (err) {
    console.error('GitHub OAuth Error:', err.message);
    res.redirect(`${process.env.CLIENT_URL}?error=auth_failed`);
  }
};

// GET /auth/me — return current user info
const getMe = async (req, res) => {
  res.json({
    id: req.user._id,
    username: req.user.username,
    avatarUrl: req.user.avatarUrl,
    createdAt: req.user.createdAt,
  });
};

module.exports = { redirectToGitHub, handleGitHubCallback, getMe };
