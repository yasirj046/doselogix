const healthNewsService = require('../services/healthNewsService');
const { createResponse } = require('../util/util');
const axios = require('axios');

/**
 * Get all health news with pagination
 */
exports.getAllHealthNews = async (req, res) => {
  try {
    const page = parseInt(req.query.pageNumber) || 1;
    const limit = parseInt(req.query.pageSize) || 20;
    const source = req.query.source || "";

    const result = await healthNewsService.getAllHealthNews(page, limit, source);
    
    res.status(200).json(createResponse(result, null, "Health news retrieved successfully"));
  } catch (error) {
    console.error('Error in getAllHealthNews:', error);
    res.status(200).json(createResponse([], error));
  }
};

/**
 * Get latest health news (limited)
 */
exports.getLatestHealthNews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const news = await healthNewsService.getLatestHealthNews(limit);
    
    res.status(200).json(
      createResponse(news, null, "Latest health news retrieved successfully")
    );
  } catch (error) {
    console.error('Error in getLatestHealthNews:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

/**
 * Sync health news from Python server
 */
exports.syncHealthNews = async (req, res) => {
  try {
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
    
    // Fetch news from Python server
    const response = await axios.get(`${pythonServerUrl}/api/health-news`);
    
    if (!response.data || !response.data.news) {
      return res.status(400).json(
        createResponse(null, "Invalid response from Python server")
      );
    }
    
    // Store news in database
    const result = await healthNewsService.syncHealthNews(response.data.news);
    
    res.status(200).json(
      createResponse(result, null, "Health news synced successfully")
    );
  } catch (error) {
    console.error('Error in syncHealthNews:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

/**
 * Manually trigger refresh on Python server and sync
 */
exports.refreshHealthNews = async (req, res) => {
  try {
    const pythonServerUrl = process.env.PYTHON_SERVER_URL || 'http://localhost:8000';
    
    // Trigger refresh on Python server
    const response = await axios.post(`${pythonServerUrl}/api/health-news/refresh`);
    
    if (!response.data || !response.data.news) {
      return res.status(400).json(
        createResponse(null, "Invalid response from Python server")
      );
    }
    
    // Store news in database
    const result = await healthNewsService.syncHealthNews(response.data.news);
    
    res.status(200).json(
      createResponse(result, null, "Health news refreshed and synced successfully")
    );
  } catch (error) {
    console.error('Error in refreshHealthNews:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

/**
 * Get health news by source
 */
exports.getHealthNewsBySource = async (req, res) => {
  try {
    const { source } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const news = await healthNewsService.getHealthNewsBySource(source, limit);
    
    res.status(200).json(
      createResponse(news, null, `Health news from ${source} retrieved successfully`)
    );
  } catch (error) {
    console.error('Error in getHealthNewsBySource:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};

/**
 * Delete old health news (cleanup)
 */
exports.deleteOldHealthNews = async (req, res) => {
  try {
    const daysOld = parseInt(req.query.daysOld) || 365; // Default 1 year
    
    const result = await healthNewsService.deleteOldHealthNews(daysOld);
    
    res.status(200).json(
      createResponse(result, null, `Deleted health news older than ${daysOld} days`)
    );
  } catch (error) {
    console.error('Error in deleteOldHealthNews:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};


/**
 * Import health news from an internal trusted source (Python scraper)
 * Expects header 'x-internal-token' to match process.env.INTERNAL_HEALTH_NEWS_TOKEN
 */
exports.importHealthNews = async (req, res) => {
  try {
    const token = req.headers['x-internal-token'] || req.headers['X-Internal-Token'];
    const expected = process.env.INTERNAL_HEALTH_NEWS_TOKEN || '';

    if (!expected || token !== expected) {
      console.warn('Unauthorized import attempt for health news');
      return res.status(401).json(createResponse(null, 'Unauthorized'));
    }

    const newsArray = req.body;
    if (!Array.isArray(newsArray)) {
      return res.status(400).json(createResponse(null, 'Payload must be an array of news items'));
    }

    const result = await healthNewsService.syncHealthNews(newsArray);

    return res.status(200).json(createResponse(result, null, 'Health news imported successfully'));
  } catch (error) {
    console.error('Error in importHealthNews:', error);
    res.status(400).json(createResponse(null, error.message));
  }
};
