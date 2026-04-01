const Transaction = require('../models/Transaction');

// @desc    Get dashboard summary
// @route   GET /api/dashboard/summary
// @access  Analyst, Admin
const getSummary = async (req, res, next) => {
  try {
    const summary = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalIncome = 0;
    let totalExpense = 0;
    let incomeCount = 0;
    let expenseCount = 0;

    summary.forEach((item) => {
      if (item._id === 'income') {
        totalIncome = item.total;
        incomeCount = item.count;
      } else if (item._id === 'expense') {
        totalExpense = item.total;
        expenseCount = item.count;
      }
    });

    res.status(200).json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netBalance: totalIncome - totalExpense,
        transactionCounts: { income: incomeCount, expense: expenseCount },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category-wise totals
// @route   GET /api/dashboard/by-category
// @access  Analyst, Admin
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const breakdown = await Transaction.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: { category: '$category', type: '$type' },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    res.status(200).json({ success: true, data: breakdown });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly trends
// @route   GET /api/dashboard/monthly-trends
// @access  Analyst, Admin
const getMonthlyTrends = async (req, res, next) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();

    const trends = await Transaction.aggregate([
      {
        $match: {
          isDeleted: false,
          date: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            type: '$type',
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.month': 1 } },
    ]);

    res.status(200).json({ success: true, year, data: trends });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent transactions
// @route   GET /api/dashboard/recent
// @access  Analyst, Admin
const getRecentActivity = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    const recent = await Transaction.find()
      .populate('createdBy', 'name')
      .sort('-createdAt')
      .limit(limit);

    res.status(200).json({ success: true, data: recent });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSummary, getCategoryBreakdown, getMonthlyTrends, getRecentActivity };
