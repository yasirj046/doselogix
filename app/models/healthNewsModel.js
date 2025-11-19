const mongoose = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const healthNewsSchema = new mongoose.Schema(
  {
    // Source information
    source: {
      type: String,
      required: [true, 'Source is required'],
      enum: ['NIH Pakistan', 'Chughtai Lab'],
      index: true
    },
    
    // News content
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [500, 'Title cannot exceed 500 characters']
    },
    
    link: {
      type: String,
      required: [true, 'Link is required'],
      trim: true
    },
    
    // Date information
    date: {
      type: Date,
      required: [true, 'Date is required'],
      index: true
    },
    
    day: {
      type: Number,
      required: true,
      min: 1,
      max: 31
    },
    
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12
    },
    
    year: {
      type: Number,
      required: true,
      min: 2020,
      max: 2100
    },
    
    // Metadata
    scrapedAt: {
      type: Date,
      default: Date.now
    },
    
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Add pagination plugin
healthNewsSchema.plugin(mongoosePaginate);

// Indexes for better query performance
healthNewsSchema.index({ date: -1 }); // Sort by date descending
healthNewsSchema.index({ source: 1, date: -1 }); // Filter by source and sort by date
healthNewsSchema.index({ isActive: 1, date: -1 }); // Active news sorted by date

// Compound unique index to prevent duplicate news entries
healthNewsSchema.index({ source: 1, title: 1, date: 1 }, { unique: true });

// Virtual for formatted date
healthNewsSchema.virtual('formattedDate').get(function() {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[this.month - 1]} ${this.day}, ${this.year}`;
});

// Ensure virtuals are included in JSON
healthNewsSchema.set('toJSON', { virtuals: true });
healthNewsSchema.set('toObject', { virtuals: true });

// Static method to get latest news
healthNewsSchema.statics.getLatestNews = function(limit = 10) {
  return this.find({ isActive: true })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
};

// Static method to get news by source
healthNewsSchema.statics.getNewsBySource = function(source, limit = 10) {
  return this.find({ source, isActive: true })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
};

// Static method to bulk upsert news
healthNewsSchema.statics.bulkUpsertNews = async function(newsArray) {
  const bulkOps = newsArray.map(news => ({
    updateOne: {
      filter: { 
        source: news.source, 
        title: news.title, 
        date: new Date(news.date) 
      },
      update: { 
        $set: {
          link: news.link,
          day: news.day,
          month: news.month,
          year: news.year,
          scrapedAt: new Date(news.scraped_at || news.scrapedAt),
          isActive: true
        }
      },
      upsert: true
    }
  }));
  
  return this.bulkWrite(bulkOps);
};

const HealthNews = mongoose.model("HealthNews", healthNewsSchema);

module.exports = HealthNews;
