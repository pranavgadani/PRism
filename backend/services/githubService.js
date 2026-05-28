const axios = require('axios');

const fetchPRDiff = async (owner, repo, pullNumber, accessToken) => {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3.diff',
      },
    }
  );
  return response.data;
};

const fetchPRDetails = async (owner, repo, pullNumber, accessToken) => {
  const response = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    }
  );
  return response.data;
};

module.exports = { fetchPRDiff, fetchPRDetails };
