const HealthNews = require('../models/healthNewsModel');

/**
 * Get all health news with pagination
 */
exports.getAllHealthNews = async (page, limit, source) => {
  try {
    let query = { isActive: true };
    
    // Filter by source if provided
    if (source && source !== "") {
      query.source = source;
    }

    return await HealthNews.paginate(query, { 
      page, 
      limit,
      sort: { date: -1 }
    });
  } catch (error) {
    console.error('Error in getAllHealthNews:', error);
    throw error;
  }
};

/**
 * Get latest health news
 */
exports.getLatestHealthNews = async (limit = 10) => {
  try {
    return await HealthNews.getLatestNews(limit);
  } catch (error) {
    console.error('Error in getLatestHealthNews:', error);
    throw error;
  }
};

/**
 * Get health news by source
 */
exports.getHealthNewsBySource = async (source, limit = 10) => {
  try {
    return await HealthNews.getNewsBySource(source, limit);
  } catch (error) {
    console.error('Error in getHealthNewsBySource:', error);
    throw error;
  }
};

/**
 * Sync health news from Python server
 * Uses bulk upsert to avoid duplicates
 */
exports.syncHealthNews = async (newsArray) => {
  try {
    if (!newsArray || newsArray.length === 0) {
      return { message: 'No news to sync', count: 0 };
    }

    const result = await HealthNews.bulkUpsertNews(newsArray);
    
    return {
      message: 'Health news synced successfully',
      inserted: result.nUpserted || 0,
      updated: result.nModified || 0,
      total: newsArray.length
    };
  } catch (error) {
    console.error('Error in syncHealthNews:', error);
    throw error;
  }
};

/**
 * Delete old health news
 */
exports.deleteOldHealthNews = async (daysOld = 365) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await HealthNews.updateMany(
      { date: { $lt: cutoffDate } },
      { $set: { isActive: false } }
    );
    
    return {
      message: `Marked old health news as inactive`,
      count: result.modifiedCount || 0
    };
  } catch (error) {
    console.error('Error in deleteOldHealthNews:', error);
    throw error;
  }
};

/**
 * Get health news count by source
 */
exports.getHealthNewsStats = async () => {
  try {
    const stats = await HealthNews.aggregate([
      { $match: { isActive: true } },
      { 
        $group: {
          _id: '$source',
          count: { $sum: 1 },
          latestDate: { $max: '$date' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const total = await HealthNews.countDocuments({ isActive: true });
    
    return {
      total,
      bySource: stats
    };
  } catch (error) {
    console.error('Error in getHealthNewsStats:', error);
    throw error;
  }
};
